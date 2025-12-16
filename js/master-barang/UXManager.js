/**
 * Master Barang Komprehensif - UX Manager
 * User experience improvements including loading states, progress indicators, and accessibility
 */

export class UXManager {
    constructor() {
        this.loadingStates = new Map();
        this.progressTrackers = new Map();
        this.toastQueue = [];
        this.isProcessingToasts = false;
        
        // Accessibility settings
        this.a11ySettings = {
            announceChanges: true,
            highContrast: false,
            reducedMotion: false,
            screenReaderOptimized: false
        };
        
        // Initialize UX components
        this.initializeComponents();
        this.setupAccessibility();
        this.setupKeyboardNavigation();
    }

    /**
     * Initialize UX components
     */
    initializeComponents() {
        this.createLoadingOverlay();
        this.createProgressModal();
        this.createToastContainer();
        this.createAccessibilityControls();
        this.setupResponsiveHelpers();
    }

    /**
     * Create loading overlay
     */
    createLoadingOverlay() {
        if (document.getElementById('ux-loading-overlay')) return;
        
        const overlay = document.createElement('div');
        overlay.id = 'ux-loading-overlay';
        overlay.className = 'ux-loading-overlay';
        overlay.setAttribute('role', 'status');
        overlay.setAttribute('aria-live', 'polite');
        overlay.style.display = 'none';
        
        overlay.innerHTML = `
            <div class="ux-loading-content">
                <div class="ux-spinner">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                </div>
                <div class="ux-loading-text" id="ux-loading-text">Memproses...</div>
                <div class="ux-loading-progress" id="ux-loading-progress" style="display: none;">
                    <div class="progress mt-3">
                        <div class="progress-bar" role="progressbar" style="width: 0%"></div>
                    </div>
                    <div class="progress-text small text-muted mt-1">0%</div>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        // Add CSS if not exists
        this.addLoadingStyles();
    }

    /**
     * Create progress modal for long operations
     */
    createProgressModal() {
        if (document.getElementById('ux-progress-modal')) return;
        
        const modal = document.createElement('div');
        modal.id = 'ux-progress-modal';
        modal.className = 'modal fade';
        modal.setAttribute('tabindex', '-1');
        modal.setAttribute('data-bs-backdrop', 'static');
        modal.setAttribute('data-bs-keyboard', 'false');
        
        modal.innerHTML = `
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="ux-progress-title">Memproses...</h5>
                    </div>
                    <div class="modal-body">
                        <div class="mb-3">
                            <div id="ux-progress-message" class="text-center mb-3">Mohon tunggu...</div>
                            <div class="progress">
                                <div id="ux-progress-bar" class="progress-bar progress-bar-striped progress-bar-animated" 
                                     role="progressbar" style="width: 0%" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">
                                </div>
                            </div>
                            <div id="ux-progress-details" class="small text-muted mt-2 text-center">
                                0 / 0 selesai
                            </div>
                        </div>
                        <div id="ux-progress-log" class="small text-muted" style="max-height: 200px; overflow-y: auto; display: none;">
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" id="ux-progress-cancel" class="btn btn-secondary" style="display: none;">
                            Batalkan
                        </button>
                        <button type="button" id="ux-progress-close" class="btn btn-primary" data-bs-dismiss="modal" style="display: none;">
                            Tutup
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    /**
     * Create toast container
     */
    createToastContainer() {
        if (document.getElementById('ux-toast-container')) return;
        
        const container = document.createElement('div');
        container.id = 'ux-toast-container';
        container.className = 'toast-container position-fixed top-0 end-0 p-3';
        container.style.zIndex = '1055';
        
        document.body.appendChild(container);
    }

    /**
     * Create accessibility controls
     */
    createAccessibilityControls() {
        if (document.getElementById('ux-accessibility-controls')) return;
        
        const controls = document.createElement('div');
        controls.id = 'ux-accessibility-controls';
        controls.className = 'ux-accessibility-controls';
        controls.setAttribute('role', 'region');
        controls.setAttribute('aria-label', 'Kontrol Aksesibilitas');
        
        controls.innerHTML = `
            <button type="button" class="btn btn-sm btn-outline-secondary" id="ux-toggle-a11y" 
                    title="Toggle Accessibility Controls" aria-label="Toggle Accessibility Controls">
                <i class="fas fa-universal-access"></i>
            </button>
            <div class="ux-a11y-panel" id="ux-a11y-panel" style="display: none;">
                <div class="card">
                    <div class="card-header">
                        <h6 class="mb-0">Pengaturan Aksesibilitas</h6>
                    </div>
                    <div class="card-body">
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" id="ux-high-contrast">
                            <label class="form-check-label" for="ux-high-contrast">
                                Kontras Tinggi
                            </label>
                        </div>
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" id="ux-reduced-motion">
                            <label class="form-check-label" for="ux-reduced-motion">
                                Kurangi Animasi
                            </label>
                        </div>
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" id="ux-screen-reader">
                            <label class="form-check-label" for="ux-screen-reader">
                                Optimasi Screen Reader
                            </label>
                        </div>
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" id="ux-announce-changes">
                            <label class="form-check-label" for="ux-announce-changes">
                                Umumkan Perubahan
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Position controls
        controls.style.position = 'fixed';
        controls.style.bottom = '20px';
        controls.style.right = '20px';
        controls.style.zIndex = '1050';
        
        document.body.appendChild(controls);
        
        // Setup event listeners
        this.setupAccessibilityControls();
    }

    /**
     * Show loading state
     * @param {boolean} show - Whether to show loading
     * @param {string} message - Loading message
     * @param {Object} options - Loading options
     */
    showLoading(show, message = 'Memproses...', options = {}) {
        const overlay = document.getElementById('ux-loading-overlay');
        const textElement = document.getElementById('ux-loading-text');
        const progressElement = document.getElementById('ux-loading-progress');
        
        if (!overlay) return;
        
        if (show) {
            textElement.textContent = message;
            
            if (options.showProgress) {
                progressElement.style.display = 'block';
                this.updateLoadingProgress(0);
            } else {
                progressElement.style.display = 'none';
            }
            
            overlay.style.display = 'flex';
            overlay.setAttribute('aria-label', message);
            
            // Announce to screen readers
            if (this.a11ySettings.announceChanges) {
                this.announceToScreenReader(message);
            }
            
            // Prevent body scroll
            document.body.style.overflow = 'hidden';
            
        } else {
            overlay.style.display = 'none';
            document.body.style.overflow = '';
            
            if (this.a11ySettings.announceChanges) {
                this.announceToScreenReader('Selesai memproses');
            }
        }
    }

    /**
     * Update loading progress
     * @param {number} percent - Progress percentage (0-100)
     * @param {string} message - Progress message
     */
    updateLoadingProgress(percent, message = null) {
        const progressBar = document.querySelector('#ux-loading-progress .progress-bar');
        const progressText = document.querySelector('#ux-loading-progress .progress-text');
        const textElement = document.getElementById('ux-loading-text');
        
        if (progressBar) {
            progressBar.style.width = `${percent}%`;
            progressBar.setAttribute('aria-valuenow', percent);
        }
        
        if (progressText) {
            progressText.textContent = `${Math.round(percent)}%`;
        }
        
        if (message && textElement) {
            textElement.textContent = message;
        }
    }

    /**
     * Show progress modal for long operations
     * @param {string} title - Modal title
     * @param {string} message - Initial message
     * @param {Object} options - Modal options
     */
    showProgressModal(title, message = 'Memproses...', options = {}) {
        const modal = document.getElementById('ux-progress-modal');
        const titleElement = document.getElementById('ux-progress-title');
        const messageElement = document.getElementById('ux-progress-message');
        const progressBar = document.getElementById('ux-progress-bar');
        const detailsElement = document.getElementById('ux-progress-details');
        const cancelBtn = document.getElementById('ux-progress-cancel');
        const closeBtn = document.getElementById('ux-progress-close');
        
        if (!modal) return;
        
        // Set content
        titleElement.textContent = title;
        messageElement.textContent = message;
        progressBar.style.width = '0%';
        progressBar.setAttribute('aria-valuenow', '0');
        detailsElement.textContent = '0 / 0 selesai';
        
        // Configure buttons
        if (options.cancellable && options.onCancel) {
            cancelBtn.style.display = 'inline-block';
            cancelBtn.onclick = options.onCancel;
        } else {
            cancelBtn.style.display = 'none';
        }
        
        closeBtn.style.display = 'none';
        
        // Show modal
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
        
        return bsModal;
    }

    /**
     * Update progress modal
     * @param {number} current - Current progress
     * @param {number} total - Total items
     * @param {string} message - Progress message
     * @param {Object} options - Update options
     */
    updateProgressModal(current, total, message = null, options = {}) {
        const messageElement = document.getElementById('ux-progress-message');
        const progressBar = document.getElementById('ux-progress-bar');
        const detailsElement = document.getElementById('ux-progress-details');
        const logElement = document.getElementById('ux-progress-log');
        
        const percent = total > 0 ? (current / total) * 100 : 0;
        
        if (progressBar) {
            progressBar.style.width = `${percent}%`;
            progressBar.setAttribute('aria-valuenow', percent);
        }
        
        if (detailsElement) {
            detailsElement.textContent = `${current} / ${total} selesai`;
        }
        
        if (message && messageElement) {
            messageElement.textContent = message;
        }
        
        // Add to log if specified
        if (options.logMessage) {
            if (logElement) {
                logElement.style.display = 'block';
                const logEntry = document.createElement('div');
                logEntry.textContent = `${new Date().toLocaleTimeString()}: ${options.logMessage}`;
                logElement.appendChild(logEntry);
                logElement.scrollTop = logElement.scrollHeight;
            }
        }
        
        // Complete progress
        if (current >= total && options.onComplete) {
            setTimeout(() => {
                const closeBtn = document.getElementById('ux-progress-close');
                const cancelBtn = document.getElementById('ux-progress-cancel');
                
                if (closeBtn) closeBtn.style.display = 'inline-block';
                if (cancelBtn) cancelBtn.style.display = 'none';
                
                if (options.onComplete) {
                    options.onComplete();
                }
            }, 500);
        }
    }

    /**
     * Hide progress modal
     */
    hideProgressModal() {
        const modal = document.getElementById('ux-progress-modal');
        if (modal) {
            const bsModal = bootstrap.Modal.getInstance(modal);
            if (bsModal) {
                bsModal.hide();
            }
        }
    }

    /**
     * Show toast notification
     * @param {string} type - Toast type (success, error, warning, info)
     * @param {string} message - Toast message
     * @param {Object} options - Toast options
     */
    showToast(type, message, options = {}) {
        const {
            title = null,
            duration = 5000,
            dismissible = true,
            icon = null,
            actions = []
        } = options;
        
        const toast = this.createToast(type, message, { title, duration, dismissible, icon, actions });
        this.queueToast(toast);
    }

    /**
     * Create toast element
     * @param {string} type - Toast type
     * @param {string} message - Toast message
     * @param {Object} options - Toast options
     * @returns {HTMLElement} Toast element
     */
    createToast(type, message, options = {}) {
        const {
            title = null,
            duration = 5000,
            dismissible = true,
            icon = null,
            actions = []
        } = options;
        
        const toastId = 'toast-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        const toast = document.createElement('div');
        toast.id = toastId;
        toast.className = `toast align-items-center text-bg-${type} border-0`;
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'assertive');
        toast.setAttribute('aria-atomic', 'true');
        
        let iconHtml = '';
        if (icon) {
            iconHtml = `<i class="${icon} me-2"></i>`;
        } else {
            // Default icons based on type
            const defaultIcons = {
                success: 'fas fa-check-circle',
                error: 'fas fa-exclamation-circle',
                warning: 'fas fa-exclamation-triangle',
                info: 'fas fa-info-circle'
            };
            if (defaultIcons[type]) {
                iconHtml = `<i class="${defaultIcons[type]} me-2"></i>`;
            }
        }
        
        let headerHtml = '';
        if (title) {
            headerHtml = `
                <div class="toast-header">
                    ${iconHtml}
                    <strong class="me-auto">${title}</strong>
                    <small>${new Date().toLocaleTimeString()}</small>
                    ${dismissible ? '<button type="button" class="btn-close" data-bs-dismiss="toast"></button>' : ''}
                </div>
            `;
        }
        
        let actionsHtml = '';
        if (actions.length > 0) {
            actionsHtml = '<div class="mt-2">';
            actions.forEach((action, index) => {
                actionsHtml += `<button type="button" class="btn btn-sm btn-outline-light me-2" onclick="window.uxManager.executeToastAction('${toastId}', ${index})">${action.text}</button>`;
            });
            actionsHtml += '</div>';
        }
        
        const bodyContent = title ? message : `${iconHtml}${message}`;
        const dismissButton = !title && dismissible ? 
            '<button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>' : '';
        
        toast.innerHTML = `
            ${headerHtml}
            <div class="d-flex">
                <div class="toast-body">
                    ${bodyContent}
                    ${actionsHtml}
                </div>
                ${dismissButton}
            </div>
        `;
        
        // Store actions for later execution
        if (actions.length > 0) {
            this.toastActions = this.toastActions || {};
            this.toastActions[toastId] = actions;
        }
        
        // Auto-hide after duration
        if (duration > 0) {
            setTimeout(() => {
                const bsToast = bootstrap.Toast.getInstance(toast);
                if (bsToast) {
                    bsToast.hide();
                }
            }, duration);
        }
        
        return toast;
    }

    /**
     * Queue toast for display
     * @param {HTMLElement} toast - Toast element
     */
    queueToast(toast) {
        this.toastQueue.push(toast);
        if (!this.isProcessingToasts) {
            this.processToastQueue();
        }
    }

    /**
     * Process toast queue
     */
    async processToastQueue() {
        this.isProcessingToasts = true;
        
        while (this.toastQueue.length > 0) {
            const toast = this.toastQueue.shift();
            const container = document.getElementById('ux-toast-container');
            
            if (container) {
                container.appendChild(toast);
                const bsToast = new bootstrap.Toast(toast);
                bsToast.show();
                
                // Wait a bit before showing next toast
                await new Promise(resolve => setTimeout(resolve, 300));
            }
        }
        
        this.isProcessingToasts = false;
    }

    /**
     * Execute toast action
     * @param {string} toastId - Toast ID
     * @param {number} actionIndex - Action index
     */
    executeToastAction(toastId, actionIndex) {
        if (this.toastActions && this.toastActions[toastId] && this.toastActions[toastId][actionIndex]) {
            const action = this.toastActions[toastId][actionIndex];
            if (typeof action.action === 'function') {
                action.action();
            }
        }
    }

    /**
     * Setup accessibility features
     */
    setupAccessibility() {
        // Load saved settings
        this.loadAccessibilitySettings();
        
        // Apply initial settings
        this.applyAccessibilitySettings();
        
        // Setup keyboard shortcuts
        this.setupKeyboardShortcuts();
        
        // Setup focus management
        this.setupFocusManagement();
        
        // Setup ARIA live regions
        this.setupAriaLiveRegions();
    }

    /**
     * Setup accessibility controls
     */
    setupAccessibilityControls() {
        const toggleBtn = document.getElementById('ux-toggle-a11y');
        const panel = document.getElementById('ux-a11y-panel');
        
        if (toggleBtn && panel) {
            toggleBtn.addEventListener('click', () => {
                const isVisible = panel.style.display !== 'none';
                panel.style.display = isVisible ? 'none' : 'block';
                toggleBtn.setAttribute('aria-expanded', !isVisible);
            });
        }
        
        // Setup control event listeners
        const controls = {
            'ux-high-contrast': 'highContrast',
            'ux-reduced-motion': 'reducedMotion',
            'ux-screen-reader': 'screenReaderOptimized',
            'ux-announce-changes': 'announceChanges'
        };
        
        Object.entries(controls).forEach(([id, setting]) => {
            const control = document.getElementById(id);
            if (control) {
                control.checked = this.a11ySettings[setting];
                control.addEventListener('change', (e) => {
                    this.a11ySettings[setting] = e.target.checked;
                    this.applyAccessibilitySettings();
                    this.saveAccessibilitySettings();
                });
            }
        });
    }

    /**
     * Setup keyboard navigation
     */
    setupKeyboardNavigation() {
        // Skip links for keyboard navigation
        this.createSkipLinks();
        
        // Enhanced focus indicators
        this.enhanceFocusIndicators();
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Alt + A: Toggle accessibility panel
            if (e.altKey && e.key === 'a') {
                e.preventDefault();
                const toggleBtn = document.getElementById('ux-toggle-a11y');
                if (toggleBtn) toggleBtn.click();
            }
            
            // Escape: Close modals and overlays
            if (e.key === 'Escape') {
                this.handleEscapeKey();
            }
        });
    }

    /**
     * Create skip links for keyboard navigation
     */
    createSkipLinks() {
        if (document.getElementById('ux-skip-links')) return;
        
        const skipLinks = document.createElement('div');
        skipLinks.id = 'ux-skip-links';
        skipLinks.className = 'ux-skip-links';
        
        skipLinks.innerHTML = `
            <a href="#main-content" class="ux-skip-link">Skip to main content</a>
            <a href="#navigation" class="ux-skip-link">Skip to navigation</a>
            <a href="#search" class="ux-skip-link">Skip to search</a>
        `;
        
        document.body.insertBefore(skipLinks, document.body.firstChild);
        
        // Add CSS for skip links
        this.addSkipLinkStyles();
    }

    /**
     * Enhance focus indicators
     */
    enhanceFocusIndicators() {
        const style = document.createElement('style');
        style.textContent = `
            .ux-enhanced-focus *:focus {
                outline: 2px solid #0066cc !important;
                outline-offset: 2px !important;
            }
            
            .ux-enhanced-focus button:focus,
            .ux-enhanced-focus input:focus,
            .ux-enhanced-focus select:focus,
            .ux-enhanced-focus textarea:focus {
                box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.3) !important;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Setup ARIA live regions
     */
    setupAriaLiveRegions() {
        // Create live region for announcements
        if (!document.getElementById('ux-live-region')) {
            const liveRegion = document.createElement('div');
            liveRegion.id = 'ux-live-region';
            liveRegion.setAttribute('aria-live', 'polite');
            liveRegion.setAttribute('aria-atomic', 'true');
            liveRegion.className = 'visually-hidden';
            document.body.appendChild(liveRegion);
        }
        
        // Create assertive live region for urgent announcements
        if (!document.getElementById('ux-live-region-assertive')) {
            const assertiveLiveRegion = document.createElement('div');
            assertiveLiveRegion.id = 'ux-live-region-assertive';
            assertiveLiveRegion.setAttribute('aria-live', 'assertive');
            assertiveLiveRegion.setAttribute('aria-atomic', 'true');
            assertiveLiveRegion.className = 'visually-hidden';
            document.body.appendChild(assertiveLiveRegion);
        }
    }

    /**
     * Announce message to screen readers
     * @param {string} message - Message to announce
     * @param {boolean} assertive - Whether to use assertive live region
     */
    announceToScreenReader(message, assertive = false) {
        if (!this.a11ySettings.announceChanges) return;
        
        const liveRegionId = assertive ? 'ux-live-region-assertive' : 'ux-live-region';
        const liveRegion = document.getElementById(liveRegionId);
        
        if (liveRegion) {
            liveRegion.textContent = message;
            
            // Clear after announcement
            setTimeout(() => {
                liveRegion.textContent = '';
            }, 1000);
        }
    }

    /**
     * Apply accessibility settings
     */
    applyAccessibilitySettings() {
        const body = document.body;
        
        // High contrast
        if (this.a11ySettings.highContrast) {
            body.classList.add('ux-high-contrast');
        } else {
            body.classList.remove('ux-high-contrast');
        }
        
        // Reduced motion
        if (this.a11ySettings.reducedMotion) {
            body.classList.add('ux-reduced-motion');
        } else {
            body.classList.remove('ux-reduced-motion');
        }
        
        // Screen reader optimization
        if (this.a11ySettings.screenReaderOptimized) {
            body.classList.add('ux-screen-reader-optimized');
        } else {
            body.classList.remove('ux-screen-reader-optimized');
        }
        
        // Enhanced focus
        if (this.a11ySettings.screenReaderOptimized) {
            body.classList.add('ux-enhanced-focus');
        } else {
            body.classList.remove('ux-enhanced-focus');
        }
    }

    /**
     * Load accessibility settings from localStorage
     */
    loadAccessibilitySettings() {
        try {
            const saved = localStorage.getItem('ux-accessibility-settings');
            if (saved) {
                const settings = JSON.parse(saved);
                this.a11ySettings = { ...this.a11ySettings, ...settings };
            }
        } catch (error) {
            console.warn('Failed to load accessibility settings:', error);
        }
    }

    /**
     * Save accessibility settings to localStorage
     */
    saveAccessibilitySettings() {
        try {
            localStorage.setItem('ux-accessibility-settings', JSON.stringify(this.a11ySettings));
        } catch (error) {
            console.warn('Failed to save accessibility settings:', error);
        }
    }

    /**
     * Setup responsive helpers
     */
    setupResponsiveHelpers() {
        // Add viewport meta tag if not exists
        if (!document.querySelector('meta[name="viewport"]')) {
            const viewport = document.createElement('meta');
            viewport.name = 'viewport';
            viewport.content = 'width=device-width, initial-scale=1.0';
            document.head.appendChild(viewport);
        }
        
        // Add responsive classes based on screen size
        this.updateResponsiveClasses();
        window.addEventListener('resize', () => this.updateResponsiveClasses());
    }

    /**
     * Update responsive classes
     */
    updateResponsiveClasses() {
        const body = document.body;
        const width = window.innerWidth;
        
        // Remove existing responsive classes
        body.classList.remove('ux-mobile', 'ux-tablet', 'ux-desktop');
        
        // Add appropriate class
        if (width < 768) {
            body.classList.add('ux-mobile');
        } else if (width < 1024) {
            body.classList.add('ux-tablet');
        } else {
            body.classList.add('ux-desktop');
        }
    }

    /**
     * Handle escape key press
     */
    handleEscapeKey() {
        // Close loading overlay
        const loadingOverlay = document.getElementById('ux-loading-overlay');
        if (loadingOverlay && loadingOverlay.style.display !== 'none') {
            this.showLoading(false);
            return;
        }
        
        // Close accessibility panel
        const a11yPanel = document.getElementById('ux-a11y-panel');
        if (a11yPanel && a11yPanel.style.display !== 'none') {
            a11yPanel.style.display = 'none';
            const toggleBtn = document.getElementById('ux-toggle-a11y');
            if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'false');
            return;
        }
    }

    /**
     * Add loading styles
     */
    addLoadingStyles() {
        if (document.getElementById('ux-loading-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'ux-loading-styles';
        style.textContent = `
            .ux-loading-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 9999;
                backdrop-filter: blur(2px);
            }
            
            .ux-loading-content {
                text-align: center;
                color: white;
                background: rgba(0, 0, 0, 0.8);
                padding: 2rem;
                border-radius: 0.5rem;
                min-width: 200px;
            }
            
            .ux-loading-text {
                margin-top: 1rem;
                font-size: 1.1rem;
            }
            
            .ux-accessibility-controls {
                position: fixed;
                bottom: 20px;
                right: 20px;
                z-index: 1050;
            }
            
            .ux-a11y-panel {
                position: absolute;
                bottom: 100%;
                right: 0;
                margin-bottom: 10px;
                width: 250px;
            }
            
            .ux-skip-links {
                position: absolute;
                top: -100px;
                left: 0;
                z-index: 10000;
            }
            
            .ux-skip-link {
                position: absolute;
                top: -100px;
                left: 0;
                background: #000;
                color: #fff;
                padding: 8px 16px;
                text-decoration: none;
                border-radius: 0 0 4px 0;
            }
            
            .ux-skip-link:focus {
                top: 0;
            }
            
            /* High contrast mode */
            .ux-high-contrast {
                filter: contrast(150%) brightness(120%);
            }
            
            .ux-high-contrast .btn {
                border: 2px solid !important;
            }
            
            /* Reduced motion */
            .ux-reduced-motion * {
                animation-duration: 0.01ms !important;
                animation-iteration-count: 1 !important;
                transition-duration: 0.01ms !important;
            }
            
            /* Screen reader optimizations */
            .ux-screen-reader-optimized .visually-hidden {
                position: absolute !important;
                width: 1px !important;
                height: 1px !important;
                padding: 0 !important;
                margin: -1px !important;
                overflow: hidden !important;
                clip: rect(0, 0, 0, 0) !important;
                white-space: nowrap !important;
                border: 0 !important;
            }
        `;
        
        document.head.appendChild(style);
    }

    /**
     * Add skip link styles
     */
    addSkipLinkStyles() {
        if (document.getElementById('ux-skip-link-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'ux-skip-link-styles';
        style.textContent = `
            .ux-skip-links {
                position: absolute;
                top: -100px;
                left: 0;
                z-index: 10000;
            }
            
            .ux-skip-link {
                position: absolute;
                top: -100px;
                left: 0;
                background: #000;
                color: #fff;
                padding: 8px 16px;
                text-decoration: none;
                border-radius: 0 0 4px 0;
                font-weight: bold;
            }
            
            .ux-skip-link:focus {
                top: 0;
                color: #fff;
                text-decoration: none;
            }
        `;
        
        document.head.appendChild(style);
    }

    /**
     * Get UX statistics
     * @returns {Object} UX statistics
     */
    getUXStats() {
        return {
            loadingStates: this.loadingStates.size,
            progressTrackers: this.progressTrackers.size,
            toastQueue: this.toastQueue.length,
            accessibilitySettings: { ...this.a11ySettings }
        };
    }
    /**
     * Setup keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Escape key handling
            if (e.key === 'Escape') {
                this.handleEscapeKey();
            }
            
            // Alt + A for accessibility panel
            if (e.altKey && e.key === 'a') {
                e.preventDefault();
                const toggleBtn = document.getElementById('ux-toggle-a11y');
                if (toggleBtn) toggleBtn.click();
            }
            
            // Alt + L for loading test (development only)
            if (e.altKey && e.key === 'l' && window.location.hostname === 'localhost') {
                e.preventDefault();
                this.showLoading(true, 'Testing loading state...');
                setTimeout(() => this.showLoading(false), 2000);
            }
        });
    }

    /**
     * Setup focus management
     */
    setupFocusManagement() {
        // Track focus for better accessibility
        let lastFocusedElement = null;
        
        document.addEventListener('focusin', (e) => {
            lastFocusedElement = e.target;
        });
        
        // Store last focused element for modal restoration
        this.lastFocusedElement = lastFocusedElement;
        
        // Enhanced focus indicators
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                document.body.classList.add('ux-keyboard-navigation');
            }
        });
        
        document.addEventListener('mousedown', () => {
            document.body.classList.remove('ux-keyboard-navigation');
        });
    }

    /**
     * Setup ARIA live regions
     */
    setupAriaLiveRegions() {
        // Create polite live region if not exists
        if (!document.getElementById('ux-live-region-polite')) {
            const politeRegion = document.createElement('div');
            politeRegion.id = 'ux-live-region-polite';
            politeRegion.setAttribute('aria-live', 'polite');
            politeRegion.setAttribute('aria-atomic', 'true');
            politeRegion.style.cssText = 'position: absolute; left: -10000px; width: 1px; height: 1px; overflow: hidden;';
            document.body.appendChild(politeRegion);
        }
        
        // Create assertive live region if not exists
        if (!document.getElementById('ux-live-region-assertive')) {
            const assertiveRegion = document.createElement('div');
            assertiveRegion.id = 'ux-live-region-assertive';
            assertiveRegion.setAttribute('aria-live', 'assertive');
            assertiveRegion.setAttribute('aria-atomic', 'true');
            assertiveRegion.style.cssText = 'position: absolute; left: -10000px; width: 1px; height: 1px; overflow: hidden;';
            document.body.appendChild(assertiveRegion);
        }
    }
}

// Make UXManager available globally
if (typeof window !== 'undefined') {
    window.UXManager = UXManager;
}