/**
 * Pembayaran Hutang Piutang Integrated Controller
 * Main controller for integrated payment interface with tab-based navigation
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 6.1, 6.2, 7.1, 7.2
 */

// Import dependencies conditionally for different environments
let SharedPaymentServices, ImportTagihanManager, ImportTagihanEnhanced;

if (typeof require !== 'undefined') {
    // Node.js environment
    try {
        SharedPaymentServices = require('./shared/SharedPaymentServices.js').SharedPaymentServices;
        ImportTagihanManager = require('./import-tagihan/ImportTagihanManager.js').ImportTagihanManager;
        ImportTagihanEnhanced = require('./import-tagihan/ImportTagihanEnhanced.js').ImportTagihanEnhanced;
    } catch (e) {
        console.warn('Some components not available in Node.js environment');
    }
} else if (typeof window !== 'undefined') {
    // Browser environment - will be available after loading
    SharedPaymentServices = window.SharedPaymentServices;
    ImportTagihanManager = window.ImportTagihanManager;
    ImportTagihanEnhanced = window.ImportTagihanEnhanced;
}

/**
 * Main integration controller class
 * Manages tab-based interface between manual payment and import batch
 */
class PembayaranHutangPiutangIntegrated {
    constructor() {
        // Tab management
        this.activeTab = 'manual';
        this.tabs = {
            manual: {
                id: 'manual',
                name: 'Pembayaran Manual',
                icon: 'bi-person',
                controller: null,
                hasUnsavedData: false
            },
            import: {
                id: 'import',
                name: 'Import Batch',
                icon: 'bi-upload',
                controller: null,
                hasUnsavedData: false
            }
        };

        // State management
        this.isInitialized = false;
        this.sessionId = this._generateSessionId();
        
        // Shared services
        this.sharedServices = null;
        
        // Controllers
        this.manualController = null;
        this.importController = null;
        
        // Real-time update manager
        this.updateManager = null;
        
        // Lazy loading manager for performance optimization
        this.lazyLoadingManager = null;
        
        // Data query optimizer for efficient queries
        this.dataQueryOptimizer = null;
        
        // Event handlers
        this.eventHandlers = new Map();
        
        // User context
        this.currentUser = null;
        
        // Permission manager
        this.permissionManager = null;
        
        // Security audit logger
        this.securityAuditLogger = null;
        
        // Initialize user context
        this._initializeUserContext();
        
        // Initialize permission manager
        this._initializePermissionManager();
        
        // Initialize security audit logger
        this._initializeSecurityAuditLogger();
    }

    /**
     * Initialize the integrated interface
     * Requirements: 1.1, 6.1
     */
    async initialize() {
        if (this.isInitialized) {
            console.warn('PembayaranHutangPiutangIntegrated already initialized');
            return;
        }

        try {
            // Initialize shared services
            await this._initializeSharedServices();
            
            // Initialize performance optimization components
            this._initializePerformanceOptimization();
            
            // Initialize real-time update manager
            this._initializeUpdateManager();
            
            // Initialize controllers with lazy loading
            await this._initializeControllersLazy();
            
            // Render the interface
            this.render();
            
            // Setup event listeners
            this._setupEventListeners();
            
            // Initialize default tab with permission check
            await this._initializeDefaultTab();
            
            this.isInitialized = true;
            
            console.log('PembayaranHutangPiutangIntegrated initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize PembayaranHutangPiutangIntegrated:', error);
            throw error;
        }
    }

    /**
     * Render the main integrated interface
     * Requirements: 1.1, 1.2, 1.3
     */
    render() {
        const content = document.getElementById('mainContent');
        if (!content) {
            throw new Error('Main content element not found');
        }

        content.innerHTML = `
            <style>
                .integrated-payment-container {
                    min-height: 100vh;
                }
                .tab-navigation {
                    background: #f8f9fa;
                    border-bottom: 2px solid #dee2e6;
                    padding: 0;
                    margin-bottom: 0;
                }
                .tab-btn {
                    background: none;
                    border: none;
                    padding: 15px 25px;
                    font-size: 16px;
                    font-weight: 500;
                    color: #6c757d;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    border-bottom: 3px solid transparent;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .tab-btn:hover {
                    background: #e9ecef;
                    color: #495057;
                }
                .tab-btn.active {
                    background: #fff;
                    color: #0d6efd;
                    border-bottom-color: #0d6efd;
                }
                .tab-btn i {
                    font-size: 18px;
                }
                .tab-content {
                    background: #fff;
                    min-height: calc(100vh - 200px);
                }
                .tab-pane {
                    display: none;
                    padding: 20px;
                    animation: fadeIn 0.3s ease-in;
                }
                .tab-pane.active {
                    display: block;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .unsaved-indicator {
                    display: inline-block;
                    width: 8px;
                    height: 8px;
                    background: #dc3545;
                    border-radius: 50%;
                    margin-left: 5px;
                    animation: pulse 1.5s infinite;
                }
                @keyframes pulse {
                    0% { opacity: 1; }
                    50% { opacity: 0.5; }
                    100% { opacity: 1; }
                }
                .keyboard-shortcuts {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    background: rgba(0,0,0,0.9);
                    color: white;
                    border-radius: 8px;
                    font-size: 13px;
                    z-index: 10000;
                    display: none;
                    max-width: 350px;
                    box-shadow: 0 8px 32px rgba(0,0,0,0.3);
                    backdrop-filter: blur(10px);
                }
                .keyboard-shortcuts.show {
                    display: block;
                    animation: slideInUp 0.3s ease-out;
                }
                .keyboard-shortcuts-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 15px 20px 10px;
                    border-bottom: 1px solid rgba(255,255,255,0.2);
                }
                .keyboard-shortcuts-content {
                    padding: 15px 20px;
                }
                .shortcut-group {
                    margin-bottom: 15px;
                }
                .shortcut-group:last-child {
                    margin-bottom: 0;
                }
                .shortcut-group h6 {
                    color: #ffc107;
                    margin-bottom: 8px;
                    font-size: 12px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .shortcut-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 5px;
                    padding: 2px 0;
                }
                .shortcut-item kbd {
                    background: rgba(255,255,255,0.2);
                    color: white;
                    border: 1px solid rgba(255,255,255,0.3);
                    border-radius: 3px;
                    padding: 2px 6px;
                    font-size: 11px;
                    margin: 0 2px;
                }
                .shortcut-item span {
                    color: rgba(255,255,255,0.9);
                    font-size: 12px;
                }
                @keyframes slideInUp {
                    from { 
                        opacity: 0; 
                        transform: translateY(20px); 
                    }
                    to { 
                        opacity: 1; 
                        transform: translateY(0); 
                    }
                }
                @keyframes slideInRight {
                    from { 
                        opacity: 0; 
                        transform: translateX(20px); 
                    }
                    to { 
                        opacity: 1; 
                        transform: translateX(0); 
                    }
                }
                @keyframes slideOutRight {
                    from { 
                        opacity: 1; 
                        transform: translateX(0); 
                    }
                    to { 
                        opacity: 0; 
                        transform: translateX(20px); 
                    }
                }
            </style>
            
            <div class="integrated-payment-container">
                <!-- Header -->
                <div class="container-fluid py-3">
                    <div class="row">
                        <div class="col-12">
                            <h2><i class="bi bi-cash-coin"></i> Pembayaran Hutang / Piutang Anggota</h2>
                            <p class="text-muted">Interface terintegrasi untuk pembayaran manual dan import batch</p>
                        </div>
                    </div>
                </div>

                <!-- Tab Navigation -->
                <div class="tab-navigation">
                    <div class="container-fluid">
                        <div class="row">
                            <div class="col-12">
                                <div class="d-flex" role="tablist" aria-label="Payment Methods" id="tab-navigation-container">
                                    ${this._renderTabButtons()}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Tab Content -->
                <div class="tab-content">
                    <!-- Manual Payment Tab -->
                    <div class="tab-pane active" 
                         id="manual-tab-pane"
                         role="tabpanel"
                         aria-labelledby="tab-manual"
                         tabindex="0">
                        <div id="manual-payment-container">
                            <div class="text-center py-5">
                                <div class="spinner-border text-primary" role="status">
                                    <span class="visually-hidden">Loading...</span>
                                </div>
                                <p class="mt-3">Memuat interface pembayaran manual...</p>
                            </div>
                        </div>
                    </div>

                    <!-- Import Batch Tab -->
                    <div class="tab-pane" 
                         id="import-tab-pane"
                         role="tabpanel"
                         aria-labelledby="tab-import"
                         tabindex="0"
                         aria-hidden="true">
                        <div id="import-batch-container">
                            <div class="text-center py-5">
                                <div class="spinner-border text-primary" role="status">
                                    <span class="visually-hidden">Loading...</span>
                                </div>
                                <p class="mt-3">Memuat interface import batch...</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Keyboard Shortcuts Help -->
                <div class="keyboard-shortcuts" id="keyboard-shortcuts">
                    <div class="keyboard-shortcuts-header">
                        <strong><i class="bi bi-keyboard"></i> Keyboard Shortcuts</strong>
                        <button type="button" class="btn-close btn-close-white" onclick="document.getElementById('keyboard-shortcuts').classList.remove('show')" aria-label="Close"></button>
                    </div>
                    <div class="keyboard-shortcuts-content">
                        <div class="shortcut-group">
                            <h6>Navigation</h6>
                            <div class="shortcut-item">
                                <kbd>Ctrl</kbd> + <kbd>1</kbd> <span>Pembayaran Manual</span>
                            </div>
                            <div class="shortcut-item">
                                <kbd>Ctrl</kbd> + <kbd>2</kbd> <span>Import Batch</span>
                            </div>
                            <div class="shortcut-item">
                                <kbd>Alt</kbd> + <kbd>1/2</kbd> <span>Focus Tab Button</span>
                            </div>
                            <div class="shortcut-item">
                                <kbd>←</kbd> <kbd>→</kbd> <span>Navigate Tabs (when focused)</span>
                            </div>
                        </div>
                        <div class="shortcut-group">
                            <h6>Actions</h6>
                            <div class="shortcut-item">
                                <kbd>Ctrl</kbd> + <kbd>S</kbd> <span>Save Current Data</span>
                            </div>
                            <div class="shortcut-item">
                                <kbd>Ctrl</kbd> + <kbd>R</kbd> <span>Reset Current Form</span>
                            </div>
                            <div class="shortcut-item">
                                <kbd>Ctrl</kbd> + <kbd>H</kbd> <span>Toggle This Help</span>
                            </div>
                        </div>
                        <div class="shortcut-group">
                            <h6>Accessibility</h6>
                            <div class="shortcut-item">
                                <kbd>Enter</kbd> / <kbd>Space</kbd> <span>Activate Focused Tab</span>
                            </div>
                            <div class="shortcut-item">
                                <kbd>Esc</kbd> <span>Cancel Dialogs</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Switch between tabs with unsaved data handling
     * Requirements: 1.4, 7.1
     * @param {string} tabId - Target tab ID
     * @returns {Promise<boolean>} Switch success
     */
    async switchTab(tabId) {
        if (!this.tabs[tabId]) {
            console.error(`Invalid tab ID: ${tabId}`);
            return false;
        }

        // Don't switch if already on the target tab
        if (this.activeTab === tabId) {
            return true;
        }

        // Check permission to access target tab
        if (this.permissionManager) {
            const validation = this.permissionManager.validateTabSwitch(this.activeTab, tabId);
            if (!validation.allowed) {
                console.warn(`Tab switch denied: ${validation.reason}`);
                this._handleTabAccessDenied(tabId, validation.reason);
                return false;
            }
        }

        // Check for unsaved data in current tab
        if (this.tabs[this.activeTab].hasUnsavedData) {
            const confirmed = await this._showUnsavedDataDialog();
            if (!confirmed) {
                return false; // User cancelled
            }
        }

        try {
            // Save current tab state
            await this._saveTabState(this.activeTab);
            
            // Load target controller lazily if not already loaded
            let targetController = this.tabs[tabId].controller;
            
            if (!targetController && this.lazyLoadingManager) {
                // Lazy load the controller
                console.log(`Lazy loading controller for tab: ${tabId}`);
                targetController = await this.lazyLoadingManager.loadController(
                    tabId,
                    this.sharedServices
                );
                this.tabs[tabId].controller = targetController;
                
                // Store reference for easy access
                if (tabId === 'import') {
                    this.importController = targetController;
                }
            }
            
            // Initialize target controller if needed
            if (targetController && !targetController.isInitialized) {
                await targetController.initialize();
            }
            
            // Update UI navigation
            this._updateTabNavigation(tabId);
            
            // Load target tab content
            await this._loadTabContent(tabId);
            
            // Restore tab state
            await this._restoreTabState(tabId);
            
            // Update active tab
            const previousTab = this.activeTab;
            this.activeTab = tabId;
            
            // Update tab state tracking
            this._updateTabStateTracking(previousTab, tabId);
            
            // Log tab switch
            this._logTabSwitch(previousTab, tabId);
            
            // Focus management for accessibility
            this._manageFocus(tabId);
            
            return true;
            
        } catch (error) {
            console.error(`Failed to switch to tab ${tabId}:`, error);
            this._showErrorNotification(`Gagal beralih ke tab ${this.tabs[tabId].name}`, error);
            return false;
        }
    }

    /**
     * Mark tab as having unsaved data
     * Requirements: 1.4
     * @param {string} tabId - Tab ID
     * @param {boolean} hasUnsaved - Has unsaved data
     */
    setUnsavedData(tabId, hasUnsaved) {
        if (this.tabs[tabId]) {
            this.tabs[tabId].hasUnsavedData = hasUnsaved;
            
            // Update UI indicator
            const indicator = document.getElementById(`unsaved-${tabId}`);
            if (indicator) {
                indicator.style.display = hasUnsaved ? 'inline-block' : 'none';
            }
        }
    }

    /**
     * Get shared services instance
     * Requirements: 6.1, 6.2
     * @returns {SharedPaymentServices} Shared services
     */
    getSharedServices() {
        return this.sharedServices;
    }

    /**
     * Get current tab controller
     * @returns {Object|null} Current tab controller
     */
    getCurrentController() {
        return this.tabs[this.activeTab].controller;
    }

    /**
     * Refresh all tab data
     * Requirements: 5.5
     */
    async refreshAllTabs() {
        try {
            // Refresh shared services data
            if (this.sharedServices) {
                await this.sharedServices.refreshData();
            }
            
            // Refresh current tab
            await this._loadTabContent(this.activeTab);
            
            // Mark other tabs for refresh on next access
            Object.keys(this.tabs).forEach(tabId => {
                if (tabId !== this.activeTab) {
                    this.tabs[tabId].needsRefresh = true;
                }
            });
            
        } catch (error) {
            console.error('Failed to refresh tabs:', error);
            this._showErrorNotification('Gagal memperbarui data', error);
        }
    }

    /**
     * Cleanup and destroy the integrated interface
     */
    destroy() {
        // Clear unsaved data check interval
        if (this.unsavedDataCheckInterval) {
            clearInterval(this.unsavedDataCheckInterval);
            this.unsavedDataCheckInterval = null;
        }

        // Remove event listeners
        this._removeEventListeners();
        
        // Cleanup performance optimization components
        if (this.lazyLoadingManager && typeof this.lazyLoadingManager.clearAll === 'function') {
            this.lazyLoadingManager.clearAll();
        }
        
        if (this.dataQueryOptimizer && typeof this.dataQueryOptimizer.invalidateCache === 'function') {
            this.dataQueryOptimizer.invalidateCache();
        }
        
        // Cleanup update manager
        if (this.updateManager && typeof this.updateManager.destroy === 'function') {
            this.updateManager.destroy();
        }
        
        // Cleanup controllers
        if (this.manualController && typeof this.manualController.destroy === 'function') {
            this.manualController.destroy();
        }
        if (this.importController && typeof this.importController.destroy === 'function') {
            this.importController.destroy();
        }
        
        // Clear state
        this.isInitialized = false;
        this.activeTab = 'manual';
        this.eventHandlers.clear();
        
        console.log('PembayaranHutangPiutangIntegrated destroyed');
    }

    // Private methods

    /**
     * Initialize user context
     * @private
     */
    _initializeUserContext() {
        if (typeof localStorage !== 'undefined') {
            try {
                const currentUser = localStorage.getItem('currentUser');
                if (currentUser) {
                    this.currentUser = JSON.parse(currentUser);
                }
            } catch (error) {
                console.warn('Failed to initialize user context:', error);
            }
        }
    }

    /**
     * Initialize permission manager
     * Requirements: 8.1, 8.2
     * @private
     */
    _initializePermissionManager() {
        try {
            // Get TabPermissionManager from window if available
            const TabPermissionManager = window.TabPermissionManager;
            
            if (TabPermissionManager) {
                this.permissionManager = new TabPermissionManager();
                
                // Update user context in permission manager
                if (this.currentUser) {
                    this.permissionManager.updateUserContext(this.currentUser);
                }
                
                console.log('Permission manager initialized');
            } else {
                console.warn('TabPermissionManager not available, creating placeholder');
                this.permissionManager = this._createPlaceholderPermissionManager();
            }
        } catch (error) {
            console.error('Failed to initialize permission manager:', error);
            this.permissionManager = this._createPlaceholderPermissionManager();
        }
    }

    /**
     * Render tab buttons based on user permissions
     * Requirements: 8.1, 8.2
     * @private
     * @returns {string} HTML for tab buttons
     */
    _renderTabButtons() {
        try {
            if (!this.permissionManager) {
                // Fallback to all tabs if permission manager not available
                return this._renderAllTabButtons();
            }

            const availableTabs = this.permissionManager.getAvailableTabs();
            
            if (availableTabs.length === 0) {
                return '<div class="alert alert-warning">Tidak ada tab yang tersedia untuk role Anda.</div>';
            }

            return availableTabs.map((tab, index) => {
                const isActive = tab.id === this.activeTab;
                const shortcutKey = index + 1;
                
                return `
                    <button class="tab-btn ${isActive ? 'active' : ''}" 
                            data-tab="${tab.id}" 
                            id="tab-${tab.id}"
                            role="tab"
                            aria-controls="${tab.id}-tab-pane"
                            aria-selected="${isActive}"
                            tabindex="${isActive ? '0' : '-1'}"
                            title="${tab.description} (Ctrl+${shortcutKey})">
                        <i class="${tab.icon}" aria-hidden="true"></i>
                        ${tab.name}
                        <span class="unsaved-indicator" 
                              id="unsaved-${tab.id}" 
                              style="display: none;"
                              aria-label="Data belum tersimpan"></span>
                    </button>
                `;
            }).join('');
            
        } catch (error) {
            console.error('Error rendering tab buttons:', error);
            return this._renderAllTabButtons();
        }
    }

    /**
     * Render all tab buttons (fallback)
     * @private
     * @returns {string} HTML for all tab buttons
     */
    _renderAllTabButtons() {
        return `
            <button class="tab-btn active" 
                    data-tab="manual" 
                    id="tab-manual"
                    role="tab"
                    aria-controls="manual-tab-pane"
                    aria-selected="true"
                    tabindex="0"
                    title="Pembayaran Manual (Ctrl+1)">
                <i class="bi bi-person" aria-hidden="true"></i>
                Pembayaran Manual
                <span class="unsaved-indicator" 
                      id="unsaved-manual" 
                      style="display: none;"
                      aria-label="Data belum tersimpan"></span>
            </button>
            <button class="tab-btn" 
                    data-tab="import" 
                    id="tab-import"
                    role="tab"
                    aria-controls="import-tab-pane"
                    aria-selected="false"
                    tabindex="-1"
                    title="Import Batch (Ctrl+2)">
                <i class="bi bi-upload" aria-hidden="true"></i>
                Import Batch
                <span class="unsaved-indicator" 
                      id="unsaved-import" 
                      style="display: none;"
                      aria-label="Data belum tersimpan"></span>
            </button>
        `;
    }

    /**
     * Initialize default tab with permission check
     * Requirements: 8.1, 8.2
     * @private
     */
    async _initializeDefaultTab() {
        try {
            let defaultTab = 'manual';
            
            if (this.permissionManager) {
                const availableTabs = this.permissionManager.getAvailableTabs();
                
                if (availableTabs.length === 0) {
                    throw new Error('No tabs available for current user');
                }
                
                // Use first available tab as default
                defaultTab = availableTabs[0].id;
                
                // Update active tab if current active tab is not available
                if (!availableTabs.find(tab => tab.id === this.activeTab)) {
                    this.activeTab = defaultTab;
                }
            }
            
            await this.switchTab(defaultTab);
            
        } catch (error) {
            console.error('Failed to initialize default tab:', error);
            this._handleNoTabsAvailable();
        }
    }

    /**
     * Handle tab access denied
     * Requirements: 8.1, 8.2
     * @private
     * @param {string} tabId - Tab ID that was denied
     * @param {string} reason - Denial reason
     */
    _handleTabAccessDenied(tabId, reason) {
        try {
            const tabName = this.tabs[tabId]?.name || tabId;
            
            // Show user-friendly error message
            if (typeof showAlert === 'function') {
                showAlert(
                    `Akses Ditolak: Anda tidak memiliki izin untuk mengakses ${tabName}. ` +
                    `Hubungi administrator jika Anda memerlukan akses ini.`,
                    'warning'
                );
            } else {
                alert(`Akses ditolak untuk ${tabName}`);
            }
            
            // Log the denial to enhanced audit logger
            if (this.permissionManager && this.permissionManager.auditLogger) {
                this.permissionManager.auditLogger.logAccessAttempt('TAB_ACCESS_DENIED', {
                    tabId,
                    reason,
                    userId: this.currentUser?.id,
                    userName: this.currentUser?.name,
                    userRole: this.currentUser?.role
                }, 'denied');
            }
            
            // Log the denial to security audit logger with enhanced context
            if (this.securityAuditLogger) {
                this.securityAuditLogger.logTabAccessAttempt(tabId, 'denied', {
                    reason,
                    userId: this.currentUser?.id,
                    userName: this.currentUser?.name,
                    userRole: this.currentUser?.role,
                    interface: 'integrated-payment',
                    feature: 'tab-access-control',
                    denialContext: {
                        attemptedAction: 'tab_switch',
                        currentTab: this.activeTab,
                        targetTab: tabId
                    }
                });
            }
            
        } catch (error) {
            console.error('Error handling tab access denied:', error);
        }
    }

    /**
     * Handle no tabs available scenario
     * Requirements: 8.1, 8.2
     * @private
     */
    _handleNoTabsAvailable() {
        try {
            const content = document.getElementById('mainContent');
            if (content) {
                content.innerHTML = `
                    <div class="container-fluid py-5">
                        <div class="row justify-content-center">
                            <div class="col-md-6 text-center">
                                <div class="alert alert-warning">
                                    <i class="bi bi-exclamation-triangle-fill me-2"></i>
                                    <h4>Akses Terbatas</h4>
                                    <p>Anda tidak memiliki izin untuk mengakses fitur pembayaran hutang/piutang.</p>
                                    <p>Hubungi administrator untuk mendapatkan akses yang diperlukan.</p>
                                    <button class="btn btn-primary" onclick="navigateTo('dashboard')">
                                        <i class="bi bi-house me-1"></i>Kembali ke Dashboard
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error handling no tabs available:', error);
        }
    }

    /**
     * Initialize security audit logger
     * Requirements: 8.3, 8.4
     * @private
     */
    _initializeSecurityAuditLogger() {
        try {
            // Get SecurityAuditLogger from window if available
            if (typeof window !== 'undefined' && window._securityAuditLogger) {
                this.securityAuditLogger = window._securityAuditLogger;
            } else if (typeof window !== 'undefined' && window.SecurityAuditLogger) {
                this.securityAuditLogger = new window.SecurityAuditLogger();
            }
            
            // Update user context in security audit logger
            if (this.securityAuditLogger && this.currentUser) {
                this.securityAuditLogger.updateUserContext(this.currentUser);
            }
            
            console.log('Security audit logger initialized');
        } catch (error) {
            console.error('Failed to initialize security audit logger:', error);
        }
    }

    /**
     * Create placeholder permission manager
     * @private
     * @returns {Object} Placeholder permission manager
     */
    _createPlaceholderPermissionManager() {
        return {
            hasTabAccess: () => true,
            getAvailableTabs: () => [
                { id: 'manual', name: 'Pembayaran Manual', icon: 'bi-person', description: 'Pembayaran manual' },
                { id: 'import', name: 'Import Batch', icon: 'bi-upload', description: 'Import batch' }
            ],
            validateTabSwitch: () => ({ allowed: true, reason: 'PLACEHOLDER' }),
            updateUserContext: () => {},
            auditLogger: null,
            securityAuditLogger: null
        };
    }

    /**
     * Initialize shared services
     * @private
     */
    async _initializeSharedServices() {
        if (!SharedPaymentServices) {
            // Try to get from window if not available
            SharedPaymentServices = window.SharedPaymentServices;
        }
        
        if (SharedPaymentServices) {
            this.sharedServices = new SharedPaymentServices();
            await this.sharedServices.initialize();
        } else {
            console.warn('SharedPaymentServices not available, creating placeholder');
            this.sharedServices = this._createPlaceholderServices();
        }
    }

    /**
     * Initialize performance optimization components
     * Requirements: Performance optimization
     * @private
     */
    _initializePerformanceOptimization() {
        try {
            // Initialize lazy loading manager
            if (typeof window !== 'undefined' && window.LazyLoadingManager) {
                this.lazyLoadingManager = new window.LazyLoadingManager();
                console.log('LazyLoadingManager initialized');
            } else {
                console.warn('LazyLoadingManager not available');
            }
            
            // Initialize data query optimizer
            if (typeof window !== 'undefined' && window.DataQueryOptimizer) {
                this.dataQueryOptimizer = new window.DataQueryOptimizer(this.sharedServices);
                console.log('DataQueryOptimizer initialized');
            } else {
                console.warn('DataQueryOptimizer not available');
            }
            
        } catch (error) {
            console.error('Failed to initialize performance optimization:', error);
        }
    }

    /**
     * Initialize real-time update manager
     * Requirements: 5.4, 5.5
     * @private
     */
    _initializeUpdateManager() {
        try {
            // Check if RealTimeUpdateManager is available
            const RealTimeUpdateManager = window.RealTimeUpdateManager;
            
            if (RealTimeUpdateManager) {
                this.updateManager = new RealTimeUpdateManager(this.sharedServices);
                
                // Subscribe to update events for dashboard refresh
                this.updateManager.subscribe('manualPaymentCompleted', (data) => {
                    this._onRealTimeUpdate('manual', data);
                });
                
                this.updateManager.subscribe('importBatchCompleted', (data) => {
                    this._onRealTimeUpdate('import', data);
                });
                
                this.updateManager.subscribe('transactionUpdated', (data) => {
                    this._onRealTimeUpdate('transaction', data);
                });
                
                console.log('Real-time update manager initialized');
            } else {
                console.warn('RealTimeUpdateManager not available');
            }
        } catch (error) {
            console.error('Failed to initialize update manager:', error);
        }
    }

    /**
     * Initialize tab controllers with lazy loading
     * Requirements: Performance optimization - Load controllers only when needed
     * @private
     */
    async _initializeControllersLazy() {
        try {
            // Controllers will be loaded lazily when tabs are accessed
            // Only initialize the manual controller immediately for the default tab
            
            if (this.lazyLoadingManager) {
                // Load manual controller immediately for default tab
                this.manualController = await this.lazyLoadingManager.loadController(
                    'manual', 
                    this.sharedServices,
                    { immediate: true }
                );
                
                this.tabs.manual.controller = this.manualController;
                
                // Import controller will be loaded lazily when import tab is accessed
                this.tabs.import.controller = null; // Will be loaded on demand
                
                console.log('Controllers initialized with lazy loading');
            } else {
                // Fallback to immediate initialization if lazy loading not available
                await this._initializeControllersFallback();
            }
            
        } catch (error) {
            console.error('Failed to initialize controllers with lazy loading:', error);
            // Fallback to immediate initialization
            await this._initializeControllersFallback();
        }
    }

    /**
     * Fallback controller initialization (immediate loading)
     * @private
     */
    async _initializeControllersFallback() {
        console.log('Using fallback controller initialization');
        
        // Initialize manual controller with existing PembayaranHutangPiutang functions
        this.manualController = {
            type: 'manual',
            isInitialized: false,
            currentData: {},
            render: async () => await this._renderManualPayment(),
            hasUnsavedData: () => this._checkManualUnsavedData(),
            saveState: () => this._saveManualState(),
            restoreState: () => this._restoreManualState(),
            initialize: async () => {
                if (!this.manualController.isInitialized) {
                    await this._initializeManualController();
                    this.manualController.isInitialized = true;
                }
            },
            destroy: () => this._destroyManualController()
        };

        // Initialize import controller with ImportTagihanManager
        this.importController = {
            type: 'import',
            isInitialized: false,
            manager: null,
            render: async () => await this._renderImportBatch(),
            hasUnsavedData: () => this._checkImportUnsavedData(),
            saveState: () => this._saveImportState(),
            restoreState: () => this._restoreImportState(),
            initialize: async () => {
                if (!this.importController.isInitialized) {
                    await this._initializeImportController();
                    this.importController.isInitialized = true;
                }
            },
            destroy: () => this._destroyImportController()
        };

        // Set controllers in tabs
        this.tabs.manual.controller = this.manualController;
        this.tabs.import.controller = this.importController;
    }

    /**
     * Setup event listeners
     * @private
     */
    _setupEventListeners() {
        // Tab click handlers
        const tabButtons = document.querySelectorAll('.tab-btn');
        tabButtons.forEach(button => {
            const handler = (e) => {
                e.preventDefault();
                const tabId = button.getAttribute('data-tab');
                this.switchTab(tabId);
            };
            button.addEventListener('click', handler);
            this.eventHandlers.set(button, handler);
        });

        // Enhanced keyboard shortcuts
        const keyboardHandler = (e) => {
            // Handle Ctrl key combinations
            if (e.ctrlKey) {
                switch (e.key) {
                    case '1':
                        e.preventDefault();
                        this._handleKeyboardTabSwitch('manual', e);
                        break;
                    case '2':
                        e.preventDefault();
                        this._handleKeyboardTabSwitch('import', e);
                        break;
                    case 'h':
                    case 'H':
                        e.preventDefault();
                        this._toggleKeyboardHelp();
                        break;
                    case 's':
                    case 'S':
                        e.preventDefault();
                        this._handleKeyboardSave();
                        break;
                    case 'r':
                    case 'R':
                        e.preventDefault();
                        this._handleKeyboardReset();
                        break;
                }
            }
            
            // Handle Alt key combinations for accessibility
            if (e.altKey) {
                switch (e.key) {
                    case '1':
                        e.preventDefault();
                        this._focusTabButton('manual');
                        break;
                    case '2':
                        e.preventDefault();
                        this._focusTabButton('import');
                        break;
                }
            }
            
            // Handle arrow keys for tab navigation when focus is on tab buttons
            if (e.target.classList.contains('tab-btn')) {
                switch (e.key) {
                    case 'ArrowLeft':
                        e.preventDefault();
                        this._navigateTabsWithArrows('left');
                        break;
                    case 'ArrowRight':
                        e.preventDefault();
                        this._navigateTabsWithArrows('right');
                        break;
                    case 'Enter':
                    case ' ':
                        e.preventDefault();
                        const tabId = e.target.getAttribute('data-tab');
                        if (tabId) {
                            this.switchTab(tabId);
                        }
                        break;
                }
            }
        };
        document.addEventListener('keydown', keyboardHandler);
        this.eventHandlers.set(document, keyboardHandler);

        // Window beforeunload for unsaved data
        const beforeUnloadHandler = (e) => {
            const hasUnsaved = Object.values(this.tabs).some(tab => tab.hasUnsavedData);
            if (hasUnsaved) {
                e.preventDefault();
                e.returnValue = 'Anda memiliki data yang belum disimpan. Yakin ingin meninggalkan halaman?';
                return e.returnValue;
            }
        };
        window.addEventListener('beforeunload', beforeUnloadHandler);
        this.eventHandlers.set(window, beforeUnloadHandler);

        // Set up automatic unsaved data detection
        this._setupUnsavedDataDetection();
    }

    /**
     * Remove event listeners
     * @private
     */
    _removeEventListeners() {
        this.eventHandlers.forEach((handler, element) => {
            if (element === document) {
                document.removeEventListener('keydown', handler);
            } else if (element === window) {
                window.removeEventListener('beforeunload', handler);
            } else {
                element.removeEventListener('click', handler);
            }
        });
        this.eventHandlers.clear();
    }

    /**
     * Update tab navigation UI
     * @private
     * @param {string} activeTabId - Active tab ID
     */
    _updateTabNavigation(activeTabId) {
        // Update tab buttons with ARIA attributes
        document.querySelectorAll('.tab-btn').forEach(btn => {
            const tabId = btn.getAttribute('data-tab');
            const isActive = tabId === activeTabId;
            
            if (isActive) {
                btn.classList.add('active');
                btn.setAttribute('aria-selected', 'true');
                btn.setAttribute('tabindex', '0');
            } else {
                btn.classList.remove('active');
                btn.setAttribute('aria-selected', 'false');
                btn.setAttribute('tabindex', '-1');
            }
        });

        // Update tab panes with ARIA attributes
        document.querySelectorAll('.tab-pane').forEach(pane => {
            const tabId = pane.id.replace('-tab-pane', '');
            const isActive = tabId === activeTabId;
            
            if (isActive) {
                pane.classList.add('active');
                pane.removeAttribute('aria-hidden');
                pane.setAttribute('tabindex', '0');
            } else {
                pane.classList.remove('active');
                pane.setAttribute('aria-hidden', 'true');
                pane.setAttribute('tabindex', '-1');
            }
        });
    }

    /**
     * Load tab content
     * @private
     * @param {string} tabId - Tab ID to load
     */
    async _loadTabContent(tabId) {
        const controller = this.tabs[tabId].controller;
        if (controller && typeof controller.render === 'function') {
            await controller.render();
        }
    }

    /**
     * Save tab state
     * @private
     * @param {string} tabId - Tab ID to save
     */
    async _saveTabState(tabId) {
        const controller = this.tabs[tabId].controller;
        if (controller && typeof controller.saveState === 'function') {
            await controller.saveState();
        }
    }

    /**
     * Restore tab state
     * @private
     * @param {string} tabId - Tab ID to restore
     */
    async _restoreTabState(tabId) {
        const controller = this.tabs[tabId].controller;
        if (controller && typeof controller.restoreState === 'function') {
            await controller.restoreState();
        }
    }

    /**
     * Show unsaved data confirmation dialog
     * @private
     * @returns {Promise<boolean>} User confirmation
     */
    async _showUnsavedDataDialog() {
        return new Promise((resolve) => {
            const currentTabName = this.tabs[this.activeTab]?.name || 'Tab saat ini';
            
            const modalHTML = `
                <div class="modal fade" id="unsavedDataModal" tabindex="-1" aria-labelledby="unsavedDataModalLabel" aria-hidden="true">
                    <div class="modal-dialog modal-dialog-centered">
                        <div class="modal-content">
                            <div class="modal-header bg-warning text-dark">
                                <h5 class="modal-title" id="unsavedDataModalLabel">
                                    <i class="bi bi-exclamation-triangle"></i> Data Belum Tersimpan
                                </h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body">
                                <div class="alert alert-warning">
                                    <strong>${currentTabName}</strong> memiliki data yang belum disimpan.
                                </div>
                                <p>Apa yang ingin Anda lakukan dengan data tersebut?</p>
                                <div class="d-flex justify-content-center mb-3">
                                    <div class="spinner-border spinner-border-sm text-warning d-none" role="status" id="savingSpinner">
                                        <span class="visually-hidden">Menyimpan...</span>
                                    </div>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal" id="cancelSwitch">
                                    <i class="bi bi-x-circle"></i> Batal
                                </button>
                                <button type="button" class="btn btn-danger" id="discardChanges">
                                    <i class="bi bi-trash"></i> Buang Perubahan
                                </button>
                                <button type="button" class="btn btn-primary" id="saveAndSwitch">
                                    <i class="bi bi-check-circle"></i> Simpan & Lanjut
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // Remove existing modal
            const existingModal = document.getElementById('unsavedDataModal');
            if (existingModal) {
                existingModal.remove();
            }

            // Add modal to body
            document.body.insertAdjacentHTML('beforeend', modalHTML);

            const modal = new bootstrap.Modal(document.getElementById('unsavedDataModal'));
            
            // Handle cancel button
            document.getElementById('cancelSwitch').addEventListener('click', () => {
                modal.hide();
                resolve(false);
            });

            // Handle discard button
            document.getElementById('discardChanges').addEventListener('click', () => {
                this._discardCurrentTabData();
                this.setUnsavedData(this.activeTab, false);
                modal.hide();
                resolve(true);
            });

            // Handle save and switch button
            document.getElementById('saveAndSwitch').addEventListener('click', async () => {
                const saveButton = document.getElementById('saveAndSwitch');
                const spinner = document.getElementById('savingSpinner');
                
                try {
                    // Show loading state
                    saveButton.disabled = true;
                    spinner.classList.remove('d-none');
                    
                    await this._saveCurrentTabData();
                    this.setUnsavedData(this.activeTab, false);
                    modal.hide();
                    resolve(true);
                } catch (error) {
                    console.error('Failed to save data:', error);
                    this._showErrorNotification('Gagal menyimpan data', error);
                    resolve(false);
                } finally {
                    // Hide loading state
                    saveButton.disabled = false;
                    spinner.classList.add('d-none');
                }
            });

            // Handle modal close
            document.getElementById('unsavedDataModal').addEventListener('hidden.bs.modal', () => {
                document.getElementById('unsavedDataModal').remove();
            });

            // Handle escape key
            document.getElementById('unsavedDataModal').addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    modal.hide();
                    resolve(false);
                }
            });

            modal.show();
        });
    }

    /**
     * Save current tab data
     * @private
     */
    async _saveCurrentTabData() {
        try {
            if (this.activeTab === 'manual') {
                await this._saveManualPaymentData();
            } else if (this.activeTab === 'import') {
                await this._saveImportBatchData();
            }
        } catch (error) {
            console.error('Failed to save current tab data:', error);
            throw error;
        }
    }

    /**
     * Save manual payment data
     * @private
     */
    async _saveManualPaymentData() {
        try {
            const form = document.getElementById('formPembayaran');
            if (!form) return;

            // Check if form is valid and ready to submit
            const jenis = document.getElementById('jenisPembayaran')?.value;
            const anggotaId = document.getElementById('selectedAnggotaId')?.value;
            const jumlah = document.getElementById('jumlahPembayaran')?.value;

            if (jenis && anggotaId && jumlah && parseFloat(jumlah) > 0) {
                // Process the payment using existing function
                if (typeof window.prosesPembayaran === 'function') {
                    await window.prosesPembayaran();
                } else {
                    // Save as draft to session storage
                    this._saveManualState();
                }
            } else {
                // Save as draft to session storage
                this._saveManualState();
            }
        } catch (error) {
            console.error('Failed to save manual payment data:', error);
            throw error;
        }
    }

    /**
     * Save import batch data
     * @private
     */
    async _saveImportBatchData() {
        try {
            if (this.importController?.manager) {
                const state = this.importController.manager.getState();
                
                // Save current state to session storage
                if (state.currentBatch) {
                    sessionStorage.setItem(
                        `import_batch_${this.sessionId}`, 
                        JSON.stringify({
                            batchId: state.currentBatch.id,
                            status: state.currentBatch.status,
                            fileName: state.currentBatch.fileName,
                            savedAt: new Date().toISOString()
                        })
                    );
                }
            } else {
                // Save form state
                this._saveImportState();
            }
        } catch (error) {
            console.error('Failed to save import batch data:', error);
            throw error;
        }
    }

    /**
     * Discard current tab data
     * @private
     */
    _discardCurrentTabData() {
        try {
            if (this.activeTab === 'manual') {
                this._discardManualData();
            } else if (this.activeTab === 'import') {
                this._discardImportData();
            }
        } catch (error) {
            console.error('Failed to discard current tab data:', error);
        }
    }

    /**
     * Discard manual payment data
     * @private
     */
    _discardManualData() {
        try {
            // Reset form
            const form = document.getElementById('formPembayaran');
            if (form) {
                form.reset();
            }
            
            // Clear hidden fields
            const hiddenFields = ['selectedAnggotaId', 'selectedAnggotaNama', 'selectedAnggotaNIK'];
            hiddenFields.forEach(fieldId => {
                const field = document.getElementById(fieldId);
                if (field) field.value = '';
            });
            
            // Hide saldo display
            const saldoDisplay = document.getElementById('saldoDisplay');
            if (saldoDisplay) {
                saldoDisplay.style.display = 'none';
            }
            
            // Clear session storage
            sessionStorage.removeItem(`manual_state_${this.sessionId}`);
            
            console.log('Manual payment data discarded');
        } catch (error) {
            console.error('Failed to discard manual data:', error);
        }
    }

    /**
     * Discard import batch data
     * @private
     */
    _discardImportData() {
        try {
            // Reset import manager if available
            if (this.importController?.manager) {
                this.importController.manager.reset();
            }
            
            // Clear file input
            const fileInput = document.getElementById('importFile');
            if (fileInput) {
                fileInput.value = '';
            }
            
            // Clear session storage
            sessionStorage.removeItem(`import_state_${this.sessionId}`);
            sessionStorage.removeItem(`import_batch_${this.sessionId}`);
            
            console.log('Import batch data discarded');
        } catch (error) {
            console.error('Failed to discard import data:', error);
        }
    }

    /**
     * Render manual payment interface
     * @private
     */
    async _renderManualPayment() {
        const container = document.getElementById('manual-payment-container');
        if (!container) return;

        // Use existing renderPembayaranHutangPiutang function if available
        if (typeof window.renderPembayaranHutangPiutang === 'function') {
            // Create a temporary container for the existing function
            const tempDiv = document.createElement('div');
            tempDiv.id = 'mainContent';
            
            // Call existing function
            const originalContent = document.getElementById('mainContent');
            document.body.appendChild(tempDiv);
            
            try {
                window.renderPembayaranHutangPiutang();
                container.innerHTML = tempDiv.innerHTML;
            } finally {
                document.body.removeChild(tempDiv);
            }
        } else {
            // Fallback manual interface
            container.innerHTML = `
                <div class="alert alert-info">
                    <h5><i class="bi bi-info-circle"></i> Pembayaran Manual</h5>
                    <p>Interface pembayaran manual akan dimuat di sini.</p>
                    <p>Fitur ini memungkinkan pemrosesan pembayaran hutang/piutang secara satuan.</p>
                </div>
            `;
        }
    }

    /**
     * Render import batch interface
     * @private
     */
    async _renderImportBatch() {
        const container = document.getElementById('import-batch-container');
        if (!container) return;

        // Use existing import tagihan interface if available
        if (typeof window.renderImportTagihanPembayaran === 'function') {
            // Create a temporary container for the existing function
            const tempDiv = document.createElement('div');
            tempDiv.id = 'mainContent';
            
            // Call existing function
            const originalContent = document.getElementById('mainContent');
            document.body.appendChild(tempDiv);
            
            try {
                window.renderImportTagihanPembayaran();
                
                // Extract the content and adapt it for the tab
                const importContent = tempDiv.innerHTML;
                
                // Remove the header since we already have it in the main tab interface
                const contentWithoutHeader = importContent.replace(
                    /<div class="d-flex justify-content-between.*?<\/div>/s, 
                    ''
                );
                
                container.innerHTML = contentWithoutHeader;
                
                // Re-initialize any JavaScript components that were in the original content
                this._reinitializeImportComponents(container);
                
            } finally {
                document.body.removeChild(tempDiv);
            }
        } else {
            // Fallback import interface with enhanced functionality
            container.innerHTML = `
                <div class="alert alert-info">
                    <i class="bi bi-info-circle-fill me-2"></i>
                    <strong>Informasi:</strong> Fitur ini memungkinkan Anda memproses pembayaran hutang dan piutang dari banyak anggota sekaligus melalui file CSV atau Excel.
                </div>

                <!-- Import Interface Container -->
                <div id="importTagihanContainer">
                    <div class="text-center py-5">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                        <p class="mt-3">Memuat interface import batch...</p>
                    </div>
                </div>
            `;
            
            // Try to initialize import components directly
            this._initializeImportComponents();
        }
    }

    /**
     * Reinitialize import components after DOM manipulation
     * @private
     * @param {HTMLElement} container - Container element
     */
    _reinitializeImportComponents(container) {
        try {
            // Find the import container within the tab
            const importContainer = container.querySelector('#importTagihanContainer');
            if (!importContainer) return;

            // Check if components are available
            if (typeof ImportTagihanManager !== 'undefined' && 
                typeof ImportUploadInterface !== 'undefined') {
                
                // Initialize components with shared services
                let auditLogger = this.sharedServices?.auditLogger;
                if (!auditLogger && typeof AuditLogger !== 'undefined') {
                    auditLogger = new AuditLogger();
                }

                // Initialize Import Manager with shared services
                const importManager = new ImportTagihanManager(this.sharedServices, auditLogger);
                
                // Initialize Upload Interface
                const uploadInterface = new ImportUploadInterface(importManager);
                uploadInterface.renderAndAttach(importContainer.id);
                
                // Store reference for cleanup
                this.importController.manager = importManager;
                this.importController.uploadInterface = uploadInterface;
            }
        } catch (error) {
            console.error('Failed to reinitialize import components:', error);
        }
    }

    /**
     * Initialize import components directly
     * @private
     */
    _initializeImportComponents() {
        setTimeout(() => {
            try {
                const importContainer = document.getElementById('importTagihanContainer');
                if (!importContainer) return;

                // Check if all required components are available
                const missingComponents = [];
                
                if (typeof ImportTagihanManager === 'undefined') missingComponents.push('ImportTagihanManager');
                if (typeof ImportUploadInterface === 'undefined') missingComponents.push('ImportUploadInterface');
                if (typeof FileParser === 'undefined') missingComponents.push('FileParser');
                if (typeof ValidationEngine === 'undefined') missingComponents.push('ValidationEngine');
                
                if (missingComponents.length > 0) {
                    console.error('Missing import components:', missingComponents);
                    importContainer.innerHTML = `
                        <div class="alert alert-danger">
                            <i class="bi bi-exclamation-triangle-fill me-2"></i>
                            <strong>Error:</strong> Fitur Import Tagihan Pembayaran belum tersedia. 
                            <br>Komponen yang hilang: ${missingComponents.join(', ')}
                            <br>Silakan hubungi administrator.
                        </div>
                    `;
                    return;
                }

                // Initialize components with shared services
                let auditLogger = this.sharedServices?.auditLogger;
                if (!auditLogger && typeof AuditLogger !== 'undefined') {
                    auditLogger = new AuditLogger();
                }

                // Initialize Import Manager with shared services
                const importManager = new ImportTagihanManager(this.sharedServices, auditLogger);
                
                // Initialize Upload Interface
                const uploadInterface = new ImportUploadInterface(importManager);
                uploadInterface.renderAndAttach('importTagihanContainer');
                
                // Store references
                this.importController.manager = importManager;
                this.importController.uploadInterface = uploadInterface;
                
            } catch (error) {
                console.error('Failed to initialize import components:', error);
                const importContainer = document.getElementById('importTagihanContainer');
                if (importContainer) {
                    importContainer.innerHTML = `
                        <div class="alert alert-danger">
                            <i class="bi bi-exclamation-triangle-fill me-2"></i>
                            <strong>Error:</strong> Gagal menginisialisasi komponen import.
                            <br>Error: ${error.message}
                        </div>
                    `;
                }
            }
        }, 100);
    }

    /**
     * Check manual payment unsaved data
     * @private
     * @returns {boolean} Has unsaved data
     */
    _checkManualUnsavedData() {
        try {
            // Check if manual payment form has unsaved data
            const form = document.getElementById('formPembayaran');
            if (!form) return false;

            // Check form fields for data
            const formData = new FormData(form);
            let hasData = false;
            
            for (let [key, value] of formData.entries()) {
                if (value && value.trim() !== '') {
                    hasData = true;
                    break;
                }
            }
            
            // Also check hidden fields for selected anggota
            const selectedAnggotaId = document.getElementById('selectedAnggotaId')?.value;
            const jumlahPembayaran = document.getElementById('jumlahPembayaran')?.value;
            
            if (selectedAnggotaId || (jumlahPembayaran && parseFloat(jumlahPembayaran) > 0)) {
                hasData = true;
            }
            
            // Update tab indicator
            this.setUnsavedData('manual', hasData);
            
            return hasData;
        } catch (error) {
            console.warn('Error checking manual unsaved data:', error);
            return false;
        }
    }

    /**
     * Check import batch unsaved data
     * @private
     * @returns {boolean} Has unsaved data
     */
    _checkImportUnsavedData() {
        try {
            // Check if import batch has unsaved data
            if (this.importController?.manager) {
                const state = this.importController.manager.getState();
                
                // Has unsaved data if there's a current batch that's not completed
                const hasUnsavedData = state.currentBatch && 
                    !['completed', 'cancelled', 'error'].includes(state.currentBatch.status);
                
                // Update tab indicator
                this.setUnsavedData('import', hasUnsavedData);
                
                return hasUnsavedData;
            }
            
            // Check for uploaded files or form data in import tab
            const fileInput = document.getElementById('importFile');
            const hasFile = fileInput && fileInput.files && fileInput.files.length > 0;
            
            // Update tab indicator
            this.setUnsavedData('import', hasFile);
            
            return hasFile;
        } catch (error) {
            console.warn('Error checking import unsaved data:', error);
            return false;
        }
    }

    /**
     * Save manual payment state
     * @private
     */
    _saveManualState() {
        // Save manual payment form state to sessionStorage
        const form = document.getElementById('formPembayaran');
        if (form) {
            const formData = new FormData(form);
            const state = {};
            for (let [key, value] of formData.entries()) {
                state[key] = value;
            }
            sessionStorage.setItem(`manual_state_${this.sessionId}`, JSON.stringify(state));
        }
    }

    /**
     * Restore manual payment state
     * @private
     */
    _restoreManualState() {
        // Restore manual payment form state from sessionStorage
        const savedState = sessionStorage.getItem(`manual_state_${this.sessionId}`);
        if (savedState) {
            try {
                const state = JSON.parse(savedState);
                Object.keys(state).forEach(key => {
                    const element = document.getElementById(key);
                    if (element) {
                        element.value = state[key];
                    }
                });
            } catch (error) {
                console.warn('Failed to restore manual state:', error);
            }
        }
    }

    /**
     * Save import batch state
     * @private
     */
    _saveImportState() {
        // Save import batch state to sessionStorage
        // This would save ImportTagihanManager state
        sessionStorage.setItem(`import_state_${this.sessionId}`, JSON.stringify({}));
    }

    /**
     * Restore import batch state
     * @private
     */
    _restoreImportState() {
        // Restore import batch state from sessionStorage
        const savedState = sessionStorage.getItem(`import_state_${this.sessionId}`);
        if (savedState) {
            try {
                const state = JSON.parse(savedState);
                // Restore ImportTagihanManager state
            } catch (error) {
                console.warn('Failed to restore import state:', error);
            }
        }
    }

    /**
     * Handle keyboard tab switch
     * @private
     * @param {string} tabId - Target tab ID
     * @param {KeyboardEvent} event - Keyboard event
     */
    async _handleKeyboardTabSwitch(tabId, event) {
        try {
            // Show visual feedback
            this._showKeyboardFeedback(`Beralih ke ${this.tabs[tabId]?.name || tabId}...`);
            
            // Perform tab switch
            const success = await this.switchTab(tabId);
            
            if (success) {
                this._showKeyboardFeedback(`✓ ${this.tabs[tabId]?.name || tabId}`, 'success');
            } else {
                this._showKeyboardFeedback('✗ Gagal beralih tab', 'error');
            }
        } catch (error) {
            console.error('Keyboard tab switch failed:', error);
            this._showKeyboardFeedback('✗ Gagal beralih tab', 'error');
        }
    }

    /**
     * Handle keyboard save
     * @private
     */
    async _handleKeyboardSave() {
        try {
            this._showKeyboardFeedback('Menyimpan data...');
            
            await this._saveCurrentTabData();
            this.setUnsavedData(this.activeTab, false);
            
            this._showKeyboardFeedback('✓ Data berhasil disimpan', 'success');
        } catch (error) {
            console.error('Keyboard save failed:', error);
            this._showKeyboardFeedback('✗ Gagal menyimpan data', 'error');
        }
    }

    /**
     * Handle keyboard reset
     * @private
     */
    _handleKeyboardReset() {
        try {
            this._showKeyboardFeedback('Mereset form...');
            
            this._discardCurrentTabData();
            this.setUnsavedData(this.activeTab, false);
            
            this._showKeyboardFeedback('✓ Form direset', 'success');
        } catch (error) {
            console.error('Keyboard reset failed:', error);
            this._showKeyboardFeedback('✗ Gagal mereset form', 'error');
        }
    }

    /**
     * Focus on tab button
     * @private
     * @param {string} tabId - Tab ID to focus
     */
    _focusTabButton(tabId) {
        const tabButton = document.querySelector(`[data-tab="${tabId}"]`);
        if (tabButton) {
            tabButton.focus();
            this._showKeyboardFeedback(`Focus: ${this.tabs[tabId]?.name || tabId}`);
        }
    }

    /**
     * Navigate tabs with arrow keys
     * @private
     * @param {string} direction - 'left' or 'right'
     */
    _navigateTabsWithArrows(direction) {
        const tabIds = Object.keys(this.tabs);
        const currentIndex = tabIds.indexOf(this.activeTab);
        
        let nextIndex;
        if (direction === 'left') {
            nextIndex = currentIndex > 0 ? currentIndex - 1 : tabIds.length - 1;
        } else {
            nextIndex = currentIndex < tabIds.length - 1 ? currentIndex + 1 : 0;
        }
        
        const nextTabId = tabIds[nextIndex];
        this._focusTabButton(nextTabId);
    }

    /**
     * Show keyboard feedback
     * @private
     * @param {string} message - Feedback message
     * @param {string} type - Feedback type ('info', 'success', 'error')
     */
    _showKeyboardFeedback(message, type = 'info') {
        // Remove existing feedback
        const existingFeedback = document.getElementById('keyboard-feedback');
        if (existingFeedback) {
            existingFeedback.remove();
        }

        // Create feedback element
        const feedback = document.createElement('div');
        feedback.id = 'keyboard-feedback';
        feedback.className = `keyboard-feedback keyboard-feedback-${type}`;
        feedback.textContent = message;
        feedback.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            z-index: 10000;
            animation: slideInRight 0.3s ease-out;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        `;

        document.body.appendChild(feedback);

        // Auto-remove after 2 seconds
        setTimeout(() => {
            feedback.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => feedback.remove(), 300);
        }, 2000);
    }

    /**
     * Toggle keyboard shortcuts help
     * @private
     */
    _toggleKeyboardHelp() {
        const help = document.getElementById('keyboard-shortcuts');
        if (help) {
            const isVisible = help.classList.contains('show');
            
            if (isVisible) {
                help.classList.remove('show');
            } else {
                help.classList.add('show');
                // Auto-hide after 5 seconds
                setTimeout(() => {
                    if (help.classList.contains('show')) {
                        help.classList.remove('show');
                    }
                }, 5000);
            }
        }
    }

    /**
     * Log tab switch for audit
     * @private
     * @param {string} fromTab - Previous tab ID
     * @param {string} toTab - Target tab ID
     */
    _logTabSwitch(fromTab, toTab) {
        if (this.sharedServices && typeof this.sharedServices.logAudit === 'function') {
            this.sharedServices.logAudit('TAB_SWITCH', {
                fromTab: fromTab,
                toTab: toTab,
                sessionId: this.sessionId,
                userId: this.currentUser?.id || 'unknown',
                userName: this.currentUser?.nama || 'Unknown User',
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Show error notification
     * @private
     * @param {string} message - Error message
     * @param {Error} error - Error object
     */
    _showErrorNotification(message, error) {
        console.error(message, error);
        
        // Use existing notification system if available
        if (typeof window.showAlert === 'function') {
            window.showAlert(message, 'danger');
        } else {
            alert(message);
        }
    }

    /**
     * Generate unique session ID
     * @private
     * @returns {string} Session ID
     */
    _generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Initialize manual payment controller
     * @private
     */
    async _initializeManualController() {
        try {
            // Initialize manual payment functionality
            this.manualController.currentData = {
                selectedAnggota: null,
                formData: {},
                saldoInfo: {}
            };
            
            console.log('Manual controller initialized');
        } catch (error) {
            console.error('Failed to initialize manual controller:', error);
            throw error;
        }
    }

    /**
     * Initialize import batch controller
     * @private
     */
    async _initializeImportController() {
        try {
            // Initialize ImportTagihanEnhanced if available, fallback to ImportTagihanManager
            if (window.ImportTagihanEnhanced) {
                this.importController.manager = new window.ImportTagihanEnhanced(this.sharedServices);
                
                // Set integration mode and parent controller
                this.importController.manager.setIntegrationMode(true, this);
                
                // Set up callbacks for integration
                this.importController.manager.onBatchComplete((results) => {
                    this.onImportBatchComplete(results);
                });
                
                this.importController.manager.onTransactionUpdate((transaction) => {
                    this.onTransactionUpdate(transaction, 'import');
                });
                
            } else if (ImportTagihanManager) {
                // Fallback to original manager
                this.importController.manager = new ImportTagihanManager(
                    this.sharedServices,
                    this.sharedServices?.auditLogger
                );
            }
            
            if (this.importController.manager) {
                // Set up progress callback
                this.importController.manager.setProgressCallback((progress) => {
                    this._updateImportProgress(progress);
                });
            }
            
            console.log('Import controller initialized');
        } catch (error) {
            console.error('Failed to initialize import controller:', error);
            throw error;
        }
    }

    /**
     * Destroy manual controller
     * @private
     */
    _destroyManualController() {
        if (this.manualController) {
            this.manualController.currentData = {};
            this.manualController.isInitialized = false;
        }
    }

    /**
     * Destroy import controller
     * @private
     */
    _destroyImportController() {
        if (this.importController) {
            if (this.importController.manager) {
                this.importController.manager.reset();
                this.importController.manager = null;
            }
            if (this.importController.uploadInterface) {
                // Clean up upload interface if it has a destroy method
                if (typeof this.importController.uploadInterface.destroy === 'function') {
                    this.importController.uploadInterface.destroy();
                }
                this.importController.uploadInterface = null;
            }
            this.importController.isInitialized = false;
        }
    }

    /**
     * Update tab state tracking
     * @private
     * @param {string} previousTab - Previous tab ID
     * @param {string} currentTab - Current tab ID
     */
    _updateTabStateTracking(previousTab, currentTab) {
        // Update last accessed time
        if (this.tabs[previousTab]) {
            this.tabs[previousTab].lastAccessed = new Date();
        }
        if (this.tabs[currentTab]) {
            this.tabs[currentTab].currentAccessed = new Date();
        }
        
        // Store in session for persistence
        if (typeof sessionStorage !== 'undefined') {
            sessionStorage.setItem(`lastActiveTab_${this.sessionId}`, currentTab);
        }
    }

    /**
     * Manage focus for accessibility
     * @private
     * @param {string} tabId - Target tab ID
     */
    _manageFocus(tabId) {
        try {
            // Focus on the active tab button for accessibility
            const tabButton = document.querySelector(`[data-tab="${tabId}"]`);
            if (tabButton) {
                tabButton.focus();
            }
            
            // Focus on first interactive element in tab content
            setTimeout(() => {
                const tabPane = document.getElementById(`${tabId}-tab-pane`);
                if (tabPane) {
                    const firstInput = tabPane.querySelector('input, select, button, textarea');
                    if (firstInput) {
                        firstInput.focus();
                    }
                }
            }, 100);
        } catch (error) {
            console.warn('Failed to manage focus:', error);
        }
    }

    /**
     * Setup automatic unsaved data detection
     * @private
     */
    _setupUnsavedDataDetection() {
        // Check for unsaved data periodically
        this.unsavedDataCheckInterval = setInterval(() => {
            this._checkAllTabsForUnsavedData();
        }, 2000); // Check every 2 seconds

        // Set up form change listeners when tabs are loaded
        this._setupFormChangeListeners();
    }

    /**
     * Setup form change listeners for unsaved data detection
     * @private
     */
    _setupFormChangeListeners() {
        // Use event delegation for dynamic content
        document.addEventListener('input', (e) => {
            if (e.target.closest('#manual-tab-pane')) {
                // Manual tab form changed
                setTimeout(() => this._checkManualUnsavedData(), 100);
            } else if (e.target.closest('#import-tab-pane')) {
                // Import tab form changed
                setTimeout(() => this._checkImportUnsavedData(), 100);
            }
        });

        document.addEventListener('change', (e) => {
            if (e.target.closest('#manual-tab-pane')) {
                // Manual tab form changed
                setTimeout(() => this._checkManualUnsavedData(), 100);
            } else if (e.target.closest('#import-tab-pane')) {
                // Import tab form changed
                setTimeout(() => this._checkImportUnsavedData(), 100);
            }
        });
    }

    /**
     * Check all tabs for unsaved data
     * @private
     */
    _checkAllTabsForUnsavedData() {
        try {
            // Check manual tab
            if (this.tabs.manual.controller) {
                this.tabs.manual.controller.hasUnsavedData();
            }

            // Check import tab
            if (this.tabs.import.controller) {
                this.tabs.import.controller.hasUnsavedData();
            }
        } catch (error) {
            console.warn('Error checking unsaved data:', error);
        }
    }

    /**
     * Update import progress display
     * @private
     * @param {Object} progress - Progress information
     */
    _updateImportProgress(progress) {
        // Update progress display in import tab
        const progressContainer = document.getElementById('import-progress-container');
        if (progressContainer) {
            progressContainer.innerHTML = `
                <div class="progress mb-2">
                    <div class="progress-bar" role="progressbar" 
                         style="width: ${progress.percentage}%" 
                         aria-valuenow="${progress.current}" 
                         aria-valuemin="0" 
                         aria-valuemax="${progress.total}">
                        ${progress.percentage}%
                    </div>
                </div>
                <small class="text-muted">${progress.status}</small>
            `;
        }
    }

    /**
     * Create placeholder services when SharedPaymentServices is not available
     * @private
     * @returns {Object} Placeholder services
     */
    _createPlaceholderServices() {
        return {
            initialize: async () => {},
            refreshData: async () => {},
            logAudit: (action, details) => {
                console.log('Audit log:', action, details);
            }
        };
    }

    // ===== INTEGRATION CALLBACK METHODS =====

    /**
     * Callback for batch completion to update manual tab
     * Requirements: 3.4, 3.5, 5.5
     * @param {Object} results - Batch processing results
     */
    onImportBatchComplete(results) {
        try {
            console.log('Import batch completed:', results);
            
            // Trigger real-time update
            if (this.updateManager) {
                this.updateManager.triggerImportBatchCompleted(results);
            }
            
            // Update manual tab if it's initialized
            if (this.manualController && this.manualController.isInitialized) {
                // Refresh manual tab data to show updated transaction history
                this._refreshManualTabData();
            }
            
            // Update unified transaction history
            this.refreshUnifiedTransactionHistory();
            
            // Show notification
            this._showSuccessNotification(
                `Import batch selesai: ${results.successCount} berhasil, ${results.failureCount} gagal`
            );
            
            // Log integration event
            if (this.sharedServices) {
                this.sharedServices.logAudit('INTEGRATION_BATCH_COMPLETE', {
                    batchId: results.batchId,
                    successCount: results.successCount,
                    failureCount: results.failureCount,
                    totalAmount: results.summary?.totalAmount || 0,
                    activeTab: this.activeTab
                });
            }
            
        } catch (error) {
            console.error('Error handling batch completion:', error);
        }
    }

    /**
     * Callback for transaction updates to refresh unified history
     * Requirements: 3.4, 3.5, 5.5
     * @param {Object} transaction - Transaction data
     * @param {string} mode - Transaction mode ('manual' or 'import')
     */
    onTransactionUpdate(transaction, mode) {
        try {
            console.log('Transaction updated:', transaction, mode);
            
            // Trigger real-time update
            if (this.updateManager) {
                if (mode === 'manual') {
                    this.updateManager.triggerManualPaymentCompleted(transaction);
                } else {
                    this.updateManager.triggerTransactionUpdated(transaction);
                }
            }
            
            // Update unified transaction history
            this.refreshUnifiedTransactionHistory();
            
            // Update the other tab if it's initialized
            if (mode === 'import' && this.manualController && this.manualController.isInitialized) {
                this._refreshManualTabData();
            } else if (mode === 'manual' && this.importController && this.importController.isInitialized) {
                this._refreshImportTabData();
            }
            
            // Log integration event
            if (this.sharedServices) {
                this.sharedServices.logAudit('INTEGRATION_TRANSACTION_UPDATE', {
                    transactionId: transaction.id,
                    mode: mode,
                    amount: transaction.jumlah,
                    jenis: transaction.jenis,
                    activeTab: this.activeTab
                });
            }
            
        } catch (error) {
            console.error('Error handling transaction update:', error);
        }
    }

    /**
     * Refresh unified transaction history
     * Requirements: 3.4, 3.5, 5.5, 7.1, 7.2, 7.3
     */
    refreshUnifiedTransactionHistory() {
        try {
            if (this.sharedServices) {
                // Get updated transaction history
                const transactions = this.sharedServices.getTransactionHistory();
                
                // Update any displayed transaction lists
                this._updateTransactionDisplays(transactions);
                
                // Update unified history view if it exists
                if (this.unifiedHistoryView) {
                    this.unifiedHistoryView.refreshTransactions();
                }
                
                // Trigger custom event for other components
                const event = new CustomEvent('transactionHistoryUpdated', {
                    detail: { transactions }
                });
                document.dispatchEvent(event);
            }
        } catch (error) {
            console.error('Error refreshing unified transaction history:', error);
        }
    }

    /**
     * Render unified transaction history view
     * Requirements: 7.1, 7.2, 7.3
     * @param {string} containerId - Container element ID
     */
    renderUnifiedTransactionHistory(containerId) {
        try {
            // Initialize unified history view if not already done
            if (!this.unifiedHistoryView && typeof UnifiedTransactionHistoryView !== 'undefined') {
                this.unifiedHistoryView = new UnifiedTransactionHistoryView(this.sharedServices);
            }
            
            if (this.unifiedHistoryView) {
                this.unifiedHistoryView.render(containerId);
            } else {
                console.error('UnifiedTransactionHistoryView not available');
            }
            
        } catch (error) {
            console.error('Error rendering unified transaction history:', error);
        }
    }

    /**
     * Get unified transaction statistics
     * Requirements: 4.1, 4.2
     * @param {Object} filters - Filter options
     * @returns {Object} Transaction statistics
     */
    getUnifiedTransactionStatistics(filters = {}) {
        try {
            if (this.sharedServices) {
                return this.sharedServices.getTransactionStatistics(filters);
            }
            return null;
        } catch (error) {
            console.error('Error getting transaction statistics:', error);
            return null;
        }
    }

    /**
     * Refresh manual tab data
     * @private
     */
    _refreshManualTabData() {
        try {
            // Trigger refresh of manual payment interface
            const event = new CustomEvent('refreshManualPaymentData');
            document.dispatchEvent(event);
        } catch (error) {
            console.error('Error refreshing manual tab data:', error);
        }
    }

    /**
     * Refresh import tab data
     * @private
     */
    _refreshImportTabData() {
        try {
            // Trigger refresh of import interface
            const event = new CustomEvent('refreshImportData');
            document.dispatchEvent(event);
        } catch (error) {
            console.error('Error refreshing import tab data:', error);
        }
    }

    /**
     * Update transaction displays across the interface
     * @private
     * @param {Array} transactions - Updated transaction list
     */
    _updateTransactionDisplays(transactions) {
        try {
            // Update any transaction tables or lists in the current view
            const transactionTables = document.querySelectorAll('.transaction-table, .transaction-list');
            
            transactionTables.forEach(table => {
                // Trigger update event for each table
                const event = new CustomEvent('updateTransactionData', {
                    detail: { transactions }
                });
                table.dispatchEvent(event);
            });
            
        } catch (error) {
            console.error('Error updating transaction displays:', error);
        }
    }

    /**
     * Show success notification
     * @private
     * @param {string} message - Success message
     */
    _showSuccessNotification(message) {
        try {
            // Use existing notification system if available
            if (typeof showNotification === 'function') {
                showNotification(message, 'success');
            } else {
                // Fallback notification
                console.log('Success:', message);
                alert(message);
            }
        } catch (error) {
            console.error('Error showing success notification:', error);
        }
    }

    /**
     * Handle real-time updates
     * Requirements: 5.4, 5.5
     * @private
     * @param {string} updateType - Type of update
     * @param {Object} data - Update data
     */
    _onRealTimeUpdate(updateType, data) {
        try {
            console.log('Real-time update received:', updateType, data);
            
            // Update dashboard if it exists
            if (this.dashboardView) {
                this.dashboardView.refreshDashboard();
            }
            
            // Update tab indicators
            this._updateTabIndicators(updateType, data);
            
            // Show real-time notification
            this._showRealTimeNotification(updateType, data);
            
        } catch (error) {
            console.error('Error handling real-time update:', error);
        }
    }

    /**
     * Update tab indicators for real-time updates
     * Requirements: 5.4, 5.5
     * @private
     * @param {string} updateType - Type of update
     * @param {Object} data - Update data
     */
    _updateTabIndicators(updateType, data) {
        try {
            // Add visual indicator for updates
            const indicators = {
                manual: document.querySelector('[data-tab="manual"] .update-indicator'),
                import: document.querySelector('[data-tab="import"] .update-indicator')
            };
            
            // Create indicator if it doesn't exist
            Object.keys(indicators).forEach(tabId => {
                if (!indicators[tabId]) {
                    const tabButton = document.querySelector(`[data-tab="${tabId}"]`);
                    if (tabButton) {
                        const indicator = document.createElement('span');
                        indicator.className = 'update-indicator';
                        indicator.style.cssText = `
                            display: inline-block;
                            width: 8px;
                            height: 8px;
                            background: #28a745;
                            border-radius: 50%;
                            margin-left: 5px;
                            animation: pulse 1.5s infinite;
                        `;
                        tabButton.appendChild(indicator);
                        indicators[tabId] = indicator;
                    }
                }
            });
            
            // Show indicator based on update type
            if (updateType === 'manual' && indicators.import) {
                indicators.import.style.display = 'inline-block';
                setTimeout(() => {
                    indicators.import.style.display = 'none';
                }, 3000);
            } else if (updateType === 'import' && indicators.manual) {
                indicators.manual.style.display = 'inline-block';
                setTimeout(() => {
                    indicators.manual.style.display = 'none';
                }, 3000);
            }
            
        } catch (error) {
            console.error('Error updating tab indicators:', error);
        }
    }

    /**
     * Show real-time notification
     * Requirements: 5.4, 5.5
     * @private
     * @param {string} updateType - Type of update
     * @param {Object} data - Update data
     */
    _showRealTimeNotification(updateType, data) {
        try {
            let message = '';
            
            switch (updateType) {
                case 'manual':
                    message = `Pembayaran manual selesai: ${this._formatRupiah(data.jumlah || 0)}`;
                    break;
                case 'import':
                    message = `Import batch selesai: ${data.successCount || 0} transaksi berhasil`;
                    break;
                case 'transaction':
                    message = `Transaksi diperbarui: ${this._formatRupiah(data.jumlah || 0)}`;
                    break;
            }
            
            if (message) {
                // Show toast notification
                this._showToastNotification(message, 'info');
            }
            
        } catch (error) {
            console.error('Error showing real-time notification:', error);
        }
    }

    /**
     * Show toast notification
     * @private
     * @param {string} message - Message to show
     * @param {string} type - Notification type
     */
    _showToastNotification(message, type = 'info') {
        try {
            // Create toast element
            const toast = document.createElement('div');
            toast.className = `toast-notification toast-${type}`;
            toast.innerHTML = `
                <div class="toast-content">
                    <i class="bi bi-info-circle"></i>
                    <span>${message}</span>
                </div>
            `;
            toast.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
                color: white;
                padding: 12px 20px;
                border-radius: 8px;
                z-index: 10000;
                animation: slideInRight 0.3s ease-out;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                max-width: 350px;
            `;
            
            document.body.appendChild(toast);
            
            // Auto-remove after 3 seconds
            setTimeout(() => {
                toast.style.animation = 'slideOutRight 0.3s ease-in';
                setTimeout(() => {
                    if (toast.parentNode) {
                        toast.parentNode.removeChild(toast);
                    }
                }, 300);
            }, 3000);
            
        } catch (error) {
            console.error('Error showing toast notification:', error);
        }
    }

    /**
     * Format rupiah currency
     * @private
     */
    _formatRupiah(amount) {
        if (typeof window !== 'undefined' && typeof window.formatRupiah === 'function') {
            return window.formatRupiah(amount);
        }
        
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    }
}

/**
 * Global render function for integration with auth.js
 * Requirements: 1.1, 1.5
 */
function renderPembayaranHutangPiutangIntegrated() {
    try {
        // Create and initialize the integrated controller
        const controller = new PembayaranHutangPiutangIntegrated();
        
        // Initialize and render
        controller.initialize().catch(error => {
            console.error('Failed to initialize integrated payment interface:', error);
            
            // Show error message
            const content = document.getElementById('mainContent');
            if (content) {
                content.innerHTML = `
                    <div class="container-fluid py-4">
                        <div class="alert alert-danger">
                            <h4><i class="bi bi-exclamation-triangle"></i> Error</h4>
                            <p>Gagal memuat interface pembayaran terintegrasi.</p>
                            <p>Error: ${error.message}</p>
                            <button class="btn btn-primary" onclick="location.reload()">
                                <i class="bi bi-arrow-clockwise"></i> Refresh Halaman
                            </button>
                        </div>
                    </div>
                `;
            }
        });
        
    } catch (error) {
        console.error('Failed to create integrated payment controller:', error);
        
        // Show error message
        const content = document.getElementById('mainContent');
        if (content) {
            content.innerHTML = `
                <div class="container-fluid py-4">
                    <div class="alert alert-danger">
                        <h4><i class="bi bi-exclamation-triangle"></i> Error</h4>
                        <p>Gagal membuat controller pembayaran terintegrasi.</p>
                        <p>Error: ${error.message}</p>
                        <button class="btn btn-primary" onclick="location.reload()">
                            <i class="bi bi-arrow-clockwise"></i> Refresh Halaman
                        </button>
                    </div>
                </div>
            `;
        }
    }
}

// Export for both browser and Node.js environments
if (typeof window !== 'undefined') {
    window.PembayaranHutangPiutangIntegrated = PembayaranHutangPiutangIntegrated;
    window.renderPembayaranHutangPiutangIntegrated = renderPembayaranHutangPiutangIntegrated;
}

// Browser compatibility - exports handled via window object

// CommonJS export for compatibility
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PembayaranHutangPiutangIntegrated };
}