/**
 * Logout Validation System
 * Handles logout validation and warnings for active shifts
 * 
 * Feature: perbaikan-menu-tutup-kasir-pos
 * Task 8: Implementasikan logout validation dan warnings
 */

class LogoutValidationSystem {
    constructor() {
        this.warningModalId = 'logoutWarningModal';
        this.autoSavePrefix = 'autoSave_';
        this.maxAutoSaveRecords = 10;
        
        // Bind methods
        this.checkActiveShift = this.checkActiveShift.bind(this);
        this.showLogoutWarning = this.showLogoutWarning.bind(this);
        this.handleLogoutAttempt = this.handleLogoutAttempt.bind(this);
        this.autoSaveImportantData = this.autoSaveImportantData.bind(this);
        
        // Initialize event listeners
        this.initializeEventListeners();
    }

    /**
     * Checks if there's an active shift (buka kas session)
     * @returns {boolean} True if active shift exists
     */
    checkActiveShift() {
        try {
            const bukaKas = sessionStorage.getItem('bukaKas');
            if (!bukaKas) return false;
            
            // Validate the session data
            const bukaKasData = JSON.parse(bukaKas);
            return bukaKasData && 
                   bukaKasData.id && 
                   bukaKasData.kasir && 
                   bukaKasData.waktuBuka;
        } catch (error) {
            console.warn('Invalid buka kas session data:', error);
            return false;
        }
    }

    /**
     * Gets active shift data
     * @returns {Object|null} Active shift data or null
     */
    getActiveShiftData() {
        try {
            const bukaKas = sessionStorage.getItem('bukaKas');
            return bukaKas ? JSON.parse(bukaKas) : null;
        } catch (error) {
            console.warn('Failed to parse buka kas data:', error);
            return null;
        }
    }

    /**
     * Shows logout warning modal for active shift
     * @param {Object} bukaKasData - Active shift data
     * @returns {Promise<string>} User's choice: 'tutup_kasir', 'cancel_logout', or 'force_logout'
     */
    async showLogoutWarning(bukaKasData) {
        return new Promise((resolve) => {
            // Remove existing modal if any
            this.removeExistingModal();
            
            // Create warning modal
            const modal = this.createWarningModal(bukaKasData, resolve);
            document.body.appendChild(modal);
            
            // Show modal
            const bootstrapModal = new bootstrap.Modal(modal);
            bootstrapModal.show();
            
            // Auto-focus on cancel button for safety
            setTimeout(() => {
                const cancelButton = modal.querySelector('.btn-cancel-logout');
                if (cancelButton) cancelButton.focus();
            }, 300);
        });
    }

    /**
     * Creates the logout warning modal
     * @param {Object} bukaKasData - Active shift data
     * @param {Function} resolve - Promise resolve function
     * @returns {HTMLElement} Modal element
     */
    createWarningModal(bukaKasData, resolve) {
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = this.warningModalId;
        modal.setAttribute('tabindex', '-1');
        modal.setAttribute('aria-labelledby', 'logoutWarningLabel');
        modal.setAttribute('aria-hidden', 'true');
        modal.setAttribute('data-bs-backdrop', 'static');
        modal.setAttribute('data-bs-keyboard', 'false');

        const shiftDuration = this.calculateShiftDuration(bukaKasData.waktuBuka);
        
        modal.innerHTML = `
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content border-warning">
                    <div class="modal-header bg-warning text-dark">
                        <h5 class="modal-title" id="logoutWarningLabel">
                            <i class="bi bi-exclamation-triangle me-2"></i>
                            Peringatan: Shift Masih Aktif
                        </h5>
                    </div>
                    <div class="modal-body">
                        <div class="alert alert-warning d-flex align-items-center" role="alert">
                            <i class="bi bi-info-circle-fill me-2"></i>
                            <div>
                                <strong>Anda memiliki shift yang belum ditutup!</strong>
                            </div>
                        </div>
                        
                        <div class="shift-info mb-3">
                            <h6 class="fw-bold mb-2">Informasi Shift Aktif:</h6>
                            <div class="row">
                                <div class="col-sm-4"><strong>Kasir:</strong></div>
                                <div class="col-sm-8">${bukaKasData.kasir}</div>
                            </div>
                            <div class="row">
                                <div class="col-sm-4"><strong>Waktu Buka:</strong></div>
                                <div class="col-sm-8">${this.formatDateTime(bukaKasData.waktuBuka)}</div>
                            </div>
                            <div class="row">
                                <div class="col-sm-4"><strong>Modal Awal:</strong></div>
                                <div class="col-sm-8">Rp ${bukaKasData.modalAwal?.toLocaleString('id-ID') || '0'}</div>
                            </div>
                            <div class="row">
                                <div class="col-sm-4"><strong>Durasi Shift:</strong></div>
                                <div class="col-sm-8">${shiftDuration}</div>
                            </div>
                        </div>

                        <div class="alert alert-info">
                            <i class="bi bi-lightbulb me-2"></i>
                            <strong>Rekomendasi:</strong> Tutup kasir terlebih dahulu untuk memastikan semua transaksi tercatat dengan benar.
                        </div>

                        <div class="warning-options">
                            <p class="mb-2"><strong>Pilihan yang tersedia:</strong></p>
                            <ul class="list-unstyled">
                                <li><i class="bi bi-check-circle text-success me-2"></i><strong>Tutup Kasir:</strong> Lakukan proses tutup kasir sekarang (Direkomendasikan)</li>
                                <li><i class="bi bi-x-circle text-secondary me-2"></i><strong>Batal Logout:</strong> Kembali ke POS dan tutup kasir nanti</li>
                                <li><i class="bi bi-exclamation-triangle text-warning me-2"></i><strong>Paksa Logout:</strong> Logout tanpa tutup kasir (Tidak direkomendasikan)</li>
                            </ul>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-success btn-tutup-kasir" data-action="tutup_kasir">
                            <i class="bi bi-calculator me-1"></i>Tutup Kasir Sekarang
                        </button>
                        <button type="button" class="btn btn-secondary btn-cancel-logout" data-action="cancel_logout">
                            <i class="bi bi-arrow-left me-1"></i>Batal Logout
                        </button>
                        <button type="button" class="btn btn-outline-warning btn-force-logout" data-action="force_logout">
                            <i class="bi bi-box-arrow-right me-1"></i>Paksa Logout
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Add event listeners to buttons
        modal.querySelectorAll('[data-action]').forEach(button => {
            button.addEventListener('click', (e) => {
                const action = e.target.closest('[data-action]').getAttribute('data-action');
                this.handleWarningAction(action, resolve);
            });
        });

        return modal;
    }

    /**
     * Handles user action from warning modal
     * @param {string} action - User's chosen action
     * @param {Function} resolve - Promise resolve function
     */
    async handleWarningAction(action, resolve) {
        const modal = document.getElementById(this.warningModalId);
        const bootstrapModal = bootstrap.Modal.getInstance(modal);
        
        switch (action) {
            case 'tutup_kasir':
                // Close modal and trigger tutup kasir
                bootstrapModal.hide();
                await this.triggerTutupKasir();
                resolve('tutup_kasir');
                break;
                
            case 'cancel_logout':
                // Close modal and cancel logout
                bootstrapModal.hide();
                resolve('cancel_logout');
                break;
                
            case 'force_logout':
                // Show additional confirmation for force logout
                const confirmed = await this.confirmForceLogout();
                if (confirmed) {
                    await this.autoSaveImportantData();
                    bootstrapModal.hide();
                    resolve('force_logout');
                } else {
                    // Stay in modal if not confirmed
                    return;
                }
                break;
        }
    }

    /**
     * Shows confirmation dialog for force logout
     * @returns {Promise<boolean>} True if confirmed
     */
    async confirmForceLogout() {
        return new Promise((resolve) => {
            const confirmModal = document.createElement('div');
            confirmModal.className = 'modal fade';
            confirmModal.id = 'forceLogoutConfirmModal';
            confirmModal.setAttribute('tabindex', '-1');
            confirmModal.setAttribute('data-bs-backdrop', 'static');
            
            confirmModal.innerHTML = `
                <div class="modal-dialog modal-dialog-centered modal-sm">
                    <div class="modal-content border-danger">
                        <div class="modal-header bg-danger text-white">
                            <h6 class="modal-title">
                                <i class="bi bi-exclamation-triangle me-2"></i>
                                Konfirmasi Paksa Logout
                            </h6>
                        </div>
                        <div class="modal-body text-center">
                            <i class="bi bi-exclamation-triangle text-danger" style="font-size: 3rem;"></i>
                            <p class="mt-3 mb-2"><strong>Apakah Anda yakin?</strong></p>
                            <p class="text-muted small">
                                Data shift akan disimpan otomatis, namun Anda harus melakukan tutup kasir manual nanti.
                            </p>
                        </div>
                        <div class="modal-footer justify-content-center">
                            <button type="button" class="btn btn-danger btn-sm" data-confirm="yes">
                                Ya, Paksa Logout
                            </button>
                            <button type="button" class="btn btn-secondary btn-sm" data-confirm="no">
                                Batal
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(confirmModal);
            const bootstrapConfirmModal = new bootstrap.Modal(confirmModal);
            bootstrapConfirmModal.show();
            
            confirmModal.querySelectorAll('[data-confirm]').forEach(button => {
                button.addEventListener('click', (e) => {
                    const confirmed = e.target.getAttribute('data-confirm') === 'yes';
                    bootstrapConfirmModal.hide();
                    confirmModal.remove();
                    resolve(confirmed);
                });
            });
        });
    }

    /**
     * Triggers tutup kasir process
     */
    async triggerTutupKasir() {
        try {
            // Check if tutup kasir function is available
            if (typeof showTutupKasirModal === 'function') {
                showTutupKasirModal();
            } else {
                // Fallback: redirect to tutup kasir page or show alert
                alert('Fitur tutup kasir akan dibuka. Silakan lakukan proses tutup kasir.');
                console.warn('showTutupKasirModal function not available');
            }
        } catch (error) {
            console.error('Failed to trigger tutup kasir:', error);
            alert('Gagal membuka tutup kasir. Silakan coba lagi atau hubungi administrator.');
        }
    }

    /**
     * Auto-saves important data before logout
     * @returns {Object} Save result
     */
    async autoSaveImportantData() {
        try {
            const timestamp = Date.now();
            const saveResults = [];
            
            // Save buka kas data
            const bukaKas = sessionStorage.getItem('bukaKas');
            if (bukaKas) {
                const saveKey = `${this.autoSavePrefix}bukaKas_${timestamp}`;
                localStorage.setItem(saveKey, bukaKas);
                saveResults.push({ type: 'bukaKas', key: saveKey, success: true });
            }
            
            // Save any pending transaction data
            const pendingTransactions = sessionStorage.getItem('pendingTransactions');
            if (pendingTransactions) {
                const saveKey = `${this.autoSavePrefix}pendingTransactions_${timestamp}`;
                localStorage.setItem(saveKey, pendingTransactions);
                saveResults.push({ type: 'pendingTransactions', key: saveKey, success: true });
            }
            
            // Save current cart data if exists
            const cartData = sessionStorage.getItem('cartData');
            if (cartData) {
                const saveKey = `${this.autoSavePrefix}cartData_${timestamp}`;
                localStorage.setItem(saveKey, cartData);
                saveResults.push({ type: 'cartData', key: saveKey, success: true });
            }
            
            // Clean old auto-save records
            this.cleanOldAutoSaveRecords();
            
            return {
                success: true,
                timestamp: timestamp,
                savedItems: saveResults,
                message: `Auto-saved ${saveResults.length} items`
            };
            
        } catch (error) {
            console.error('Auto-save failed:', error);
            return {
                success: false,
                error: error.message,
                savedItems: []
            };
        }
    }

    /**
     * Cleans old auto-save records to prevent storage overflow
     */
    cleanOldAutoSaveRecords() {
        try {
            const autoSaveKeys = [];
            
            // Find all auto-save keys
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(this.autoSavePrefix)) {
                    autoSaveKeys.push(key);
                }
            }
            
            // Sort by timestamp (newest first)
            autoSaveKeys.sort((a, b) => {
                const timestampA = parseInt(a.split('_').pop());
                const timestampB = parseInt(b.split('_').pop());
                return timestampB - timestampA;
            });
            
            // Remove old records (keep only maxAutoSaveRecords)
            if (autoSaveKeys.length > this.maxAutoSaveRecords) {
                const keysToRemove = autoSaveKeys.slice(this.maxAutoSaveRecords);
                keysToRemove.forEach(key => localStorage.removeItem(key));
            }
            
        } catch (error) {
            console.warn('Failed to clean old auto-save records:', error);
        }
    }

    /**
     * Main logout validation handler
     * @returns {Object} Validation result
     */
    async validateLogoutAttempt() {
        const hasActiveShift = this.checkActiveShift();
        
        if (!hasActiveShift) {
            return {
                hasActiveShift: false,
                warningShown: false,
                autoSaved: false,
                preventLogout: false,
                action: 'allow_logout'
            };
        }
        
        const bukaKasData = this.getActiveShiftData();
        
        // Auto-save important data immediately
        const autoSaveResult = await this.autoSaveImportantData();
        
        // Show warning and get user choice
        const userChoice = await this.showLogoutWarning(bukaKasData);
        
        return {
            hasActiveShift: true,
            warningShown: true,
            autoSaved: autoSaveResult.success,
            preventLogout: userChoice !== 'force_logout',
            action: userChoice,
            bukaKasData: bukaKasData,
            autoSaveResult: autoSaveResult
        };
    }

    /**
     * Handles logout attempt with validation
     * @param {Event} event - Logout event (optional)
     * @returns {Promise<boolean>} True if logout should proceed
     */
    async handleLogoutAttempt(event = null) {
        try {
            // Prevent default logout behavior
            if (event) {
                event.preventDefault();
            }
            
            const validationResult = await this.validateLogoutAttempt();
            
            if (!validationResult.preventLogout) {
                // Allow logout to proceed
                return true;
            } else {
                // Logout was cancelled or handled differently
                return false;
            }
            
        } catch (error) {
            console.error('Logout validation failed:', error);
            // On error, allow logout to proceed (fail-safe)
            return true;
        }
    }

    /**
     * Initializes event listeners for logout validation
     */
    initializeEventListeners() {
        // Listen for beforeunload event (browser close/refresh)
        window.addEventListener('beforeunload', (event) => {
            if (this.checkActiveShift()) {
                const message = 'Anda memiliki shift yang belum ditutup. Yakin ingin meninggalkan halaman?';
                event.returnValue = message;
                return message;
            }
        });
        
        // Listen for logout button clicks (if they have specific class/id)
        document.addEventListener('click', async (event) => {
            const logoutButton = event.target.closest('.logout-btn, [data-action="logout"]');
            if (logoutButton) {
                event.preventDefault();
                const shouldProceed = await this.handleLogoutAttempt();
                
                if (shouldProceed) {
                    // Proceed with actual logout
                    this.performActualLogout();
                }
            }
        });
    }

    /**
     * Performs the actual logout process
     */
    performActualLogout() {
        try {
            // Clear session data
            sessionStorage.clear();
            
            // Redirect to login page or reload
            if (window.location.pathname.includes('login')) {
                window.location.reload();
            } else {
                window.location.href = 'login.html';
            }
        } catch (error) {
            console.error('Logout failed:', error);
            alert('Logout gagal. Silakan coba lagi.');
        }
    }

    /**
     * Removes existing warning modal if present
     */
    removeExistingModal() {
        const existingModal = document.getElementById(this.warningModalId);
        if (existingModal) {
            const bootstrapModal = bootstrap.Modal.getInstance(existingModal);
            if (bootstrapModal) {
                bootstrapModal.hide();
            }
            existingModal.remove();
        }
    }

    /**
     * Calculates shift duration
     * @param {string} waktuBuka - Start time ISO string
     * @returns {string} Formatted duration
     */
    calculateShiftDuration(waktuBuka) {
        try {
            const startTime = new Date(waktuBuka);
            const currentTime = new Date();
            const durationMs = currentTime - startTime;
            
            const hours = Math.floor(durationMs / (1000 * 60 * 60));
            const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
            
            return `${hours} jam ${minutes} menit`;
        } catch (error) {
            return 'Tidak dapat dihitung';
        }
    }

    /**
     * Formats date time for display
     * @param {string} isoString - ISO date string
     * @returns {string} Formatted date time
     */
    formatDateTime(isoString) {
        try {
            const date = new Date(isoString);
            return date.toLocaleString('id-ID', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        } catch (error) {
            return isoString;
        }
    }

    /**
     * Gets auto-saved data for recovery
     * @returns {Array} List of auto-saved items
     */
    getAutoSavedData() {
        try {
            const autoSavedItems = [];
            
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(this.autoSavePrefix)) {
                    const data = localStorage.getItem(key);
                    const timestamp = parseInt(key.split('_').pop());
                    const type = key.replace(this.autoSavePrefix, '').split('_')[0];
                    
                    autoSavedItems.push({
                        key: key,
                        type: type,
                        timestamp: timestamp,
                        date: new Date(timestamp),
                        data: data
                    });
                }
            }
            
            // Sort by timestamp (newest first)
            return autoSavedItems.sort((a, b) => b.timestamp - a.timestamp);
            
        } catch (error) {
            console.error('Failed to get auto-saved data:', error);
            return [];
        }
    }

    /**
     * Recovers auto-saved data
     * @param {string} key - Auto-save key to recover
     * @returns {Object} Recovery result
     */
    recoverAutoSavedData(key) {
        try {
            const data = localStorage.getItem(key);
            if (!data) {
                return { success: false, error: 'Data not found' };
            }
            
            const type = key.replace(this.autoSavePrefix, '').split('_')[0];
            
            // Restore to session storage
            sessionStorage.setItem(type, data);
            
            // Remove the auto-save record
            localStorage.removeItem(key);
            
            return {
                success: true,
                type: type,
                message: `Recovered ${type} data successfully`
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
}

// Create global instance
window.logoutValidationSystem = new LogoutValidationSystem();

// Export for module usage
export default LogoutValidationSystem;