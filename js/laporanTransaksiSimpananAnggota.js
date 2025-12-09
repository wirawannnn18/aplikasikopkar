// Laporan Transaksi dan Simpanan Anggota Module

// ============================================================================
// ERROR HANDLING - Task 14
// ============================================================================

/**
 * Custom Error Classes for Better Error Handling
 */
class LaporanError extends Error {
    constructor(message, code, details = {}) {
        super(message);
        this.name = 'LaporanError';
        this.code = code;
        this.details = details;
        this.timestamp = new Date().toISOString();
    }
}

class DataLoadError extends LaporanError {
    constructor(message, details) {
        super(message, 'DATA_LOAD_ERROR', details);
        this.name = 'DataLoadError';
    }
}

class ValidationError extends LaporanError {
    constructor(message, details) {
        super(message, 'VALIDATION_ERROR', details);
        this.name = 'ValidationError';
    }
}

class ExportError extends LaporanError {
    constructor(message, details) {
        super(message, 'EXPORT_ERROR', details);
        this.name = 'ExportError';
    }
}

/**
 * Simple error tracker for production monitoring
 */
class ErrorTracker {
    constructor() {
        this.errors = [];
        this.maxErrors = 50;
    }
    
    log(error) {
        const errorLog = {
            timestamp: new Date().toISOString(),
            name: error.name || 'Error',
            message: error.message || 'Unknown error',
            code: error.code || 'UNKNOWN',
            details: error.details || {},
            stack: error.stack || '',
            userAgent: navigator.userAgent,
            url: window.location.href
        };
        
        this.errors.unshift(errorLog);
        
        if (this.errors.length > this.maxErrors) {
            this.errors = this.errors.slice(0, this.maxErrors);
        }
        
        try {
            localStorage.setItem('errorLogs', JSON.stringify(this.errors));
        } catch (e) {
            console.error('Failed to store error logs:', e);
        }
    }
    
    getErrors() {
        return this.errors;
    }
    
    clear() {
        this.errors = [];
        try {
            localStorage.removeItem('errorLogs');
        } catch (e) {
            console.error('Failed to clear error logs:', e);
        }
    }
}

// Initialize global error tracker
if (!window.errorTracker) {
    window.errorTracker = new ErrorTracker();
}

/**
 * Data Validators
 */
const DataValidators = {
    isValidAnggotaArray(data) {
        if (!Array.isArray(data)) return false;
        if (data.length === 0) return true;
        const sample = data[0];
        return sample && typeof sample.id !== 'undefined' && typeof sample.nama !== 'undefined';
    },
    
    isValidTransaksiArray(data) {
        if (!Array.isArray(data)) return false;
        if (data.length === 0) return true;
        const sample = data[0];
        return sample && typeof sample.id !== 'undefined' && typeof sample.anggotaId !== 'undefined';
    },
    
    isValidSimpananArray(data) {
        if (!Array.isArray(data)) return false;
        if (data.length === 0) return true;
        const sample = data[0];
        return sample && typeof sample.anggotaId !== 'undefined' && typeof sample.jenis !== 'undefined';
    },
    
    isValidNumber(value) {
        return typeof value === 'number' && !isNaN(value) && isFinite(value);
    },
    
    isValidDate(dateStr) {
        if (!dateStr) return false;
        const date = new Date(dateStr);
        return date instanceof Date && !isNaN(date);
    }
};

/**
 * Safe calculation functions
 */
function safeAdd(a, b) {
    const numA = parseFloat(a) || 0;
    const numB = parseFloat(b) || 0;
    return numA + numB;
}

function safeDivide(numerator, denominator, defaultValue = 0) {
    const num = parseFloat(numerator) || 0;
    const den = parseFloat(denominator) || 0;
    
    if (den === 0) {
        return defaultValue;
    }
    
    const result = num / den;
    return DataValidators.isValidNumber(result) ? result : defaultValue;
}

function safePercentage(part, total, decimals = 2) {
    const percentage = safeDivide(part, total, 0) * 100;
    return parseFloat(percentage.toFixed(decimals));
}

function safeCurrencyFormat(value) {
    try {
        const num = parseFloat(value) || 0;
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(num);
    } catch (error) {
        console.error('Error formatting currency:', error);
        return 'Rp 0';
    }
}

// ============================================================================
// PERFORMANCE OPTIMIZATIONS - Task 13
// ============================================================================

/**
 * Cache Manager for Report Data
 * Caches aggregated results to avoid recalculation
 */
class LaporanCacheManager {
    constructor() {
        this.cache = new Map();
        this.cacheTimestamps = new Map();
        this.cacheTTL = 5 * 60 * 1000; // 5 minutes TTL
    }
    
    /**
     * Get cached data
     * @param {string} key - Cache key
     * @returns {*} Cached data or null
     */
    get(key) {
        const timestamp = this.cacheTimestamps.get(key);
        
        // Check if cache exists and is not expired
        if (timestamp && (Date.now() - timestamp < this.cacheTTL)) {
            return this.cache.get(key);
        }
        
        // Cache expired or doesn't exist
        this.invalidate(key);
        return null;
    }
    
    /**
     * Set cache data
     * @param {string} key - Cache key
     * @param {*} data - Data to cache
     */
    set(key, data) {
        this.cache.set(key, data);
        this.cacheTimestamps.set(key, Date.now());
    }
    
    /**
     * Invalidate specific cache key
     * @param {string} key - Cache key
     */
    invalidate(key) {
        this.cache.delete(key);
        this.cacheTimestamps.delete(key);
    }
    
    /**
     * Clear all cache
     */
    clear() {
        this.cache.clear();
        this.cacheTimestamps.clear();
    }
    
    /**
     * Get cache statistics
     * @returns {Object} Cache stats
     */
    getStats() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys())
        };
    }
}

// Global cache instance
const laporanCache = new LaporanCacheManager();

/**
 * Debounce function for search input
 * Delays function execution until after wait time has elapsed
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, wait) {
    let timeout;
    
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Pagination Manager for Large Datasets
 * Manages pagination state and data slicing
 */
class PaginationManager {
    constructor(itemsPerPage = 25) {
        this.itemsPerPage = itemsPerPage;
        this.currentPage = 1;
        this.totalItems = 0;
        this.totalPages = 0;
    }
    
    /**
     * Set total items and calculate pages
     * @param {number} total - Total number of items
     */
    setTotalItems(total) {
        this.totalItems = total;
        this.totalPages = Math.ceil(total / this.itemsPerPage);
        
        // Reset to page 1 if current page exceeds total pages
        if (this.currentPage > this.totalPages) {
            this.currentPage = 1;
        }
    }
    
    /**
     * Get paginated data
     * @param {Array} data - Full dataset
     * @returns {Array} Paginated data slice
     */
    getPaginatedData(data) {
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        return data.slice(startIndex, endIndex);
    }
    
    /**
     * Go to specific page
     * @param {number} page - Page number
     */
    goToPage(page) {
        if (page >= 1 && page <= this.totalPages) {
            this.currentPage = page;
        }
    }
    
    /**
     * Go to next page
     */
    nextPage() {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
        }
    }
    
    /**
     * Go to previous page
     */
    previousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
        }
    }
    
    /**
     * Get pagination info
     * @returns {Object} Pagination information
     */
    getInfo() {
        return {
            currentPage: this.currentPage,
            totalPages: this.totalPages,
            itemsPerPage: this.itemsPerPage,
            totalItems: this.totalItems,
            startIndex: (this.currentPage - 1) * this.itemsPerPage + 1,
            endIndex: Math.min(this.currentPage * this.itemsPerPage, this.totalItems)
        };
    }
}

// Global pagination instance
let laporanPagination = new PaginationManager(25);

/**
 * Loading Indicator Manager
 * Shows/hides loading indicators for async operations
 */
class LoadingIndicatorManager {
    /**
     * Show loading indicator
     * @param {string} targetId - Target element ID
     * @param {string} message - Loading message
     */
    show(targetId, message = 'Memuat data...') {
        const target = document.getElementById(targetId);
        if (!target) return;
        
        const loadingHTML = `
            <div class="loading-indicator text-center py-5" id="loadingIndicator-${targetId}">
                <div class="spinner-border text-primary" role="status" style="width: 3rem; height: 3rem;">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-3 text-muted">${message}</p>
            </div>
        `;
        
        target.innerHTML = loadingHTML;
    }
    
    /**
     * Hide loading indicator
     * @param {string} targetId - Target element ID
     */
    hide(targetId) {
        const indicator = document.getElementById(`loadingIndicator-${targetId}`);
        if (indicator) {
            indicator.remove();
        }
    }
    
    /**
     * Show inline loading spinner
     * @param {string} targetId - Target element ID
     */
    showInline(targetId) {
        const target = document.getElementById(targetId);
        if (!target) return;
        
        const spinner = document.createElement('span');
        spinner.id = `inlineSpinner-${targetId}`;
        spinner.className = 'spinner-border spinner-border-sm ms-2';
        spinner.setAttribute('role', 'status');
        spinner.innerHTML = '<span class="visually-hidden">Loading...</span>';
        
        target.appendChild(spinner);
    }
    
    /**
     * Hide inline loading spinner
     * @param {string} targetId - Target element ID
     */
    hideInline(targetId) {
        const spinner = document.getElementById(`inlineSpinner-${targetId}`);
        if (spinner) {
            spinner.remove();
        }
    }
}

// Global loading indicator instance
const loadingIndicator = new LoadingIndicatorManager();

// ============================================================================
// END PERFORMANCE OPTIMIZATIONS
// ============================================================================

/**
 * Enhanced safe data loading with validation - Task 14
 * @param {string} key - localStorage key
 * @param {*} defaultValue - default value if data not found or error
 * @param {Function} validator - Optional validation function
 * @returns {*} Parsed data or default value
 */
function safeGetData(key, defaultValue = [], validator = null) {
    try {
        // Check if localStorage is available
        if (typeof localStorage === 'undefined') {
            throw new DataLoadError('localStorage is not available', { key });
        }
        
        const data = localStorage.getItem(key);
        
        // Return default if no data
        if (!data || data === 'null' || data === 'undefined') {
            console.warn(`No data found for key: ${key}, using default value`);
            return defaultValue;
        }
        
        // Parse JSON
        let parsedData;
        try {
            parsedData = JSON.parse(data);
        } catch (parseError) {
            throw new DataLoadError(`Failed to parse JSON for key: ${key}`, {
                key,
                parseError: parseError.message
            });
        }
        
        // Validate data structure if validator provided
        if (validator && typeof validator === 'function') {
            if (!validator(parsedData)) {
                throw new ValidationError(`Data validation failed for key: ${key}`, {
                    key,
                    data: parsedData
                });
            }
        }
        
        return parsedData;
        
    } catch (error) {
        console.error(`Error loading ${key} from localStorage:`, error);
        
        // Log to error tracking if available
        if (window.errorTracker) {
            window.errorTracker.log(error);
        }
        
        return defaultValue;
    }
}

/**
 * Safe numeric sum operation
 * @param {Array} array - Array of objects
 * @param {string} key - Key to sum
 * @returns {number} Sum of values
 */
function safeSum(array, key) {
    if (!Array.isArray(array)) {
        return 0;
    }
    
    return array.reduce((sum, item) => {
        const value = parseFloat(item[key]) || 0;
        return sum + value;
    }, 0);
}

/**
 * AnggotaDataAggregator Class
 * Aggregates transaction and savings data for a member
 */
class AnggotaDataAggregator {
    constructor(anggotaId) {
        this.anggotaId = anggotaId;
        this.anggota = null;
        this.transaksi = [];
        this.simpanan = {
            pokok: [],
            wajib: [],
            sukarela: []
        };
    }
    
    /**
     * Load all data for the member - Enhanced with validation (Task 14)
     * @returns {boolean} Success status
     */
    loadData() {
        try {
            // Load anggota data with validation
            const allAnggota = safeGetData('anggota', [], DataValidators.isValidAnggotaArray);
            
            // Find specific anggota
            this.anggota = allAnggota.find(a => a.id === this.anggotaId);
            
            if (!this.anggota) {
                throw new DataLoadError(`Anggota not found with ID: ${this.anggotaId}`, {
                    anggotaId: this.anggotaId
                });
            }
            
            // Load transaction data with validation
            const allPenjualan = safeGetData('penjualan', [], DataValidators.isValidTransaksiArray);
            this.transaksi = allPenjualan.filter(p => p.anggotaId === this.anggotaId);
            
            // Load simpanan data with validation
            const simpananPokok = safeGetData('simpananPokok', [], DataValidators.isValidSimpananArray);
            const simpananWajib = safeGetData('simpananWajib', [], DataValidators.isValidSimpananArray);
            const simpananSukarela = safeGetData('simpananSukarela', [], DataValidators.isValidSimpananArray);
            
            this.simpanan.pokok = simpananPokok.filter(s => 
                s.anggotaId === this.anggotaId && s.jumlah > 0
            );
            this.simpanan.wajib = simpananWajib.filter(s => 
                s.anggotaId === this.anggotaId && s.jumlah > 0
            );
            this.simpanan.sukarela = simpananSukarela.filter(s => 
                s.anggotaId === this.anggotaId && s.jumlah > 0
            );
            
            return true;
            
        } catch (error) {
            console.error('Error loading data for anggota:', error);
            
            // Set empty data to allow graceful degradation
            this.anggota = null;
            this.transaksi = [];
            this.simpanan = { pokok: [], wajib: [], sukarela: [] };
            
            // Show user-friendly error
            if (error instanceof DataLoadError) {
                showAlert(`Gagal memuat data: ${error.message}`, 'error');
            } else {
                showAlert('Terjadi kesalahan saat memuat data anggota', 'error');
            }
            
            // Log to error tracker
            if (window.errorTracker) {
                window.errorTracker.log(error);
            }
            
            return false;
        }
    }
    
    /**
     * Get total cash transactions
     * @returns {number} Total cash amount
     */
    getTotalTransaksiCash() {
        const cashTransaksi = this.transaksi.filter(t => t.metode === 'cash');
        return safeSum(cashTransaksi, 'total');
    }
    
    /**
     * Get total bon (credit) transactions
     * @returns {number} Total bon amount
     */
    getTotalTransaksiBon() {
        const bonTransaksi = this.transaksi.filter(t => t.metode === 'bon');
        return safeSum(bonTransaksi, 'total');
    }
    
    /**
     * Get outstanding balance (unpaid bon)
     * @returns {number} Outstanding balance
     */
    getOutstandingBalance() {
        const unpaidBon = this.transaksi.filter(t => 
            t.metode === 'bon' && t.status === 'kredit'
        );
        return safeSum(unpaidBon, 'total');
    }
    
    /**
     * Get total simpanan pokok
     * @returns {number} Total simpanan pokok
     */
    getTotalSimpananPokok() {
        return safeSum(this.simpanan.pokok, 'jumlah');
    }
    
    /**
     * Get total simpanan wajib
     * @returns {number} Total simpanan wajib
     */
    getTotalSimpananWajib() {
        return safeSum(this.simpanan.wajib, 'jumlah');
    }
    
    /**
     * Get total simpanan sukarela
     * @returns {number} Total simpanan sukarela
     */
    getTotalSimpananSukarela() {
        return safeSum(this.simpanan.sukarela, 'jumlah');
    }
    
    /**
     * Get total all simpanan
     * @returns {number} Total all simpanan
     */
    getTotalSimpanan() {
        return this.getTotalSimpananPokok() + 
               this.getTotalSimpananWajib() + 
               this.getTotalSimpananSukarela();
    }
    
    /**
     * Get transaction list
     * @returns {Array} Array of transactions
     */
    getTransaksiList() {
        return this.transaksi;
    }
    
    /**
     * Get simpanan list by type
     * @param {string} type - 'pokok', 'wajib', or 'sukarela'
     * @returns {Array} Array of simpanan
     */
    getSimpananList(type) {
        if (!this.simpanan[type]) {
            return [];
        }
        return this.simpanan[type];
    }
    
    /**
     * Get aggregated report data
     * @returns {Object} Aggregated data object
     */
    getAggregatedData() {
        if (!this.anggota) {
            return null;
        }
        
        return {
            anggotaId: this.anggotaId,
            nik: this.anggota.nik || '',
            nama: this.anggota.nama || '',
            noKartu: this.anggota.noKartu || '',
            departemen: this.anggota.departemen || '',
            tipeAnggota: this.anggota.tipeAnggota || '',
            status: this.anggota.status || '',
            
            // Transaction summary
            transaksi: {
                totalCash: this.getTotalTransaksiCash(),
                totalBon: this.getTotalTransaksiBon(),
                countCash: this.transaksi.filter(t => t.metode === 'cash').length,
                countBon: this.transaksi.filter(t => t.metode === 'bon').length,
                outstandingBalance: this.getOutstandingBalance()
            },
            
            // Savings summary
            simpanan: {
                pokok: this.getTotalSimpananPokok(),
                wajib: this.getTotalSimpananWajib(),
                sukarela: this.getTotalSimpananSukarela(),
                total: this.getTotalSimpanan()
            },
            
            // Grand total
            grandTotal: this.getTotalTransaksiCash() + 
                       this.getTotalTransaksiBon() + 
                       this.getTotalSimpanan()
        };
    }
}

/**
 * Get aggregated report data for all active members
 * WITH CACHING - Task 13 Performance Optimization
 * @param {boolean} forceRefresh - Force cache refresh
 * @returns {Array} Array of aggregated data for all members
 */
function getAnggotaReportData(forceRefresh = false) {
    try {
        // Check cache first (unless force refresh)
        if (!forceRefresh) {
            const cachedData = laporanCache.get('reportData');
            if (cachedData) {
                console.log('[Performance] Using cached report data');
                return cachedData;
            }
        }
        
        console.log('[Performance] Generating fresh report data');
        
        // Load all anggota
        const allAnggota = safeGetData('anggota', []);
        
        // Filter active anggota (exclude those with statusKeanggotaan === 'Keluar')
        const activeAnggota = filterActiveAnggota(allAnggota);
        
        // Aggregate data for each anggota
        const reportData = [];
        
        for (const anggota of activeAnggota) {
            const aggregator = new AnggotaDataAggregator(anggota.id);
            
            if (aggregator.loadData()) {
                const data = aggregator.getAggregatedData();
                if (data) {
                    reportData.push(data);
                }
            }
        }
        
        // Cache the result
        laporanCache.set('reportData', reportData);
        
        return reportData;
    } catch (error) {
        console.error('Error getting anggota report data:', error);
        return [];
    }
}

/**
 * Calculate statistics from report data
 * @param {Array} data - Array of aggregated report data
 * @returns {Object} Statistics object
 */
function calculateStatistics(data) {
    if (!Array.isArray(data) || data.length === 0) {
        return {
            totalAnggota: 0,
            totalTransaksi: 0,
            totalSimpanan: 0,
            totalOutstanding: 0
        };
    }
    
    return {
        totalAnggota: data.length,
        totalTransaksi: data.reduce((sum, item) => 
            sum + item.transaksi.totalCash + item.transaksi.totalBon, 0
        ),
        totalSimpanan: data.reduce((sum, item) => 
            sum + item.simpanan.total, 0
        ),
        totalOutstanding: data.reduce((sum, item) => 
            sum + item.transaksi.outstandingBalance, 0
        )
    };
}


/**
 * Check access to laporan transaksi simpanan
 * @returns {boolean} True if user has access
 */
function checkLaporanAccess() {
    // Get current user from localStorage
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    
    // Check if user is logged in
    if (!currentUser || !currentUser.role) {
        showAlert('Silakan login terlebih dahulu', 'warning');
        navigateTo('login');
        return false;
    }
    
    // Allowed roles: admin, kasir, anggota
    const allowedRoles = ['super_admin', 'administrator', 'kasir', 'anggota'];
    
    if (!allowedRoles.includes(currentUser.role)) {
        showAlert('Anda tidak memiliki akses ke halaman ini', 'error');
        navigateTo('dashboard');
        return false;
    }
    
    return true;
}

/**
 * Get report data filtered by user role
 * Admin and kasir see all data, anggota only sees their own data
 * @returns {Array} Filtered report data
 */
function getFilteredReportDataByRole() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const allReportData = getAnggotaReportData();
    
    // Admin and kasir can see all data
    if (currentUser.role === 'super_admin' || 
        currentUser.role === 'administrator' || 
        currentUser.role === 'kasir') {
        return allReportData;
    }
    
    // Anggota can only see their own data
    if (currentUser.role === 'anggota') {
        // Find anggota by user ID or username
        const anggotaList = safeGetData('anggota', []);
        const userAnggota = anggotaList.find(a => 
            a.userId === currentUser.id || 
            a.username === currentUser.username ||
            a.id === currentUser.anggotaId
        );
        
        if (!userAnggota) {
            console.warn('Anggota data not found for user:', currentUser.username);
            return [];
        }
        
        // Filter to only show this anggota's data
        return allReportData.filter(data => data.anggotaId === userAnggota.id);
    }
    
    return [];
}

/**
 * Render main report page
 * Display statistics cards and data table with all anggota
 * WITH PERFORMANCE OPTIMIZATIONS - Task 13
 * ENHANCED ERROR HANDLING - Task 14
 */
function renderLaporanTransaksiSimpananAnggota() {
    const content = document.getElementById('mainContent');
    
    if (!content) {
        console.error('mainContent element not found');
        return;
    }
    
    // Check access authorization
    if (!checkLaporanAccess()) {
        return;
    }
    
    try {
        // Show loading indicator - Task 13
        loadingIndicator.show('mainContent', 'Memuat laporan transaksi & simpanan...');
        
        // Use setTimeout to allow loading indicator to render
        setTimeout(() => {
            try {
                renderLaporanContent();
            } catch (renderError) {
                console.error('Error rendering content:', renderError);
                
                // Show error state with retry option - Task 14
                content.innerHTML = `
                    <div class="error-state text-center py-5">
                        <i class="fas fa-exclamation-triangle fa-3x text-danger mb-3"></i>
                        <h4>Gagal Memuat Laporan</h4>
                        <p class="text-muted">Terjadi kesalahan saat memuat data laporan.</p>
                        <button class="btn btn-primary" onclick="renderLaporanTransaksiSimpananAnggota()">
                            <i class="fas fa-redo"></i> Coba Lagi
                        </button>
                        <button class="btn btn-secondary ml-2" onclick="navigateTo('dashboard')">
                            <i class="fas fa-home"></i> Kembali ke Dashboard
                        </button>
                    </div>
                `;
                
                loadingIndicator.hide();
                
                // Log to error tracker - Task 14
                if (window.errorTracker) {
                    window.errorTracker.log(renderError);
                }
            }
        }, 10);
        
    } catch (error) {
        console.error('Error rendering laporan:', error);
        
        // Fallback error display - Task 14
        content.innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-circle"></i>
                <strong>Error:</strong> Gagal memuat halaman laporan. Silakan refresh halaman atau hubungi administrator.
            </div>
        `;
        
        loadingIndicator.hide();
        
        // Log to error tracker - Task 14
        if (window.errorTracker) {
            window.errorTracker.log(error);
        }
    }
}

/**
 * Render laporan content (separated for async loading)
 * Task 13 Performance Optimization
 */
function renderLaporanContent() {
    const content = document.getElementById('mainContent');
    
    try {
        // Load report data filtered by role
        const reportData = getFilteredReportDataByRole();
        
        // Initialize filter manager
        laporanFilterManager = new LaporanFilterManager();
        laporanFilterManager.setData(reportData);
        
        const stats = calculateStatistics(reportData);
        
        // Get current user for display
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const isAnggotaRole = currentUser.role === 'anggota';
        
        content.innerHTML = `
            <!-- Responsive CSS -->
            <style>
                /* Desktop: >= 1200px - Full table view */
                @media (min-width: 1200px) {
                    .laporan-card-view {
                        display: none;
                    }
                    .laporan-table-view {
                        display: block;
                    }
                }
                
                /* Tablet: 768px - 1199px - Scrollable table */
                @media (min-width: 768px) and (max-width: 1199px) {
                    .laporan-card-view {
                        display: none;
                    }
                    .laporan-table-view {
                        display: block;
                    }
                    .table-responsive {
                        overflow-x: auto;
                        -webkit-overflow-scrolling: touch;
                    }
                    /* Smaller font for tablet */
                    #tableLaporanAnggota {
                        font-size: 0.85rem;
                    }
                    #tableLaporanAnggota th,
                    #tableLaporanAnggota td {
                        padding: 0.5rem;
                    }
                }
                
                /* Mobile: < 768px - Card view */
                @media (max-width: 767px) {
                    .laporan-card-view {
                        display: block;
                    }
                    .laporan-table-view {
                        display: none;
                    }
                    
                    /* Stack statistics cards */
                    .statistics-card-mobile {
                        margin-bottom: 1rem;
                    }
                    
                    /* Adjust header */
                    .laporan-header h2 {
                        font-size: 1.5rem;
                    }
                    
                    /* Filter section adjustments */
                    .filter-mobile .col-md-4,
                    .filter-mobile .col-md-3,
                    .filter-mobile .col-md-2 {
                        width: 100%;
                        margin-bottom: 0.5rem;
                    }
                    
                    /* Action buttons stack */
                    .action-buttons-mobile .btn {
                        width: 100%;
                        margin-bottom: 0.5rem;
                    }
                    
                    /* Anggota card styling */
                    .anggota-card {
                        background: white;
                        border-radius: 10px;
                        padding: 15px;
                        margin-bottom: 15px;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                        border-left: 4px solid #2d6a4f;
                    }
                    
                    .anggota-card-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 10px;
                        padding-bottom: 10px;
                        border-bottom: 1px solid #e9ecef;
                    }
                    
                    .anggota-card-body {
                        font-size: 0.9rem;
                    }
                    
                    .anggota-card-row {
                        display: flex;
                        justify-content: space-between;
                        padding: 5px 0;
                    }
                    
                    .anggota-card-label {
                        font-weight: 600;
                        color: #6c757d;
                    }
                    
                    .anggota-card-value {
                        text-align: right;
                        font-weight: 500;
                    }
                    
                    .anggota-card-actions {
                        margin-top: 10px;
                        padding-top: 10px;
                        border-top: 1px solid #e9ecef;
                        display: flex;
                        gap: 5px;
                    }
                    
                    .anggota-card-actions .btn {
                        flex: 1;
                        font-size: 0.85rem;
                    }
                }
            </style>
            
            <div class="d-flex justify-content-between align-items-center mb-4 laporan-header">
                <h2 style="color: #2d6a4f; font-weight: 700;">
                    <i class="bi bi-file-earmark-bar-graph me-2"></i>Laporan Transaksi & Simpanan Anggota
                </h2>
                ${isAnggotaRole ? `
                    <span class="badge bg-info d-none d-md-inline" style="font-size: 0.9rem;">
                        <i class="bi bi-person-circle me-1"></i>Data Pribadi
                    </span>
                ` : ''}
            </div>
            
            ${isAnggotaRole ? `
                <div class="alert alert-info mb-4">
                    <i class="bi bi-info-circle me-2"></i>
                    <strong>Info:</strong> Anda melihat data transaksi dan simpanan pribadi Anda.
                </div>
            ` : ''}
            
            <!-- Statistics Cards -->
            <div class="row mb-4" id="statisticsCards">
                <div class="col-md-3 col-sm-6 mb-3">
                    <div class="card" style="background: linear-gradient(135deg, #2d6a4f 0%, #52b788 100%); border: none; border-radius: 15px;">
                        <div class="card-body text-white">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 class="mb-2" style="opacity: 0.9;">Total Anggota</h6>
                                    <h3 class="mb-0" style="font-weight: 700;" id="statTotalAnggota">${stats.totalAnggota}</h3>
                                </div>
                                <div>
                                    <i class="bi bi-people-fill" style="font-size: 3rem; opacity: 0.3;"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="col-md-3 col-sm-6 mb-3">
                    <div class="card" style="background: linear-gradient(135deg, #457b9d 0%, #a8dadc 100%); border: none; border-radius: 15px;">
                        <div class="card-body text-white">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 class="mb-2" style="opacity: 0.9;">Total Transaksi</h6>
                                    <h3 class="mb-0" style="font-weight: 700;" id="statTotalTransaksi">${formatRupiah(stats.totalTransaksi)}</h3>
                                </div>
                                <div>
                                    <i class="bi bi-cart-fill" style="font-size: 3rem; opacity: 0.3;"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="col-md-3 col-sm-6 mb-3">
                    <div class="card" style="background: linear-gradient(135deg, #f4a261 0%, #e9c46a 100%); border: none; border-radius: 15px;">
                        <div class="card-body text-white">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 class="mb-2" style="opacity: 0.9;">Total Simpanan</h6>
                                    <h3 class="mb-0" style="font-weight: 700;" id="statTotalSimpanan">${formatRupiah(stats.totalSimpanan)}</h3>
                                </div>
                                <div>
                                    <i class="bi bi-piggy-bank-fill" style="font-size: 3rem; opacity: 0.3;"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="col-md-3 col-sm-6 mb-3">
                    <div class="card" style="background: linear-gradient(135deg, #e63946 0%, #f4a261 100%); border: none; border-radius: 15px;">
                        <div class="card-body text-white">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 class="mb-2" style="opacity: 0.9;">Total Tagihan</h6>
                                    <h3 class="mb-0" style="font-weight: 700;" id="statTotalOutstanding">${formatRupiah(stats.totalOutstanding)}</h3>
                                </div>
                                <div>
                                    <i class="bi bi-exclamation-triangle-fill" style="font-size: 3rem; opacity: 0.3;"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Filter Section -->
            <div class="card mb-3">
                <div class="card-body">
                    <div class="row g-3 filter-mobile">
                        <div class="col-md-4">
                            <label class="form-label">
                                <i class="bi bi-search me-1"></i>Pencarian
                            </label>
                            <input 
                                type="text" 
                                class="form-control" 
                                id="searchLaporan" 
                                placeholder="Cari NIK, Nama, atau No. Kartu..."
                                oninput="handleSearchLaporan(this.value)"
                            >
                        </div>
                        <div class="col-md-3">
                            <label class="form-label">
                                <i class="bi bi-building me-1"></i>Departemen
                            </label>
                            <select 
                                class="form-select" 
                                id="filterDepartemen"
                                onchange="handleDepartemenFilter(this.value)"
                            >
                                <option value="">Semua Departemen</option>
                                ${renderDepartemenOptions()}
                            </select>
                        </div>
                        <div class="col-md-3">
                            <label class="form-label">
                                <i class="bi bi-person-badge me-1"></i>Tipe Anggota
                            </label>
                            <select 
                                class="form-select" 
                                id="filterTipeAnggota"
                                onchange="handleTipeAnggotaFilter(this.value)"
                            >
                                <option value="">Semua Tipe</option>
                                ${renderTipeAnggotaOptions()}
                            </select>
                        </div>
                        <div class="col-md-2 d-flex align-items-end">
                            <button 
                                class="btn btn-outline-secondary w-100" 
                                onclick="handleResetFilter()"
                            >
                                <i class="bi bi-arrow-counterclockwise me-1"></i>Reset
                            </button>
                        </div>
                    </div>
                    <div class="mt-2">
                        <small class="text-muted" id="filterCountInfo">
                            Menampilkan <strong>${reportData.length}</strong> dari <strong>${reportData.length}</strong> anggota
                        </small>
                    </div>
                </div>
            </div>
            
            <!-- Action Buttons -->
            <div class="mb-3 action-buttons-mobile">
                <button class="btn btn-success" onclick="exportLaporanToCSV()">
                    <i class="bi bi-file-earmark-spreadsheet me-1"></i> Export CSV
                </button>
                <button class="btn btn-info" onclick="printLaporan()">
                    <i class="bi bi-printer me-1"></i> Cetak
                </button>
            </div>
            
            <!-- Data Table View (Desktop & Tablet) -->
            <div class="card laporan-table-view">
                <div class="card-header">
                    <i class="bi bi-table me-2"></i>Daftar Anggota
                </div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-striped table-hover" id="tableLaporanAnggota">
                            <thead>
                                <tr>
                                    <th onclick="sortLaporanBy('nik')" style="cursor: pointer;">
                                        NIK <span id="sortIndicator-nik"></span>
                                    </th>
                                    <th onclick="sortLaporanBy('nama')" style="cursor: pointer;">
                                        Nama <span id="sortIndicator-nama"></span>
                                    </th>
                                    <th onclick="sortLaporanBy('departemen')" style="cursor: pointer;">
                                        Departemen <span id="sortIndicator-departemen"></span>
                                    </th>
                                    <th onclick="sortLaporanBy('tipeAnggota')" style="cursor: pointer;">
                                        Tipe <span id="sortIndicator-tipeAnggota"></span>
                                    </th>
                                    <th class="text-end" onclick="sortLaporanBy('transaksiCash')" style="cursor: pointer;">
                                        Transaksi Cash <span id="sortIndicator-transaksiCash"></span>
                                    </th>
                                    <th class="text-end" onclick="sortLaporanBy('transaksiBon')" style="cursor: pointer;">
                                        Transaksi Bon <span id="sortIndicator-transaksiBon"></span>
                                    </th>
                                    <th class="text-end" onclick="sortLaporanBy('totalSimpanan')" style="cursor: pointer;">
                                        Total Simpanan <span id="sortIndicator-totalSimpanan"></span>
                                    </th>
                                    <th class="text-end" onclick="sortLaporanBy('outstanding')" style="cursor: pointer;">
                                        Outstanding <span id="sortIndicator-outstanding"></span>
                                    </th>
                                    <th class="text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody id="tbodyLaporanAnggota">
                                ${renderTableRows(reportData)}
                            </tbody>
                            <tfoot>
                                <tr style="background-color: #f8f9fa; font-weight: bold;">
                                    <td colspan="4" class="text-end">TOTAL:</td>
                                    <td class="text-end">${formatRupiah(reportData.reduce((sum, d) => sum + d.transaksi.totalCash, 0))}</td>
                                    <td class="text-end">${formatRupiah(reportData.reduce((sum, d) => sum + d.transaksi.totalBon, 0))}</td>
                                    <td class="text-end">${formatRupiah(reportData.reduce((sum, d) => sum + d.simpanan.total, 0))}</td>
                                    <td class="text-end">${formatRupiah(reportData.reduce((sum, d) => sum + d.transaksi.outstandingBalance, 0))}</td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            </div>
            
            <!-- Card View (Mobile) -->
            <div class="laporan-card-view" id="cardViewContainer">
                ${renderCardView(reportData)}
            </div>
            
            <!-- Pagination Controls - Task 13 Performance Optimization -->
            ${reportData.length > 25 ? renderPaginationControls(reportData.length) : ''}
        `;
        
        // Initialize pagination if needed - Task 13
        if (reportData.length > 25) {
            laporanPagination.setTotalItems(reportData.length);
            applyPagination();
        }
        
    } catch (error) {
        console.error('Error rendering laporan:', error);
        content.innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle me-2"></i>
                <strong>Error:</strong> Gagal memuat laporan. ${error.message}
            </div>
        `;
    }
}

/**
 * Render table rows for report data
 * @param {Array} data - Array of aggregated report data
 * @returns {string} HTML string for table rows
 */
function renderTableRows(data) {
    if (!Array.isArray(data) || data.length === 0) {
        return `
            <tr>
                <td colspan="9" class="text-center text-muted py-4">
                    <i class="bi bi-inbox" style="font-size: 3rem;"></i>
                    <p class="mt-2 mb-0">Belum ada data anggota</p>
                </td>
            </tr>
        `;
    }
    
    return data.map(item => `
        <tr>
            <td>${item.nik}</td>
            <td>${item.nama}</td>
            <td>${item.departemen}</td>
            <td>
                <span class="badge ${getBadgeClass(item.tipeAnggota)}">
                    ${item.tipeAnggota}
                </span>
            </td>
            <td class="text-end">${formatRupiah(item.transaksi.totalCash)}</td>
            <td class="text-end">${formatRupiah(item.transaksi.totalBon)}</td>
            <td class="text-end">${formatRupiah(item.simpanan.total)}</td>
            <td class="text-end">
                <span class="${item.transaksi.outstandingBalance > 0 ? 'text-danger fw-bold' : ''}">
                    ${formatRupiah(item.transaksi.outstandingBalance)}
                </span>
            </td>
            <td class="text-center">
                <button class="btn btn-sm btn-primary" onclick="showDetailTransaksi('${item.anggotaId}')" title="Detail Transaksi">
                    <i class="bi bi-receipt"></i>
                </button>
                <button class="btn btn-sm btn-success" onclick="showDetailSimpanan('${item.anggotaId}')" title="Detail Simpanan">
                    <i class="bi bi-piggy-bank"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

/**
 * Render card view for mobile devices
 * @param {Array} data - Array of aggregated report data
 * @returns {string} HTML string for card view
 */
function renderCardView(data) {
    if (!Array.isArray(data) || data.length === 0) {
        return `
            <div class="text-center text-muted py-5">
                <i class="bi bi-inbox" style="font-size: 3rem;"></i>
                <p class="mt-2 mb-0">Belum ada data anggota</p>
            </div>
        `;
    }
    
    return data.map(item => `
        <div class="anggota-card">
            <div class="anggota-card-header">
                <div>
                    <h6 class="mb-0" style="color: #2d6a4f; font-weight: 700;">${item.nama}</h6>
                    <small class="text-muted">${item.nik}</small>
                </div>
                <span class="badge ${getBadgeClass(item.tipeAnggota)}">
                    ${item.tipeAnggota}
                </span>
            </div>
            <div class="anggota-card-body">
                <div class="anggota-card-row">
                    <span class="anggota-card-label">
                        <i class="bi bi-building me-1"></i>Departemen
                    </span>
                    <span class="anggota-card-value">${item.departemen}</span>
                </div>
                <div class="anggota-card-row">
                    <span class="anggota-card-label">
                        <i class="bi bi-cash-coin me-1"></i>Transaksi Cash
                    </span>
                    <span class="anggota-card-value">${formatRupiah(item.transaksi.totalCash)}</span>
                </div>
                <div class="anggota-card-row">
                    <span class="anggota-card-label">
                        <i class="bi bi-credit-card me-1"></i>Transaksi Bon
                    </span>
                    <span class="anggota-card-value">${formatRupiah(item.transaksi.totalBon)}</span>
                </div>
                <div class="anggota-card-row">
                    <span class="anggota-card-label">
                        <i class="bi bi-piggy-bank me-1"></i>Total Simpanan
                    </span>
                    <span class="anggota-card-value">${formatRupiah(item.simpanan.total)}</span>
                </div>
                <div class="anggota-card-row">
                    <span class="anggota-card-label">
                        <i class="bi bi-exclamation-triangle me-1"></i>Outstanding
                    </span>
                    <span class="anggota-card-value ${item.transaksi.outstandingBalance > 0 ? 'text-danger fw-bold' : ''}">
                        ${formatRupiah(item.transaksi.outstandingBalance)}
                    </span>
                </div>
            </div>
            <div class="anggota-card-actions">
                <button class="btn btn-sm btn-primary" onclick="showDetailTransaksi('${item.anggotaId}')">
                    <i class="bi bi-receipt me-1"></i>Transaksi
                </button>
                <button class="btn btn-sm btn-success" onclick="showDetailSimpanan('${item.anggotaId}')">
                    <i class="bi bi-piggy-bank me-1"></i>Simpanan
                </button>
            </div>
        </div>
    `).join('');
}

/**
 * Get badge class based on tipe anggota
 * @param {string} tipe - Tipe anggota
 * @returns {string} Bootstrap badge class
 */
function getBadgeClass(tipe) {
    switch (tipe) {
        case 'Anggota':
            return 'bg-success';
        case 'Non-Anggota':
            return 'bg-info';
        case 'Umum':
            return 'bg-secondary';
        default:
            return 'bg-secondary';
    }
}

/**
 * Show detail transaksi modal for a member
 * WITH LAZY LOADING - Task 13 Performance Optimization
 * ENHANCED ERROR HANDLING - Task 14
 * @param {string} anggotaId - Member ID
 */
function showDetailTransaksi(anggotaId) {
    try {
        // Validate anggotaId - Task 14
        if (!anggotaId) {
            throw new ValidationError('ID anggota tidak valid', { anggotaId });
        }
        
        // Task 13: Show loading modal first (lazy loading)
        showLoadingModal('modalDetailTransaksi', 'Memuat detail transaksi...');
        
        // Use setTimeout to allow loading modal to render
        setTimeout(() => {
            try {
                loadDetailTransaksiContent(anggotaId);
            } catch (loadError) {
                console.error('Error loading detail transaksi content:', loadError);
                hideLoadingModal('modalDetailTransaksi');
                showAlert('Gagal memuat detail transaksi', 'error');
                
                if (window.errorTracker) {
                    window.errorTracker.log(loadError);
                }
            }
        }, 10);
        
    } catch (error) {
        console.error('Error showing detail transaksi:', error);
        
        if (error instanceof ValidationError) {
            showAlert(error.message, 'error');
        } else {
            showAlert('Gagal menampilkan detail transaksi', 'error');
        }
        
        if (window.errorTracker) {
            window.errorTracker.log(error);
        }
    }
}

/**
 * Load detail transaksi content (separated for lazy loading)
 * Task 13 Performance Optimization
 * @param {string} anggotaId - Member ID
 */
function loadDetailTransaksiContent(anggotaId) {
    try {
        // Load data using aggregator
        const aggregator = new AnggotaDataAggregator(anggotaId);
        
        if (!aggregator.loadData()) {
            hideLoadingModal('modalDetailTransaksi');
            showAlert('Gagal memuat data anggota', 'error');
            return;
        }
        
        const anggota = aggregator.anggota;
        const transaksiList = aggregator.getTransaksiList();
        
        // Separate cash and bon transactions
        const transaksiCash = transaksiList.filter(t => t.metode === 'cash');
        const transaksiBon = transaksiList.filter(t => t.metode === 'bon');
        
        // Calculate totals
        const totalCash = safeSum(transaksiCash, 'total');
        const totalBon = safeSum(transaksiBon, 'total');
        
        // Create modal HTML
        const modalHTML = `
            <div class="modal fade" id="modalDetailTransaksi" tabindex="-1">
                <div class="modal-dialog modal-lg modal-dialog-scrollable">
                    <div class="modal-content">
                        <div class="modal-header" style="background: linear-gradient(135deg, #2d6a4f 0%, #52b788 100%);">
                            <h5 class="modal-title text-white">
                                <i class="bi bi-receipt me-2"></i>Detail Transaksi - ${anggota.nama}
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <!-- Member Info -->
                            <div class="card mb-3" style="background-color: #f8f9fa;">
                                <div class="card-body">
                                    <div class="row">
                                        <div class="col-md-6">
                                            <p class="mb-1"><strong>NIK:</strong> ${anggota.nik}</p>
                                            <p class="mb-1"><strong>No. Kartu:</strong> ${anggota.noKartu || '-'}</p>
                                        </div>
                                        <div class="col-md-6">
                                            <p class="mb-1"><strong>Departemen:</strong> ${anggota.departemen}</p>
                                            <p class="mb-0"><strong>Tipe:</strong> ${anggota.tipeAnggota}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            ${transaksiList.length === 0 ? `
                                <div class="alert alert-info">
                                    <i class="bi bi-info-circle me-2"></i>
                                    Belum ada transaksi untuk anggota ini
                                </div>
                            ` : `
                                <!-- Transaksi Cash -->
                                <div class="mb-4">
                                    <h6 class="mb-3" style="color: #2d6a4f; font-weight: 600;">
                                        <i class="bi bi-cash-coin me-2"></i>Transaksi Cash (${transaksiCash.length})
                                    </h6>
                                    ${transaksiCash.length === 0 ? `
                                        <p class="text-muted">Tidak ada transaksi cash</p>
                                    ` : `
                                        <div class="table-responsive">
                                            <table class="table table-sm table-hover">
                                                <thead class="table-light">
                                                    <tr>
                                                        <th>No. Transaksi</th>
                                                        <th>Tanggal</th>
                                                        <th>Kasir</th>
                                                        <th class="text-end">Total</th>
                                                        <th>Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    ${renderTransaksiRows(transaksiCash)}
                                                </tbody>
                                                <tfoot class="table-light">
                                                    <tr>
                                                        <td colspan="3" class="text-end"><strong>Total Cash:</strong></td>
                                                        <td class="text-end"><strong>${formatRupiah(totalCash)}</strong></td>
                                                        <td></td>
                                                    </tr>
                                                </tfoot>
                                            </table>
                                        </div>
                                    `}
                                </div>
                                
                                <!-- Transaksi Bon -->
                                <div class="mb-3">
                                    <h6 class="mb-3" style="color: #e63946; font-weight: 600;">
                                        <i class="bi bi-credit-card me-2"></i>Transaksi Bon (${transaksiBon.length})
                                    </h6>
                                    ${transaksiBon.length === 0 ? `
                                        <p class="text-muted">Tidak ada transaksi bon</p>
                                    ` : `
                                        <div class="table-responsive">
                                            <table class="table table-sm table-hover">
                                                <thead class="table-light">
                                                    <tr>
                                                        <th>No. Transaksi</th>
                                                        <th>Tanggal</th>
                                                        <th>Kasir</th>
                                                        <th class="text-end">Total</th>
                                                        <th>Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    ${renderTransaksiRows(transaksiBon)}
                                                </tbody>
                                                <tfoot class="table-light">
                                                    <tr>
                                                        <td colspan="3" class="text-end"><strong>Total Bon:</strong></td>
                                                        <td class="text-end"><strong>${formatRupiah(totalBon)}</strong></td>
                                                        <td></td>
                                                    </tr>
                                                </tfoot>
                                            </table>
                                        </div>
                                    `}
                                </div>
                                
                                <!-- Grand Total -->
                                <div class="card" style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);">
                                    <div class="card-body">
                                        <div class="row">
                                            <div class="col-6">
                                                <h6 class="mb-0">Total Keseluruhan:</h6>
                                            </div>
                                            <div class="col-6 text-end">
                                                <h5 class="mb-0" style="color: #2d6a4f; font-weight: 700;">
                                                    ${formatRupiah(totalCash + totalBon)}
                                                </h5>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            `}
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                                <i class="bi bi-x-circle me-1"></i>Tutup
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Remove existing modal if any
        const existingModal = document.getElementById('modalDetailTransaksi');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Task 13: Hide loading modal
        hideLoadingModal('modalDetailTransaksi');
        
        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('modalDetailTransaksi'));
        modal.show();
        
        // Clean up modal after hide
        document.getElementById('modalDetailTransaksi').addEventListener('hidden.bs.modal', function() {
            this.remove();
        });
        
    } catch (error) {
        console.error('Error loading detail transaksi:', error);
        hideLoadingModal('modalDetailTransaksi');
        showAlert('Gagal menampilkan detail transaksi', 'error');
    }
}

/**
 * Render transaction rows for modal
 * @param {Array} transaksiList - Array of transactions
 * @returns {string} HTML string for table rows
 */
function renderTransaksiRows(transaksiList) {
    return transaksiList.map(t => `
        <tr>
            <td>${t.id || t.noTransaksi || '-'}</td>
            <td>${formatDate(t.tanggal)}</td>
            <td>${t.kasir || t.kasirNama || '-'}</td>
            <td class="text-end">${formatRupiah(t.total)}</td>
            <td>
                <span class="badge ${getStatusBadgeClass(t.status)}">
                    ${getStatusLabel(t.status)}
                </span>
            </td>
        </tr>
    `).join('');
}

/**
 * Get badge class for transaction status
 * @param {string} status - Transaction status
 * @returns {string} Bootstrap badge class
 */
function getStatusBadgeClass(status) {
    switch (status) {
        case 'lunas':
            return 'bg-success';
        case 'kredit':
            return 'bg-danger';
        case 'pending':
            return 'bg-warning';
        default:
            return 'bg-secondary';
    }
}

/**
 * Get label for transaction status
 * @param {string} status - Transaction status
 * @returns {string} Status label
 */
function getStatusLabel(status) {
    switch (status) {
        case 'lunas':
            return 'Lunas';
        case 'kredit':
            return 'Kredit';
        case 'pending':
            return 'Pending';
        default:
            return status || '-';
    }
}

/**
 * Show detail simpanan modal for a member
 * WITH LAZY LOADING - Task 13 Performance Optimization
 * ENHANCED ERROR HANDLING - Task 14
 * @param {string} anggotaId - Member ID
 */
function showDetailSimpanan(anggotaId) {
    try {
        // Validate anggotaId - Task 14
        if (!anggotaId) {
            throw new ValidationError('ID anggota tidak valid', { anggotaId });
        }
        
        // Task 13: Show loading modal first (lazy loading)
        showLoadingModal('modalDetailSimpanan', 'Memuat detail simpanan...');
        
        // Use setTimeout to allow loading modal to render
        setTimeout(() => {
            try {
                loadDetailSimpananContent(anggotaId);
            } catch (loadError) {
                console.error('Error loading detail simpanan content:', loadError);
                hideLoadingModal('modalDetailSimpanan');
                showAlert('Gagal memuat detail simpanan', 'error');
                
                if (window.errorTracker) {
                    window.errorTracker.log(loadError);
                }
            }
        }, 10);
        
    } catch (error) {
        console.error('Error showing detail simpanan:', error);
        
        if (error instanceof ValidationError) {
            showAlert(error.message, 'error');
        } else {
            showAlert('Gagal menampilkan detail simpanan', 'error');
        }
        
        if (window.errorTracker) {
            window.errorTracker.log(error);
        }
    }
}

/**
 * Load detail simpanan content (separated for lazy loading)
 * Task 13 Performance Optimization
 * @param {string} anggotaId - Member ID
 */
function loadDetailSimpananContent(anggotaId) {
    try {
        // Load data using aggregator
        const aggregator = new AnggotaDataAggregator(anggotaId);
        
        if (!aggregator.loadData()) {
            hideLoadingModal('modalDetailSimpanan');
            showAlert('Gagal memuat data anggota', 'error');
            return;
        }
        
        const anggota = aggregator.anggota;
        
        // Get simpanan lists
        const simpananPokok = aggregator.getSimpananList('pokok');
        const simpananWajib = aggregator.getSimpananList('wajib');
        const simpananSukarela = aggregator.getSimpananList('sukarela');
        
        // Calculate totals
        const totalPokok = aggregator.getTotalSimpananPokok();
        const totalWajib = aggregator.getTotalSimpananWajib();
        const totalSukarela = aggregator.getTotalSimpananSukarela();
        const grandTotal = aggregator.getTotalSimpanan();
        
        // Create modal HTML
        const modalHTML = `
            <div class="modal fade" id="modalDetailSimpanan" tabindex="-1">
                <div class="modal-dialog modal-lg modal-dialog-scrollable">
                    <div class="modal-content">
                        <div class="modal-header" style="background: linear-gradient(135deg, #f4a261 0%, #e9c46a 100%);">
                            <h5 class="modal-title text-white">
                                <i class="bi bi-piggy-bank me-2"></i>Detail Simpanan - ${anggota.nama}
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <!-- Member Info -->
                            <div class="card mb-3" style="background-color: #f8f9fa;">
                                <div class="card-body">
                                    <div class="row">
                                        <div class="col-md-6">
                                            <p class="mb-1"><strong>NIK:</strong> ${anggota.nik}</p>
                                            <p class="mb-1"><strong>No. Kartu:</strong> ${anggota.noKartu || '-'}</p>
                                        </div>
                                        <div class="col-md-6">
                                            <p class="mb-1"><strong>Departemen:</strong> ${anggota.departemen}</p>
                                            <p class="mb-0"><strong>Tipe:</strong> ${anggota.tipeAnggota}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Summary Cards -->
                            <div class="row mb-4">
                                <div class="col-md-4 mb-3">
                                    <div class="card text-center" style="border-left: 4px solid #2d6a4f;">
                                        <div class="card-body">
                                            <h6 class="text-muted mb-2">Simpanan Pokok</h6>
                                            <h4 class="mb-0" style="color: #2d6a4f; font-weight: 700;">
                                                ${formatRupiah(totalPokok)}
                                            </h4>
                                            <small class="text-muted">${simpananPokok.length} transaksi</small>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-4 mb-3">
                                    <div class="card text-center" style="border-left: 4px solid #457b9d;">
                                        <div class="card-body">
                                            <h6 class="text-muted mb-2">Simpanan Wajib</h6>
                                            <h4 class="mb-0" style="color: #457b9d; font-weight: 700;">
                                                ${formatRupiah(totalWajib)}
                                            </h4>
                                            <small class="text-muted">${simpananWajib.length} transaksi</small>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-4 mb-3">
                                    <div class="card text-center" style="border-left: 4px solid #e63946;">
                                        <div class="card-body">
                                            <h6 class="text-muted mb-2">Simpanan Sukarela</h6>
                                            <h4 class="mb-0" style="color: #e63946; font-weight: 700;">
                                                ${formatRupiah(totalSukarela)}
                                            </h4>
                                            <small class="text-muted">${simpananSukarela.length} transaksi</small>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            ${grandTotal === 0 ? `
                                <div class="alert alert-info">
                                    <i class="bi bi-info-circle me-2"></i>
                                    Belum ada simpanan untuk anggota ini
                                </div>
                            ` : `
                                <!-- Simpanan Pokok -->
                                <div class="mb-4">
                                    <h6 class="mb-3" style="color: #2d6a4f; font-weight: 600;">
                                        <i class="bi bi-wallet2 me-2"></i>Simpanan Pokok
                                    </h6>
                                    ${simpananPokok.length === 0 ? `
                                        <p class="text-muted">Tidak ada simpanan pokok</p>
                                    ` : `
                                        <div class="table-responsive">
                                            <table class="table table-sm table-hover">
                                                <thead class="table-light">
                                                    <tr>
                                                        <th>Tanggal</th>
                                                        <th class="text-end">Jumlah</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    ${renderSimpananPokokRows(simpananPokok)}
                                                </tbody>
                                                <tfoot class="table-light">
                                                    <tr>
                                                        <td class="text-end"><strong>Total:</strong></td>
                                                        <td class="text-end"><strong>${formatRupiah(totalPokok)}</strong></td>
                                                    </tr>
                                                </tfoot>
                                            </table>
                                        </div>
                                    `}
                                </div>
                                
                                <!-- Simpanan Wajib -->
                                <div class="mb-4">
                                    <h6 class="mb-3" style="color: #457b9d; font-weight: 600;">
                                        <i class="bi bi-calendar-check me-2"></i>Simpanan Wajib
                                    </h6>
                                    ${simpananWajib.length === 0 ? `
                                        <p class="text-muted">Tidak ada simpanan wajib</p>
                                    ` : `
                                        <div class="table-responsive">
                                            <table class="table table-sm table-hover">
                                                <thead class="table-light">
                                                    <tr>
                                                        <th>Periode</th>
                                                        <th>Tanggal</th>
                                                        <th class="text-end">Jumlah</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    ${renderSimpananWajibRows(simpananWajib)}
                                                </tbody>
                                                <tfoot class="table-light">
                                                    <tr>
                                                        <td colspan="2" class="text-end"><strong>Total:</strong></td>
                                                        <td class="text-end"><strong>${formatRupiah(totalWajib)}</strong></td>
                                                    </tr>
                                                </tfoot>
                                            </table>
                                        </div>
                                    `}
                                </div>
                                
                                <!-- Simpanan Sukarela -->
                                <div class="mb-3">
                                    <h6 class="mb-3" style="color: #e63946; font-weight: 600;">
                                        <i class="bi bi-heart me-2"></i>Simpanan Sukarela
                                    </h6>
                                    ${simpananSukarela.length === 0 ? `
                                        <p class="text-muted">Tidak ada simpanan sukarela</p>
                                    ` : `
                                        <div class="table-responsive">
                                            <table class="table table-sm table-hover">
                                                <thead class="table-light">
                                                    <tr>
                                                        <th>Tanggal</th>
                                                        <th class="text-end">Jumlah</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    ${renderSimpananSukarelaRows(simpananSukarela)}
                                                </tbody>
                                                <tfoot class="table-light">
                                                    <tr>
                                                        <td class="text-end"><strong>Total:</strong></td>
                                                        <td class="text-end"><strong>${formatRupiah(totalSukarela)}</strong></td>
                                                    </tr>
                                                </tfoot>
                                            </table>
                                        </div>
                                    `}
                                </div>
                                
                                <!-- Grand Total -->
                                <div class="card" style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);">
                                    <div class="card-body">
                                        <div class="row">
                                            <div class="col-6">
                                                <h6 class="mb-0">Total Keseluruhan Simpanan:</h6>
                                            </div>
                                            <div class="col-6 text-end">
                                                <h5 class="mb-0" style="color: #2d6a4f; font-weight: 700;">
                                                    ${formatRupiah(grandTotal)}
                                                </h5>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            `}
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                                <i class="bi bi-x-circle me-1"></i>Tutup
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Remove existing modal if any
        const existingModal = document.getElementById('modalDetailSimpanan');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Task 13: Hide loading modal
        hideLoadingModal('modalDetailSimpanan');
        
        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('modalDetailSimpanan'));
        modal.show();
        
        // Clean up modal after hide
        document.getElementById('modalDetailSimpanan').addEventListener('hidden.bs.modal', function() {
            this.remove();
        });
        
    } catch (error) {
        console.error('Error loading detail simpanan:', error);
        hideLoadingModal('modalDetailSimpanan');
        showAlert('Gagal menampilkan detail simpanan', 'error');
    }
}

/**
 * Render simpanan pokok rows for modal
 * @param {Array} simpananList - Array of simpanan pokok
 * @returns {string} HTML string for table rows
 */
function renderSimpananPokokRows(simpananList) {
    return simpananList.map(s => `
        <tr>
            <td>${formatDate(s.tanggal)}</td>
            <td class="text-end">${formatRupiah(s.jumlah)}</td>
        </tr>
    `).join('');
}

/**
 * Render simpanan wajib rows for modal
 * @param {Array} simpananList - Array of simpanan wajib
 * @returns {string} HTML string for table rows
 */
function renderSimpananWajibRows(simpananList) {
    return simpananList.map(s => `
        <tr>
            <td>${s.periode || '-'}</td>
            <td>${formatDate(s.tanggal)}</td>
            <td class="text-end">${formatRupiah(s.jumlah)}</td>
        </tr>
    `).join('');
}

/**
 * Render simpanan sukarela rows for modal
 * @param {Array} simpananList - Array of simpanan sukarela
 * @returns {string} HTML string for table rows
 */
function renderSimpananSukarelaRows(simpananList) {
    return simpananList.map(s => `
        <tr>
            <td>${formatDate(s.tanggal)}</td>
            <td class="text-end">${formatRupiah(s.jumlah)}</td>
        </tr>
    `).join('');
}

/**
 * Sort laporan by column
 * @param {string} column - Column name to sort by
 */
function sortLaporanBy(column) {
    if (!laporanFilterManager) {
        return;
    }
    
    // Toggle direction if same column, otherwise reset to ascending
    if (currentSortColumn === column) {
        currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        currentSortColumn = column;
        currentSortDirection = 'asc';
    }
    
    // Get current filtered data
    const data = laporanFilterManager.getFilteredData();
    
    // Sort the data
    const sortedData = sortData(data, column, currentSortDirection);
    
    // Update display with sorted data
    updateLaporanDisplayWithSortedData(sortedData);
    
    // Update sort indicators
    updateSortIndicators(column, currentSortDirection);
}

/**
 * Sort data array by column
 * @param {Array} data - Data to sort
 * @param {string} column - Column name
 * @param {string} direction - 'asc' or 'desc'
 * @returns {Array} Sorted data
 */
function sortData(data, column, direction) {
    const sortedData = [...data];
    
    sortedData.sort((a, b) => {
        let valueA, valueB;
        
        // Get values based on column
        switch (column) {
            case 'nik':
                valueA = a.nik || '';
                valueB = b.nik || '';
                return compareAlphabetic(valueA, valueB, direction);
                
            case 'nama':
                valueA = a.nama || '';
                valueB = b.nama || '';
                return compareAlphabetic(valueA, valueB, direction);
                
            case 'departemen':
                valueA = a.departemen || '';
                valueB = b.departemen || '';
                return compareAlphabetic(valueA, valueB, direction);
                
            case 'tipeAnggota':
                valueA = a.tipeAnggota || '';
                valueB = b.tipeAnggota || '';
                return compareAlphabetic(valueA, valueB, direction);
                
            case 'transaksiCash':
                valueA = a.transaksi.totalCash || 0;
                valueB = b.transaksi.totalCash || 0;
                return compareNumeric(valueA, valueB, direction);
                
            case 'transaksiBon':
                valueA = a.transaksi.totalBon || 0;
                valueB = b.transaksi.totalBon || 0;
                return compareNumeric(valueA, valueB, direction);
                
            case 'totalSimpanan':
                valueA = a.simpanan.total || 0;
                valueB = b.simpanan.total || 0;
                return compareNumeric(valueA, valueB, direction);
                
            case 'outstanding':
                valueA = a.transaksi.outstandingBalance || 0;
                valueB = b.transaksi.outstandingBalance || 0;
                return compareNumeric(valueA, valueB, direction);
                
            default:
                return 0;
        }
    });
    
    return sortedData;
}

/**
 * Compare two numeric values
 * @param {number} a - First value
 * @param {number} b - Second value
 * @param {string} direction - 'asc' or 'desc'
 * @returns {number} Comparison result
 */
function compareNumeric(a, b, direction) {
    const numA = parseFloat(a) || 0;
    const numB = parseFloat(b) || 0;
    
    if (direction === 'asc') {
        return numA - numB;
    } else {
        return numB - numA;
    }
}

/**
 * Compare two string values alphabetically
 * @param {string} a - First value
 * @param {string} b - Second value
 * @param {string} direction - 'asc' or 'desc'
 * @returns {number} Comparison result
 */
function compareAlphabetic(a, b, direction) {
    const strA = String(a).toLowerCase();
    const strB = String(b).toLowerCase();
    
    if (direction === 'asc') {
        return strA.localeCompare(strB);
    } else {
        return strB.localeCompare(strA);
    }
}

/**
 * Update laporan display with sorted data
 * @param {Array} sortedData - Sorted data array
 */
function updateLaporanDisplayWithSortedData(sortedData) {
    // Update table body
    const tbody = document.getElementById('tbodyLaporanAnggota');
    if (tbody) {
        tbody.innerHTML = renderTableRows(sortedData);
    }
    
    // Update table footer
    const tfoot = document.querySelector('#tableLaporanAnggota tfoot tr');
    if (tfoot) {
        tfoot.innerHTML = `
            <td colspan="4" class="text-end">TOTAL:</td>
            <td class="text-end">${formatRupiah(sortedData.reduce((sum, d) => sum + d.transaksi.totalCash, 0))}</td>
            <td class="text-end">${formatRupiah(sortedData.reduce((sum, d) => sum + d.transaksi.totalBon, 0))}</td>
            <td class="text-end">${formatRupiah(sortedData.reduce((sum, d) => sum + d.simpanan.total, 0))}</td>
            <td class="text-end">${formatRupiah(sortedData.reduce((sum, d) => sum + d.transaksi.outstandingBalance, 0))}</td>
            <td></td>
        `;
    }
}

/**
 * Update sort indicators in table headers
 * @param {string} column - Active column
 * @param {string} direction - Sort direction
 */
function updateSortIndicators(column, direction) {
    // Clear all indicators
    const allIndicators = document.querySelectorAll('[id^="sortIndicator-"]');
    allIndicators.forEach(indicator => {
        indicator.innerHTML = '';
    });
    
    // Set active indicator
    const activeIndicator = document.getElementById(`sortIndicator-${column}`);
    if (activeIndicator) {
        if (direction === 'asc') {
            activeIndicator.innerHTML = '<i class="bi bi-arrow-up"></i>';
        } else {
            activeIndicator.innerHTML = '<i class="bi bi-arrow-down"></i>';
        }
    }
}

/**
 * Export laporan to CSV
 * ENHANCED ERROR HANDLING - Task 14
 * Generates CSV file with all displayed data
 */
function exportLaporanToCSV() {
    try {
        // Validate filter manager exists - Task 14
        if (!laporanFilterManager) {
            throw new ExportError('Data laporan tidak tersedia', {
                reason: 'Filter manager not initialized'
            });
        }
        
        // Get current filtered data
        let data = laporanFilterManager.getFilteredData();
        
        // Validate data exists and is array - Task 14
        if (!Array.isArray(data)) {
            throw new ExportError('Data tidak valid', {
                reason: 'Filtered data is not an array'
            });
        }
        
        // Apply current sort if any
        if (currentSortColumn) {
            data = sortData(data, currentSortColumn, currentSortDirection);
        }
        
        if (data.length === 0) {
            showAlert('Tidak ada data untuk diekspor', 'warning');
            return;
        }
        
        // Validate data structure - Task 14
        const sample = data[0];
        const requiredFields = ['nik', 'nama', 'departemen'];
        const missingFields = requiredFields.filter(field => !(field in sample));
        
        if (missingFields.length > 0) {
            throw new ValidationError('Data tidak lengkap', {
                missingFields
            });
        }
        
        // Generate CSV content
        const csvContent = generateCSVContent(data);
        
        if (!csvContent || csvContent.trim().length === 0) {
            throw new ExportError('Gagal menghasilkan konten CSV', {
                reason: 'Empty CSV content'
            });
        }
        
        // Generate filename with date
        const today = new Date();
        const dateStr = today.toISOString().split('T')[0]; // YYYY-MM-DD
        const filename = `laporan_transaksi_simpanan_${dateStr}.csv`;
        
        // Download file
        downloadCSVFile(csvContent, filename);
        
        showAlert(`File ${filename} berhasil diunduh`, 'success');
        
    } catch (error) {
        console.error('Error exporting CSV:', error);
        
        // User-friendly error messages - Task 14
        if (error instanceof ExportError || error instanceof ValidationError) {
            showAlert(error.message, 'error');
        } else {
            showAlert('Gagal mengekspor data ke CSV. Silakan coba lagi.', 'error');
        }
        
        // Log to error tracker - Task 14
        if (window.errorTracker) {
            window.errorTracker.log(error);
        }
    }
}

/**
 * Generate CSV content from data
 * ENHANCED ERROR HANDLING - Task 14
 * @param {Array} data - Array of report data
 * @returns {string} CSV content
 */
function generateCSVContent(data) {
    try {
        // CSV Header
        const headers = [
            'NIK',
            'Nama',
            'No. Kartu',
            'Departemen',
            'Tipe Anggota',
            'Total Transaksi Cash',
            'Total Transaksi Bon',
            'Total Simpanan Pokok',
            'Total Simpanan Wajib',
            'Total Simpanan Sukarela',
            'Total Simpanan',
            'Outstanding Balance'
        ];
        
        // Build CSV rows
        const rows = [headers];
        
        data.forEach(item => {
            try {
                const row = [
                    escapeCSVField(item.nik || ''),
                    escapeCSVField(item.nama || ''),
                    escapeCSVField(item.noKartu || ''),
                    escapeCSVField(item.departemen || ''),
                    escapeCSVField(item.tipeAnggota || ''),
                    parseFloat(item.transaksi?.totalCash) || 0,
                    parseFloat(item.transaksi?.totalBon) || 0,
                    parseFloat(item.simpanan?.pokok) || 0,
                    parseFloat(item.simpanan?.wajib) || 0,
                    parseFloat(item.simpanan?.sukarela) || 0,
                    parseFloat(item.simpanan?.total) || 0,
                    parseFloat(item.transaksi?.outstandingBalance) || 0
                ];
                rows.push(row);
            } catch (rowError) {
                console.error('Error processing row:', rowError, item);
                // Continue with next row
            }
        });
        
        // Add totals row with safe calculation - Task 14
        const totals = [
            '',
            '',
            '',
            '',
            'TOTAL',
            data.reduce((sum, d) => safeAdd(sum, d.transaksi?.totalCash), 0),
            data.reduce((sum, d) => safeAdd(sum, d.transaksi?.totalBon), 0),
            data.reduce((sum, d) => safeAdd(sum, d.simpanan?.pokok), 0),
            data.reduce((sum, d) => safeAdd(sum, d.simpanan?.wajib), 0),
            data.reduce((sum, d) => safeAdd(sum, d.simpanan?.sukarela), 0),
            data.reduce((sum, d) => safeAdd(sum, d.simpanan?.total), 0),
            data.reduce((sum, d) => safeAdd(sum, d.transaksi?.outstandingBalance), 0)
        ];
        rows.push(totals);
        
        // Convert to CSV string
        return rows.map(row => row.join(',')).join('\n');
        
    } catch (error) {
        console.error('Error generating CSV content:', error);
        throw new ExportError('Gagal menghasilkan konten CSV', {
            originalError: error.message
        });
    }
}

/**
 * Escape CSV field (handle commas and quotes)
 * @param {string} field - Field value
 * @returns {string} Escaped field
 */
function escapeCSVField(field) {
    if (field === null || field === undefined) {
        return '';
    }
    
    const str = String(field);
    
    // If field contains comma, quote, or newline, wrap in quotes and escape quotes
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    
    return str;
}

/**
 * Download CSV file
 * @param {string} content - CSV content
 * @param {string} filename - Filename
 */
function downloadCSVFile(content, filename) {
    // Add BOM for Excel UTF-8 compatibility
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8;' });
    
    // Create download link
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up URL object
    URL.revokeObjectURL(url);
}

/**
 * Print laporan
 * ENHANCED ERROR HANDLING - Task 14
 * Opens browser print dialog with formatted report
 */
function printLaporan() {
    try {
        // Validate filter manager - Task 14
        if (!laporanFilterManager) {
            throw new ExportError('Data laporan tidak tersedia', {
                reason: 'Filter manager not initialized'
            });
        }
        
        // Get current filtered data
        let data = laporanFilterManager.getFilteredData();
        
        // Validate data - Task 14
        if (!Array.isArray(data) || data.length === 0) {
            showAlert('Tidak ada data untuk dicetak', 'warning');
            return;
        }
        
        // Apply current sort if any
        if (currentSortColumn) {
            data = sortData(data, currentSortColumn, currentSortDirection);
        }
        
        // Calculate statistics
        const stats = calculateStatistics(data);
        
        // Get koperasi info safely - Task 14
        const koperasi = safeGetData('koperasi', {});
        const koperasiName = koperasi.nama || 'Koperasi';
        
        // Get current date
        const today = new Date();
        const printDate = formatDate(today.toISOString());
        
        // Generate print content
        const printContent = generatePrintContent(data, stats, koperasiName, printDate);
        
        if (!printContent) {
            throw new ExportError('Gagal menghasilkan konten cetak', {
                reason: 'Empty print content'
            });
        }
        
        // Create print window
        const printWindow = window.open('', '_blank');
        
        if (!printWindow) {
            throw new ExportError('Gagal membuka jendela cetak', {
                reason: 'Popup blocked or window.open failed'
            });
        }
        
        printWindow.document.write(printContent);
        printWindow.document.close();
        
        // Wait for content to load then print
        printWindow.onload = function() {
            try {
                printWindow.focus();
                printWindow.print();
                
                // Close after printing (with delay for print dialog)
                setTimeout(() => {
                    printWindow.close();
                }, 1000);
            } catch (printError) {
                console.error('Error during print:', printError);
                showAlert('Gagal mencetak. Silakan coba lagi.', 'error');
            }
        };
        
    } catch (error) {
        console.error('Error printing laporan:', error);
        
        // User-friendly error messages - Task 14
        if (error instanceof ExportError) {
            showAlert(error.message, 'error');
        } else {
            showAlert('Gagal mencetak laporan. Silakan coba lagi.', 'error');
        }
        
        // Log to error tracker - Task 14
        if (window.errorTracker) {
            window.errorTracker.log(error);
        }
    }
}

/**
 * Generate print content HTML
 * @param {Array} data - Report data
 * @param {Object} stats - Statistics
 * @param {string} koperasiName - Koperasi name
 * @param {string} printDate - Print date
 * @returns {string} HTML content for printing
 */
function generatePrintContent(data, stats, koperasiName, printDate) {
    return `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Laporan Transaksi & Simpanan Anggota - ${koperasiName}</title>
    <style>
        /* Print-specific styles */
        @media print {
            @page {
                size: A4 landscape;
                margin: 1cm;
            }
            
            body {
                margin: 0;
                padding: 0;
            }
            
            .no-print {
                display: none !important;
            }
            
            table {
                page-break-inside: auto;
            }
            
            tr {
                page-break-inside: avoid;
                page-break-after: auto;
            }
            
            thead {
                display: table-header-group;
            }
            
            tfoot {
                display: table-footer-group;
            }
        }
        
        /* General styles */
        body {
            font-family: Arial, sans-serif;
            font-size: 10pt;
            color: #000;
            background: #fff;
        }
        
        .print-header {
            text-align: center;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid #2d6a4f;
        }
        
        .print-header h1 {
            margin: 0;
            font-size: 18pt;
            color: #2d6a4f;
        }
        
        .print-header h2 {
            margin: 5px 0;
            font-size: 14pt;
            color: #333;
        }
        
        .print-header .print-info {
            margin-top: 10px;
            font-size: 9pt;
            color: #666;
        }
        
        .statistics-section {
            margin-bottom: 20px;
            display: flex;
            justify-content: space-around;
            flex-wrap: wrap;
        }
        
        .stat-box {
            flex: 1;
            min-width: 150px;
            padding: 10px;
            margin: 5px;
            border: 1px solid #ddd;
            border-radius: 5px;
            text-align: center;
        }
        
        .stat-box .label {
            font-size: 9pt;
            color: #666;
            margin-bottom: 5px;
        }
        
        .stat-box .value {
            font-size: 12pt;
            font-weight: bold;
            color: #2d6a4f;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        
        table thead {
            background-color: #2d6a4f;
            color: white;
        }
        
        table th,
        table td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }
        
        table th {
            font-weight: bold;
            font-size: 9pt;
        }
        
        table td {
            font-size: 9pt;
        }
        
        table tbody tr:nth-child(even) {
            background-color: #f9f9f9;
        }
        
        table tfoot {
            background-color: #f0f0f0;
            font-weight: bold;
        }
        
        .text-end {
            text-align: right;
        }
        
        .text-center {
            text-align: center;
        }
        
        .badge {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 8pt;
            font-weight: bold;
        }
        
        .badge-success {
            background-color: #d4edda;
            color: #155724;
        }
        
        .badge-info {
            background-color: #d1ecf1;
            color: #0c5460;
        }
        
        .badge-secondary {
            background-color: #e2e3e5;
            color: #383d41;
        }
        
        .text-danger {
            color: #dc3545;
        }
        
        .print-footer {
            margin-top: 30px;
            padding-top: 10px;
            border-top: 1px solid #ddd;
            text-align: center;
            font-size: 8pt;
            color: #666;
        }
    </style>
</head>
<body>
    <!-- Header -->
    <div class="print-header">
        <h1>${koperasiName}</h1>
        <h2>Laporan Transaksi & Simpanan Anggota</h2>
        <div class="print-info">
            Tanggal Cetak: ${printDate} | Total Anggota: ${data.length}
        </div>
    </div>
    
    <!-- Statistics -->
    <div class="statistics-section">
        <div class="stat-box">
            <div class="label">Total Anggota</div>
            <div class="value">${stats.totalAnggota}</div>
        </div>
        <div class="stat-box">
            <div class="label">Total Transaksi</div>
            <div class="value">${formatRupiah(stats.totalTransaksi)}</div>
        </div>
        <div class="stat-box">
            <div class="label">Total Simpanan</div>
            <div class="value">${formatRupiah(stats.totalSimpanan)}</div>
        </div>
        <div class="stat-box">
            <div class="label">Total Tagihan</div>
            <div class="value">${formatRupiah(stats.totalOutstanding)}</div>
        </div>
    </div>
    
    <!-- Data Table -->
    <table>
        <thead>
            <tr>
                <th>No</th>
                <th>NIK</th>
                <th>Nama</th>
                <th>Departemen</th>
                <th>Tipe</th>
                <th class="text-end">Transaksi Cash</th>
                <th class="text-end">Transaksi Bon</th>
                <th class="text-end">Total Simpanan</th>
                <th class="text-end">Outstanding</th>
            </tr>
        </thead>
        <tbody>
            ${generatePrintTableRows(data)}
        </tbody>
        <tfoot>
            <tr>
                <td colspan="5" class="text-end">TOTAL:</td>
                <td class="text-end">${formatRupiah(data.reduce((sum, d) => sum + d.transaksi.totalCash, 0))}</td>
                <td class="text-end">${formatRupiah(data.reduce((sum, d) => sum + d.transaksi.totalBon, 0))}</td>
                <td class="text-end">${formatRupiah(data.reduce((sum, d) => sum + d.simpanan.total, 0))}</td>
                <td class="text-end">${formatRupiah(data.reduce((sum, d) => sum + d.transaksi.outstandingBalance, 0))}</td>
            </tr>
        </tfoot>
    </table>
    
    <!-- Footer -->
    <div class="print-footer">
        <p>Dokumen ini dicetak secara otomatis dari Sistem Koperasi</p>
        <p>${koperasiName} - ${printDate}</p>
    </div>
</body>
</html>
    `;
}

/**
 * Generate table rows for print
 * @param {Array} data - Report data
 * @returns {string} HTML table rows
 */
function generatePrintTableRows(data) {
    return data.map((item, index) => `
        <tr>
            <td class="text-center">${index + 1}</td>
            <td>${item.nik}</td>
            <td>${item.nama}</td>
            <td>${item.departemen}</td>
            <td>
                <span class="badge ${getPrintBadgeClass(item.tipeAnggota)}">
                    ${item.tipeAnggota}
                </span>
            </td>
            <td class="text-end">${formatRupiah(item.transaksi.totalCash)}</td>
            <td class="text-end">${formatRupiah(item.transaksi.totalBon)}</td>
            <td class="text-end">${formatRupiah(item.simpanan.total)}</td>
            <td class="text-end ${item.transaksi.outstandingBalance > 0 ? 'text-danger' : ''}">
                ${formatRupiah(item.transaksi.outstandingBalance)}
            </td>
        </tr>
    `).join('');
}

/**
 * Get badge class for print
 * @param {string} tipe - Tipe anggota
 * @returns {string} Badge class
 */
function getPrintBadgeClass(tipe) {
    switch (tipe) {
        case 'Anggota':
            return 'badge-success';
        case 'Non-Anggota':
            return 'badge-info';
        case 'Umum':
            return 'badge-secondary';
        default:
            return 'badge-secondary';
    }
}


/**
 * LaporanFilterManager Class
 * Manages filtering and searching for the report
 */
class LaporanFilterManager {
    constructor() {
        this.allData = [];
        this.filteredData = [];
        this.filters = {
            search: '',
            departemen: '',
            tipeAnggota: ''
        };
    }
    
    /**
     * Initialize with data
     * @param {Array} data - Array of report data
     */
    setData(data) {
        this.allData = data;
        this.filteredData = data;
    }
    
    /**
     * Apply search filter
     * @param {string} searchTerm - Search term
     */
    applySearch(searchTerm) {
        this.filters.search = searchTerm.toLowerCase().trim();
        this.applyAllFilters();
    }
    
    /**
     * Apply departemen filter
     * @param {string} departemen - Departemen name
     */
    applyDepartemenFilter(departemen) {
        this.filters.departemen = departemen;
        this.applyAllFilters();
    }
    
    /**
     * Apply tipe anggota filter
     * @param {string} tipe - Tipe anggota
     */
    applyTipeAnggotaFilter(tipe) {
        this.filters.tipeAnggota = tipe;
        this.applyAllFilters();
    }
    
    /**
     * Apply all filters to data
     */
    applyAllFilters() {
        let result = [...this.allData];
        
        // Apply search filter (NIK, nama, noKartu)
        if (this.filters.search) {
            result = result.filter(item => {
                const nik = (item.nik || '').toLowerCase();
                const nama = (item.nama || '').toLowerCase();
                const noKartu = (item.noKartu || '').toLowerCase();
                
                return nik.includes(this.filters.search) ||
                       nama.includes(this.filters.search) ||
                       noKartu.includes(this.filters.search);
            });
        }
        
        // Apply departemen filter
        if (this.filters.departemen) {
            result = result.filter(item => item.departemen === this.filters.departemen);
        }
        
        // Apply tipe anggota filter
        if (this.filters.tipeAnggota) {
            result = result.filter(item => item.tipeAnggota === this.filters.tipeAnggota);
        }
        
        this.filteredData = result;
    }
    
    /**
     * Reset all filters
     */
    resetFilters() {
        this.filters = {
            search: '',
            departemen: '',
            tipeAnggota: ''
        };
        this.filteredData = [...this.allData];
    }
    
    /**
     * Get filtered data
     * @returns {Array} Filtered data
     */
    getFilteredData() {
        return this.filteredData;
    }
    
    /**
     * Get filter count info
     * @returns {Object} Count info
     */
    getFilterCount() {
        return {
            filtered: this.filteredData.length,
            total: this.allData.length
        };
    }
    
    /**
     * Get unique departemen list
     * @returns {Array} Array of unique departemen
     */
    getUniqueDepartemen() {
        const departemenSet = new Set();
        this.allData.forEach(item => {
            if (item.departemen) {
                departemenSet.add(item.departemen);
            }
        });
        return Array.from(departemenSet).sort();
    }
    
    /**
     * Get unique tipe anggota list
     * @returns {Array} Array of unique tipe anggota
     */
    getUniqueTipeAnggota() {
        const tipeSet = new Set();
        this.allData.forEach(item => {
            if (item.tipeAnggota) {
                tipeSet.add(item.tipeAnggota);
            }
        });
        return Array.from(tipeSet).sort();
    }
}

// Global filter manager instance
let laporanFilterManager = null;

// Global sort state
let currentSortColumn = null;
let currentSortDirection = 'asc'; // 'asc' or 'desc'

/**
 * Render departemen options for filter dropdown
 * @returns {string} HTML options
 */
function renderDepartemenOptions() {
    if (!laporanFilterManager) {
        return '';
    }
    
    const departemenList = laporanFilterManager.getUniqueDepartemen();
    return departemenList.map(dept => 
        `<option value="${dept}">${dept}</option>`
    ).join('');
}

/**
 * Render tipe anggota options for filter dropdown
 * @returns {string} HTML options
 */
function renderTipeAnggotaOptions() {
    if (!laporanFilterManager) {
        return '';
    }
    
    const tipeList = laporanFilterManager.getUniqueTipeAnggota();
    return tipeList.map(tipe => 
        `<option value="${tipe}">${tipe}</option>`
    ).join('');
}

/**
 * Handle search input (internal function)
 * @param {string} searchTerm - Search term
 */
function handleSearchLaporanInternal(searchTerm) {
    if (!laporanFilterManager) {
        return;
    }
    
    laporanFilterManager.applySearch(searchTerm);
    updateLaporanDisplay();
}

/**
 * Handle search input WITH DEBOUNCING - Task 13 Performance Optimization
 * Debounced version (300ms delay) to prevent excessive re-renders
 * @param {string} searchTerm - Search term
 */
const handleSearchLaporan = debounce(handleSearchLaporanInternal, 300);

/**
 * Handle departemen filter change
 * @param {string} departemen - Selected departemen
 */
function handleDepartemenFilter(departemen) {
    if (!laporanFilterManager) {
        return;
    }
    
    laporanFilterManager.applyDepartemenFilter(departemen);
    updateLaporanDisplay();
}

/**
 * Handle tipe anggota filter change
 * @param {string} tipe - Selected tipe anggota
 */
function handleTipeAnggotaFilter(tipe) {
    if (!laporanFilterManager) {
        return;
    }
    
    laporanFilterManager.applyTipeAnggotaFilter(tipe);
    updateLaporanDisplay();
}

/**
 * Handle reset filter button
 */
function handleResetFilter() {
    if (!laporanFilterManager) {
        return;
    }
    
    // Reset filter manager
    laporanFilterManager.resetFilters();
    
    // Reset UI inputs
    const searchInput = document.getElementById('searchLaporan');
    const departemenSelect = document.getElementById('filterDepartemen');
    const tipeSelect = document.getElementById('filterTipeAnggota');
    
    if (searchInput) searchInput.value = '';
    if (departemenSelect) departemenSelect.value = '';
    if (tipeSelect) tipeSelect.value = '';
    
    // Update display
    updateLaporanDisplay();
}

/**
 * Update laporan display with filtered data
 * WITH PAGINATION SUPPORT - Task 13 Performance Optimization
 */
function updateLaporanDisplay() {
    if (!laporanFilterManager) {
        return;
    }
    
    let filteredData = laporanFilterManager.getFilteredData();
    const filterCount = laporanFilterManager.getFilterCount();
    
    // Apply current sort if any
    if (currentSortColumn) {
        filteredData = sortData(filteredData, currentSortColumn, currentSortDirection);
    }
    
    // Update statistics cards
    const stats = calculateStatistics(filteredData);
    updateStatisticsCards(stats);
    
    // Task 13: Apply pagination if dataset is large (> 25 items)
    let displayData = filteredData;
    if (filteredData.length > 25) {
        laporanPagination.setTotalItems(filteredData.length);
        // Reset to page 1 when filter changes
        laporanPagination.currentPage = 1;
        displayData = laporanPagination.getPaginatedData(filteredData);
    }
    
    // Update table body
    const tbody = document.getElementById('tbodyLaporanAnggota');
    if (tbody) {
        tbody.innerHTML = renderTableRows(displayData);
    }
    
    // Update card view
    const cardView = document.getElementById('cardViewContainer');
    if (cardView) {
        cardView.innerHTML = renderCardView(displayData);
    }
    
    // Update table footer (use full filtered data for totals)
    const tfoot = document.getElementById('tableLaporanAnggota tfoot tr');
    if (tfoot) {
        tfoot.innerHTML = `
            <td colspan="4" class="text-end">TOTAL:</td>
            <td class="text-end">${formatRupiah(filteredData.reduce((sum, d) => sum + d.transaksi.totalCash, 0))}</td>
            <td class="text-end">${formatRupiah(filteredData.reduce((sum, d) => sum + d.transaksi.totalBon, 0))}</td>
            <td class="text-end">${formatRupiah(filteredData.reduce((sum, d) => sum + d.simpanan.total, 0))}</td>
            <td class="text-end">${formatRupiah(filteredData.reduce((sum, d) => sum + d.transaksi.outstandingBalance, 0))}</td>
            <td></td>
        `;
    }
    
    // Update filter count info
    const filterCountInfo = document.getElementById('filterCountInfo');
    if (filterCountInfo) {
        filterCountInfo.innerHTML = `
            Menampilkan <strong>${filterCount.filtered}</strong> dari <strong>${filterCount.total}</strong> anggota
        `;
    }
    
    // Task 13: Update pagination controls if needed
    if (filteredData.length > 25) {
        updatePaginationControls();
    }
    
    // Update sort indicators
    if (currentSortColumn) {
        updateSortIndicators(currentSortColumn, currentSortDirection);
    }
}

/**
 * Update statistics cards with new data
 * @param {Object} stats - Statistics object
 */
function updateStatisticsCards(stats) {
    const totalAnggotaEl = document.getElementById('statTotalAnggota');
    const totalTransaksiEl = document.getElementById('statTotalTransaksi');
    const totalSimpananEl = document.getElementById('statTotalSimpanan');
    const totalOutstandingEl = document.getElementById('statTotalOutstanding');
    
    if (totalAnggotaEl) totalAnggotaEl.textContent = stats.totalAnggota;
    if (totalTransaksiEl) totalTransaksiEl.textContent = formatRupiah(stats.totalTransaksi);
    if (totalSimpananEl) totalSimpananEl.textContent = formatRupiah(stats.totalSimpanan);
    if (totalOutstandingEl) totalOutstandingEl.textContent = formatRupiah(stats.totalOutstanding);
}

// ============================================================================
// PAGINATION FUNCTIONS - Task 13 Performance Optimization
// ============================================================================

/**
 * Render pagination controls
 * @param {number} totalItems - Total number of items
 * @returns {string} HTML for pagination controls
 */
function renderPaginationControls(totalItems) {
    const info = laporanPagination.getInfo();
    
    return `
        <div class="card mt-3">
            <div class="card-body">
                <div class="row align-items-center">
                    <div class="col-md-6 mb-2 mb-md-0">
                        <p class="mb-0 text-muted">
                            <i class="bi bi-info-circle me-1"></i>
                            Menampilkan <strong>${info.startIndex}</strong> - <strong>${info.endIndex}</strong> dari <strong>${info.totalItems}</strong> anggota
                        </p>
                    </div>
                    <div class="col-md-6">
                        <nav aria-label="Pagination">
                            <ul class="pagination justify-content-md-end mb-0">
                                <li class="page-item ${info.currentPage === 1 ? 'disabled' : ''}">
                                    <a class="page-link" href="#" onclick="goToPreviousPage(); return false;">
                                        <i class="bi bi-chevron-left"></i> Previous
                                    </a>
                                </li>
                                ${renderPageNumbers(info)}
                                <li class="page-item ${info.currentPage === info.totalPages ? 'disabled' : ''}">
                                    <a class="page-link" href="#" onclick="goToNextPage(); return false;">
                                        Next <i class="bi bi-chevron-right"></i>
                                    </a>
                                </li>
                            </ul>
                        </nav>
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Render page numbers for pagination
 * @param {Object} info - Pagination info
 * @returns {string} HTML for page numbers
 */
function renderPageNumbers(info) {
    const pages = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, info.currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(info.totalPages, startPage + maxPagesToShow - 1);
    
    // Adjust start if we're near the end
    if (endPage - startPage < maxPagesToShow - 1) {
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    
    // First page
    if (startPage > 1) {
        pages.push(`
            <li class="page-item">
                <a class="page-link" href="#" onclick="goToPageNumber(1); return false;">1</a>
            </li>
        `);
        if (startPage > 2) {
            pages.push(`<li class="page-item disabled"><span class="page-link">...</span></li>`);
        }
    }
    
    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
        pages.push(`
            <li class="page-item ${i === info.currentPage ? 'active' : ''}">
                <a class="page-link" href="#" onclick="goToPageNumber(${i}); return false;">${i}</a>
            </li>
        `);
    }
    
    // Last page
    if (endPage < info.totalPages) {
        if (endPage < info.totalPages - 1) {
            pages.push(`<li class="page-item disabled"><span class="page-link">...</span></li>`);
        }
        pages.push(`
            <li class="page-item">
                <a class="page-link" href="#" onclick="goToPageNumber(${info.totalPages}); return false;">${info.totalPages}</a>
            </li>
        `);
    }
    
    return pages.join('');
}

/**
 * Apply pagination to current data
 */
function applyPagination() {
    if (!laporanFilterManager) return;
    
    const filteredData = laporanFilterManager.getFilteredData();
    laporanPagination.setTotalItems(filteredData.length);
    
    // Get paginated data
    const paginatedData = laporanPagination.getPaginatedData(filteredData);
    
    // Update table
    const tbody = document.getElementById('tbodyLaporanAnggota');
    if (tbody) {
        tbody.innerHTML = renderTableRows(paginatedData);
    }
    
    // Update card view
    const cardView = document.getElementById('cardViewContainer');
    if (cardView) {
        cardView.innerHTML = renderCardView(paginatedData);
    }
    
    // Update pagination controls
    updatePaginationControls();
}

/**
 * Update pagination controls
 */
function updatePaginationControls() {
    const paginationContainer = document.querySelector('.pagination');
    if (!paginationContainer) return;
    
    const info = laporanPagination.getInfo();
    
    // Update info text
    const infoText = document.querySelector('.card-body p');
    if (infoText) {
        infoText.innerHTML = `
            <i class="bi bi-info-circle me-1"></i>
            Menampilkan <strong>${info.startIndex}</strong> - <strong>${info.endIndex}</strong> dari <strong>${info.totalItems}</strong> anggota
        `;
    }
    
    // Update page numbers
    paginationContainer.innerHTML = `
        <li class="page-item ${info.currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="goToPreviousPage(); return false;">
                <i class="bi bi-chevron-left"></i> Previous
            </a>
        </li>
        ${renderPageNumbers(info)}
        <li class="page-item ${info.currentPage === info.totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="goToNextPage(); return false;">
                Next <i class="bi bi-chevron-right"></i>
            </a>
        </li>
    `;
}

/**
 * Go to specific page
 * @param {number} page - Page number
 */
function goToPageNumber(page) {
    laporanPagination.goToPage(page);
    applyPagination();
    
    // Scroll to top of table
    const tableCard = document.querySelector('.laporan-table-view');
    if (tableCard) {
        tableCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

/**
 * Go to next page
 */
function goToNextPage() {
    laporanPagination.nextPage();
    applyPagination();
    
    // Scroll to top of table
    const tableCard = document.querySelector('.laporan-table-view');
    if (tableCard) {
        tableCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

/**
 * Go to previous page
 */
function goToPreviousPage() {
    laporanPagination.previousPage();
    applyPagination();
    
    // Scroll to top of table
    const tableCard = document.querySelector('.laporan-table-view');
    if (tableCard) {
        tableCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// ============================================================================
// END PAGINATION FUNCTIONS
// ============================================================================

// ============================================================================
// LAZY LOADING HELPERS - Task 13 Performance Optimization
// ============================================================================

/**
 * Show loading modal
 * @param {string} modalId - Modal ID
 * @param {string} message - Loading message
 */
function showLoadingModal(modalId, message = 'Memuat data...') {
    // Remove existing modal if any
    const existingModal = document.getElementById(modalId);
    if (existingModal) {
        existingModal.remove();
    }
    
    const loadingModalHTML = `
        <div class="modal fade" id="${modalId}" tabindex="-1" data-bs-backdrop="static">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-body text-center py-5">
                        <div class="spinner-border text-primary" role="status" style="width: 3rem; height: 3rem;">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                        <p class="mt-3 mb-0">${message}</p>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', loadingModalHTML);
    
    const modal = new bootstrap.Modal(document.getElementById(modalId));
    modal.show();
}

/**
 * Hide loading modal
 * @param {string} modalId - Modal ID
 */
function hideLoadingModal(modalId) {
    const modalElement = document.getElementById(modalId);
    if (modalElement) {
        const modal = bootstrap.Modal.getInstance(modalElement);
        if (modal) {
            modal.hide();
        }
        modalElement.remove();
    }
}

// ============================================================================
// END LAZY LOADING HELPERS
// ============================================================================
