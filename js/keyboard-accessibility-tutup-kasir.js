// Keyboard Shortcuts and Accessibility Module for Tutup Kasir POS
// Task 5: Implementasikan keyboard shortcuts dan accessibility

/**
 * Enhanced Keyboard Shortcuts and Accessibility Manager
 * Features:
 * - F10 keyboard shortcut for tutup kasir
 * - Tab navigation within modal
 * - ARIA labels and accessibility features
 * - Keyboard shortcuts documentation
 * - Focus management
 * - Screen reader support
 */

class TutupKasirAccessibilityManager {
    constructor() {
        this.shortcuts = new Map();
        this.focusableElements = [];
        this.currentFocusIndex = 0;
        this.isModalOpen = false;
        this.originalFocus = null;
        
        this.init();
    }
    
    init() {
        this.setupKeyboardShortcuts();
        this.setupAccessibilityFeatures();
        this.setupFocusManagement();
        this.setupAriaLabels();
        this.documentShortcuts();
    }
    
    /**
     * Setup keyboard shortcuts for tutup kasir functionality
     */
    setupKeyboardShortcuts() {
        // Register shortcuts
        this.shortcuts.set('F10', {
            description: 'Buka modal tutup kasir',
            handler: () => this.handleTutupKasirShortcut(),
            global: true
        });
        
        this.shortcuts.set('Escape', {
            description: 'Tutup modal tutup kasir',
            handler: () => this.handleEscapeShortcut(),
            modalOnly: true
        });
        
        this.shortcuts.set('Enter', {
            description: 'Proses tutup kasir',
            handler: (event) => this.handleEnterShortcut(event),
            modalOnly: true
        });
        
        this.shortcuts.set('Tab', {
            description: 'Navigasi antar field',
            handler: (event) => this.handleTabNavigation(event),
            modalOnly: true
        });
        
        this.shortcuts.set('F1', {
            description: 'Tampilkan bantuan keyboard shortcuts',
            handler: () => this.showKeyboardHelp(),
            global: true
        });
        
        // Alternative shortcuts
        this.shortcuts.set('Ctrl+Shift+T', {
            description: 'Buka modal tutup kasir (alternatif)',
            handler: () => this.handleTutupKasirShortcut(),
            global: true
        });
        
        this.shortcuts.set('Alt+T', {
            description: 'Buka modal tutup kasir (alternatif)',
            handler: () => this.handleTutupKasirShortcut(),
            global: true
        });
        
        // Setup global keyboard event listener
        document.addEventListener('keydown', (event) => {
            this.handleKeyboardEvent(event);
        });
        
        // Setup modal-specific keyboard event listener
        document.addEventListener('keydown', (event) => {
            if (this.isModalOpen) {
                this.handleModalKeyboardEvent(event);
            }
        });
    }
    
    /**
     * Handle keyboard events
     */
    handleKeyboardEvent(event) {
        const key = this.getKeyString(event);
        const shortcut = this.shortcuts.get(key);
        
        if (shortcut && (shortcut.global || (shortcut.modalOnly && this.isModalOpen))) {
            // Check if tutup kasir is available
            if (key === 'F10' || key === 'Ctrl+Shift+T' || key === 'Alt+T') {
                if (!this.isTutupKasirAvailable()) {
                    this.showUnavailableMessage();
                    return;
                }
            }
            
            event.preventDefault();
            shortcut.handler(event);
        }
    }
    
    /**
     * Handle modal-specific keyboard events
     */
    handleModalKeyboardEvent(event) {
        if (!this.isModalOpen) return;
        
        const key = event.key;
        
        // Handle Tab navigation
        if (key === 'Tab') {
            event.preventDefault();
            this.handleTabNavigation(event);
        }
        
        // Handle Enter key
        if (key === 'Enter') {
            const activeElement = document.activeElement;
            if (activeElement && activeElement.id === 'prosesTutupKasirBtn') {
                event.preventDefault();
                this.handleEnterShortcut(event);
            }
        }
        
        // Handle Escape key
        if (key === 'Escape') {
            event.preventDefault();
            this.handleEscapeShortcut();
        }
    }
    
    /**
     * Get key string representation
     */
    getKeyString(event) {
        let key = event.key;
        
        if (event.ctrlKey && event.shiftKey) {
            key = `Ctrl+Shift+${key}`;
        } else if (event.ctrlKey) {
            key = `Ctrl+${key}`;
        } else if (event.altKey) {
            key = `Alt+${key}`;
        } else if (event.shiftKey && key.length === 1) {
            key = `Shift+${key}`;
        }
        
        return key;
    }
    
    /**
     * Handle F10 tutup kasir shortcut
     */
    handleTutupKasirShortcut() {
        if (this.isTutupKasirAvailable()) {
            // Announce to screen readers
            this.announceToScreenReader('Membuka modal tutup kasir');
            
            // Call the existing showTutupKasirModal function
            if (typeof showTutupKasirModal === 'function') {
                showTutupKasirModal();
            } else {
                console.error('showTutupKasirModal function not found');
            }
        } else {
            this.showUnavailableMessage();
        }
    }
    
    /**
     * Handle Escape key to close modal
     */
    handleEscapeShortcut() {
        if (this.isModalOpen) {
            this.announceToScreenReader('Menutup modal tutup kasir');
            this.closeModal();
        }
    }
    
    /**
     * Handle Enter key to process tutup kasir
     */
    handleEnterShortcut(event) {
        const activeElement = document.activeElement;
        
        // Only process if focused on the process button
        if (activeElement && activeElement.id === 'prosesTutupKasirBtn') {
            this.announceToScreenReader('Memproses tutup kasir');
            
            // Call the existing prosesTutupKasir function
            if (typeof prosesTutupKasir === 'function') {
                prosesTutupKasir();
            } else {
                console.error('prosesTutupKasir function not found');
            }
        }
    }
    
    /**
     * Handle Tab navigation within modal
     */
    handleTabNavigation(event) {
        if (!this.isModalOpen) return;
        
        const focusableElements = this.getFocusableElements();
        
        if (focusableElements.length === 0) return;
        
        const currentIndex = focusableElements.indexOf(document.activeElement);
        let nextIndex;
        
        if (event.shiftKey) {
            // Shift+Tab - go backwards
            nextIndex = currentIndex <= 0 ? focusableElements.length - 1 : currentIndex - 1;
        } else {
            // Tab - go forwards
            nextIndex = currentIndex >= focusableElements.length - 1 ? 0 : currentIndex + 1;
        }
        
        focusableElements[nextIndex].focus();
        
        // Announce current field to screen readers
        this.announceCurrentField(focusableElements[nextIndex]);
    }
    
    /**
     * Get focusable elements within the modal
     */
    getFocusableElements() {
        const modal = document.getElementById('tutupKasirModal');
        if (!modal) return [];
        
        const focusableSelectors = [
            'input:not([disabled]):not([type="hidden"])',
            'textarea:not([disabled])',
            'select:not([disabled])',
            'button:not([disabled])',
            'a[href]',
            '[tabindex]:not([tabindex="-1"])'
        ];
        
        return Array.from(modal.querySelectorAll(focusableSelectors.join(', ')))
            .filter(element => {
                return element.offsetWidth > 0 && 
                       element.offsetHeight > 0 && 
                       !element.hidden;
            });
    }
    
    /**
     * Setup accessibility features
     */
    setupAccessibilityFeatures() {
        // Add role and aria-label to main POS container
        const posContainer = document.querySelector('.pos-container');
        if (posContainer) {
            posContainer.setAttribute('role', 'application');
            posContainer.setAttribute('aria-label', 'Point of Sales System');
        }
        
        // Setup live region for announcements
        this.createLiveRegion();
        
        // Setup keyboard shortcuts indicator
        this.createKeyboardIndicator();
    }
    
    /**
     * Create ARIA live region for screen reader announcements
     */
    createLiveRegion() {
        let liveRegion = document.getElementById('tutupKasirLiveRegion');
        
        if (!liveRegion) {
            liveRegion = document.createElement('div');
            liveRegion.id = 'tutupKasirLiveRegion';
            liveRegion.setAttribute('aria-live', 'polite');
            liveRegion.setAttribute('aria-atomic', 'true');
            liveRegion.style.position = 'absolute';
            liveRegion.style.left = '-10000px';
            liveRegion.style.width = '1px';
            liveRegion.style.height = '1px';
            liveRegion.style.overflow = 'hidden';
            
            document.body.appendChild(liveRegion);
        }
    }
    
    /**
     * Create keyboard shortcuts indicator
     */
    createKeyboardIndicator() {
        const indicator = document.createElement('div');
        indicator.id = 'keyboardShortcutsIndicator';
        indicator.className = 'keyboard-shortcuts-indicator';
        indicator.innerHTML = `
            <small class="text-muted d-none d-md-inline">
                <i class="bi bi-keyboard me-1"></i>
                F10: Tutup Kasir | F1: Bantuan | ESC: Keluar
            </small>
        `;
        
        // Add to POS header if it exists
        const posHeader = document.querySelector('.pos-header');
        if (posHeader) {
            posHeader.appendChild(indicator);
        }
    }
    
    /**
     * Setup ARIA labels for tutup kasir elements
     */
    setupAriaLabels() {
        // This will be called when modal is opened
        this.setupModalAriaLabels();
    }
    
    /**
     * Setup ARIA labels for modal elements
     */
    setupModalAriaLabels() {
        setTimeout(() => {
            const modal = document.getElementById('tutupKasirModal');
            if (!modal) return;
            
            // Modal itself
            modal.setAttribute('role', 'dialog');
            modal.setAttribute('aria-labelledby', 'tutupKasirModalLabel');
            modal.setAttribute('aria-describedby', 'tutupKasirModalDescription');
            
            // Modal title
            const modalTitle = modal.querySelector('.modal-title');
            if (modalTitle) {
                modalTitle.id = 'tutupKasirModalLabel';
            }
            
            // Add description
            let description = modal.querySelector('#tutupKasirModalDescription');
            if (!description) {
                description = document.createElement('div');
                description.id = 'tutupKasirModalDescription';
                description.className = 'sr-only';
                description.textContent = 'Modal untuk proses tutup kasir. Gunakan Tab untuk navigasi, Enter untuk proses, Escape untuk keluar.';
                modal.appendChild(description);
            }
            
            // Form fields
            const kasAktualInput = document.getElementById('kasAktual');
            if (kasAktualInput) {
                kasAktualInput.setAttribute('aria-label', 'Jumlah kas aktual yang dihitung');
                kasAktualInput.setAttribute('aria-describedby', 'kasAktualHelp');
                kasAktualInput.setAttribute('aria-required', 'true');
                
                // Add help text
                let helpText = document.getElementById('kasAktualHelp');
                if (!helpText) {
                    helpText = document.createElement('div');
                    helpText.id = 'kasAktualHelp';
                    helpText.className = 'form-text';
                    helpText.textContent = 'Masukkan jumlah uang kas yang ada di kasir saat ini';
                    kasAktualInput.parentNode.appendChild(helpText);
                }
            }
            
            const keteranganInput = document.getElementById('keteranganSelisih');
            if (keteranganInput) {
                keteranganInput.setAttribute('aria-label', 'Keterangan selisih kas');
                keteranganInput.setAttribute('aria-describedby', 'keteranganHelp');
                
                let helpText = document.getElementById('keteranganHelp');
                if (!helpText) {
                    helpText = document.createElement('div');
                    helpText.id = 'keteranganHelp';
                    helpText.className = 'form-text';
                    helpText.textContent = 'Berikan keterangan jika terdapat selisih kas';
                    keteranganInput.parentNode.appendChild(helpText);
                }
            }
            
            // Process button
            const processBtn = document.getElementById('prosesTutupKasirBtn');
            if (processBtn) {
                processBtn.setAttribute('aria-label', 'Proses tutup kasir');
                processBtn.setAttribute('aria-describedby', 'processBtnHelp');
                
                let helpText = document.getElementById('processBtnHelp');
                if (!helpText) {
                    helpText = document.createElement('div');
                    helpText.id = 'processBtnHelp';
                    helpText.className = 'sr-only';
                    helpText.textContent = 'Tekan Enter atau klik untuk memproses tutup kasir';
                    processBtn.parentNode.appendChild(helpText);
                }
            }
            
            // Close button
            const closeBtn = modal.querySelector('.btn-close');
            if (closeBtn) {
                closeBtn.setAttribute('aria-label', 'Tutup modal tutup kasir');
            }
        }, 100);
    }
    
    /**
     * Setup focus management
     */
    setupFocusManagement() {
        // Listen for modal events
        document.addEventListener('shown.bs.modal', (event) => {
            if (event.target.id === 'tutupKasirModal') {
                this.onModalOpened();
            }
        });
        
        document.addEventListener('hidden.bs.modal', (event) => {
            if (event.target.id === 'tutupKasirModal') {
                this.onModalClosed();
            }
        });
    }
    
    /**
     * Handle modal opened event
     */
    onModalOpened() {
        this.isModalOpen = true;
        this.originalFocus = document.activeElement;
        
        // Setup ARIA labels
        this.setupModalAriaLabels();
        
        // Focus on first input field
        setTimeout(() => {
            const kasAktualInput = document.getElementById('kasAktual');
            if (kasAktualInput) {
                kasAktualInput.focus();
                kasAktualInput.select();
            }
        }, 150);
        
        // Announce modal opening
        this.announceToScreenReader('Modal tutup kasir dibuka. Gunakan Tab untuk navigasi antar field.');
    }
    
    /**
     * Handle modal closed event
     */
    onModalClosed() {
        this.isModalOpen = false;
        
        // Restore focus to original element
        if (this.originalFocus) {
            this.originalFocus.focus();
            this.originalFocus = null;
        }
        
        // Announce modal closing
        this.announceToScreenReader('Modal tutup kasir ditutup');
    }
    
    /**
     * Close modal programmatically
     */
    closeModal() {
        const modal = document.getElementById('tutupKasirModal');
        if (modal) {
            const bsModal = bootstrap.Modal.getInstance(modal);
            if (bsModal) {
                bsModal.hide();
            }
        }
    }
    
    /**
     * Check if tutup kasir is available
     */
    isTutupKasirAvailable() {
        const bukaKas = sessionStorage.getItem('bukaKas');
        if (!bukaKas) return false;
        
        try {
            const data = JSON.parse(bukaKas);
            return data.kasir && data.modalAwal && data.waktuBuka;
        } catch (e) {
            return false;
        }
    }
    
    /**
     * Show unavailable message
     */
    showUnavailableMessage() {
        this.announceToScreenReader('Tutup kasir tidak tersedia. Silakan buka kas terlebih dahulu.');
        
        // Show visual alert
        if (typeof showAlert === 'function') {
            showAlert('Belum ada kas yang dibuka. Silakan buka kas terlebih dahulu.', 'warning');
        }
    }
    
    /**
     * Announce to screen readers
     */
    announceToScreenReader(message) {
        const liveRegion = document.getElementById('tutupKasirLiveRegion');
        if (liveRegion) {
            liveRegion.textContent = message;
            
            // Clear after announcement
            setTimeout(() => {
                liveRegion.textContent = '';
            }, 1000);
        }
    }
    
    /**
     * Announce current field to screen readers
     */
    announceCurrentField(element) {
        if (!element) return;
        
        let announcement = '';
        const label = element.getAttribute('aria-label') || 
                     element.getAttribute('placeholder') || 
                     element.getAttribute('title') || 
                     element.textContent;
        
        if (label) {
            announcement = `Fokus pada: ${label}`;
        }
        
        if (element.tagName === 'INPUT') {
            const type = element.type;
            if (type === 'number') {
                announcement += '. Field angka';
            } else if (type === 'text') {
                announcement += '. Field teks';
            }
            
            if (element.hasAttribute('aria-required')) {
                announcement += '. Wajib diisi';
            }
        } else if (element.tagName === 'BUTTON') {
            announcement += '. Tombol';
        }
        
        if (announcement) {
            this.announceToScreenReader(announcement);
        }
    }
    
    /**
     * Show keyboard help
     */
    showKeyboardHelp() {
        const helpContent = this.generateKeyboardHelpContent();
        
        // Create help modal
        const helpModal = document.createElement('div');
        helpModal.className = 'modal fade';
        helpModal.id = 'keyboardHelpModal';
        helpModal.setAttribute('tabindex', '-1');
        helpModal.setAttribute('aria-labelledby', 'keyboardHelpModalLabel');
        helpModal.setAttribute('aria-hidden', 'true');
        
        helpModal.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header bg-info text-white">
                        <h5 class="modal-title" id="keyboardHelpModalLabel">
                            <i class="bi bi-keyboard me-2"></i>Bantuan Keyboard Shortcuts
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Tutup"></button>
                    </div>
                    <div class="modal-body">
                        ${helpContent}
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Tutup</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(helpModal);
        
        const bsModal = new bootstrap.Modal(helpModal);
        bsModal.show();
        
        // Remove modal after hiding
        helpModal.addEventListener('hidden.bs.modal', () => {
            helpModal.remove();
        });
    }
    
    /**
     * Generate keyboard help content
     */
    generateKeyboardHelpContent() {
        return `
            <div class="row">
                <div class="col-md-6">
                    <h6><i class="bi bi-calculator me-2"></i>Tutup Kasir</h6>
                    <table class="table table-sm">
                        <tbody>
                            <tr>
                                <td><kbd>F10</kbd></td>
                                <td>Buka modal tutup kasir</td>
                            </tr>
                            <tr>
                                <td><kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>T</kbd></td>
                                <td>Buka modal tutup kasir (alternatif)</td>
                            </tr>
                            <tr>
                                <td><kbd>Alt</kbd> + <kbd>T</kbd></td>
                                <td>Buka modal tutup kasir (alternatif)</td>
                            </tr>
                            <tr>
                                <td><kbd>Esc</kbd></td>
                                <td>Tutup modal tutup kasir</td>
                            </tr>
                            <tr>
                                <td><kbd>Enter</kbd></td>
                                <td>Proses tutup kasir (saat fokus pada tombol proses)</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div class="col-md-6">
                    <h6><i class="bi bi-arrow-right-square me-2"></i>Navigasi</h6>
                    <table class="table table-sm">
                        <tbody>
                            <tr>
                                <td><kbd>Tab</kbd></td>
                                <td>Pindah ke field berikutnya</td>
                            </tr>
                            <tr>
                                <td><kbd>Shift</kbd> + <kbd>Tab</kbd></td>
                                <td>Pindah ke field sebelumnya</td>
                            </tr>
                            <tr>
                                <td><kbd>F1</kbd></td>
                                <td>Tampilkan bantuan ini</td>
                            </tr>
                        </tbody>
                    </table>
                    
                    <h6><i class="bi bi-info-circle me-2"></i>Tips Aksesibilitas</h6>
                    <ul class="small">
                        <li>Gunakan screen reader untuk pengalaman yang lebih baik</li>
                        <li>Semua field memiliki label yang jelas</li>
                        <li>Navigasi keyboard tersedia di seluruh modal</li>
                        <li>Pengumuman suara untuk perubahan status</li>
                    </ul>
                </div>
            </div>
        `;
    }
    
    /**
     * Document keyboard shortcuts for users
     */
    documentShortcuts() {
        // Add shortcuts to help text or documentation
        console.log('Tutup Kasir Keyboard Shortcuts initialized:');
        console.log('- F10: Open tutup kasir modal');
        console.log('- Ctrl+Shift+T: Open tutup kasir modal (alternative)');
        console.log('- Alt+T: Open tutup kasir modal (alternative)');
        console.log('- Esc: Close modal');
        console.log('- Tab/Shift+Tab: Navigate fields');
        console.log('- Enter: Process tutup kasir (when focused on process button)');
        console.log('- F1: Show keyboard help');
    }
}

// Initialize the accessibility manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for other scripts to load
    setTimeout(() => {
        window.tutupKasirAccessibilityManager = new TutupKasirAccessibilityManager();
    }, 1000);
});

// Also initialize when POS is rendered
document.addEventListener('posRendered', () => {
    setTimeout(() => {
        if (!window.tutupKasirAccessibilityManager) {
            window.tutupKasirAccessibilityManager = new TutupKasirAccessibilityManager();
        }
    }, 500);
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TutupKasirAccessibilityManager;
}