// Anggota Keluar Wizard Controller
// Manages the 5-step wizard process for member exit
// Requirements: 7.1, 8.1, 8.2, 10.1

/**
 * AnggotaKeluarWizard Class
 * Main controller for the 5-step wizard process
 * 
 * Steps:
 * 1. Validasi Hutang/Piutang
 * 2. Pencairan Simpanan
 * 3. Print Dokumen
 * 4. Update Status
 * 5. Verifikasi Accounting
 */
class AnggotaKeluarWizard {
    /**
     * Constructor
     * @param {string} anggotaId - ID of the anggota to process
     */
    constructor(anggotaId) {
        if (!anggotaId || typeof anggotaId !== 'string') {
            throw new Error('Invalid anggotaId provided to wizard');
        }
        
        this.anggotaId = anggotaId;
        this.currentStep = 1;
        this.maxStep = 5;
        this.completedSteps = [];
        
        // Wizard data storage for each step
        this.wizardData = {
            validationResult: null,      // Step 1
            pencairanData: null,          // Step 2
            documentRefs: null,           // Step 3
            updateResult: null,           // Step 4
            verificationResult: null      // Step 5
        };
        
        // Snapshot for rollback
        this.snapshot = null;
        
        // Wizard metadata
        this.createdAt = new Date().toISOString();
        this.completedAt = null;
        this.status = 'in_progress'; // 'in_progress', 'completed', 'cancelled', 'error'
        
        // Log wizard start
        this._logAuditEvent('START_WIZARD_ANGGOTA_KELUAR', {
            anggotaId: this.anggotaId,
            timestamp: this.createdAt
        });
    }
    
    // ==================== NAVIGATION METHODS ====================
    
    /**
     * Navigate to next step
     * @returns {object} Result with success status
     */
    nextStep() {
        try {
            // Check if can navigate next
            if (!this.canNavigateNext()) {
                return {
                    success: false,
                    error: 'Cannot navigate to next step. Current step not completed or validation failed.'
                };
            }
            
            // Mark current step as completed if not already
            if (!this.completedSteps.includes(this.currentStep)) {
                this.completedSteps.push(this.currentStep);
            }
            
            // Move to next step
            this.currentStep++;
            
            // Log step change
            this._logAuditEvent('WIZARD_STEP_CHANGED', {
                fromStep: this.currentStep - 1,
                toStep: this.currentStep
            });
            
            return {
                success: true,
                currentStep: this.currentStep
            };
            
        } catch (error) {
            console.error('Error in nextStep:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    /**
     * Navigate to previous step
     * @returns {object} Result with success status
     */
    previousStep() {
        try {
            // Check if can navigate previous
            if (!this.canNavigatePrevious()) {
                return {
                    success: false,
                    error: 'Cannot navigate to previous step. Already at first step.'
                };
            }
            
            // Move to previous step
            this.currentStep--;
            
            // Log step change
            this._logAuditEvent('WIZARD_STEP_CHANGED', {
                fromStep: this.currentStep + 1,
                toStep: this.currentStep
            });
            
            return {
                success: true,
                currentStep: this.currentStep
            };
            
        } catch (error) {
            console.error('Error in previousStep:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    /**
     * Navigate to specific step
     * @param {number} stepNumber - Step number to navigate to (1-5)
     * @returns {object} Result with success status
     */
    goToStep(stepNumber) {
        try {
            // Validate step number
            if (typeof stepNumber !== 'number' || stepNumber < 1 || stepNumber > this.maxStep) {
                return {
                    success: false,
                    error: `Invalid step number. Must be between 1 and ${this.maxStep}.`
                };
            }
            
            // Can only go to completed steps or next step
            if (stepNumber > this.currentStep + 1) {
                return {
                    success: false,
                    error: 'Cannot skip steps. Complete current step first.'
                };
            }
            
            // Can only go forward if current step is completed
            if (stepNumber > this.currentStep && !this.completedSteps.includes(this.currentStep)) {
                return {
                    success: false,
                    error: 'Complete current step before proceeding.'
                };
            }
            
            const oldStep = this.currentStep;
            this.currentStep = stepNumber;
            
            // Log step change
            this._logAuditEvent('WIZARD_STEP_CHANGED', {
                fromStep: oldStep,
                toStep: this.currentStep
            });
            
            return {
                success: true,
                currentStep: this.currentStep
            };
            
        } catch (error) {
            console.error('Error in goToStep:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    /**
     * Check if can navigate to next step
     * @returns {boolean} True if can navigate next
     */
    canNavigateNext() {
        // Cannot go beyond max step
        if (this.currentStep >= this.maxStep) {
            return false;
        }
        
        // Current step must be completed
        return this.completedSteps.includes(this.currentStep);
    }
    
    /**
     * Check if can navigate to previous step
     * @returns {boolean} True if can navigate previous
     */
    canNavigatePrevious() {
        // Cannot go before first step
        return this.currentStep > 1;
    }
    
    // ==================== STEP EXECUTION METHODS ====================
    
    /**
     * Execute Step 1: Validasi Hutang/Piutang
     * @returns {object} Validation result
     */
    async executeStep1Validation() {
        try {
            // Validate that we're on step 1
            if (this.currentStep !== 1) {
                return {
                    success: false,
                    error: 'Not on step 1. Navigate to step 1 first.'
                };
            }
            
            // Call validation function from anggotaKeluarManager
            const validationResult = validateHutangPiutang(this.anggotaId);
            
            // Store result
            this.wizardData.validationResult = validationResult;
            
            // If validation passed, mark step as completed
            if (validationResult.valid) {
                if (!this.completedSteps.includes(1)) {
                    this.completedSteps.push(1);
                }
                
                // Log step completion
                this._logAuditEvent('COMPLETE_STEP_1_VALIDATION', {
                    result: 'passed',
                    anggotaId: this.anggotaId
                });
            } else {
                // Log validation failure
                this._logAuditEvent('STEP_1_VALIDATION_FAILED', {
                    error: validationResult.error,
                    anggotaId: this.anggotaId
                });
            }
            
            return validationResult;
            
        } catch (error) {
            console.error('Error in executeStep1Validation:', error);
            this._logAuditEvent('STEP_1_ERROR', {
                error: error.message,
                anggotaId: this.anggotaId
            });
            return {
                success: false,
                valid: false,
                error: {
                    code: 'SYSTEM_ERROR',
                    message: error.message
                }
            };
        }
    }
    
    /**
     * Execute Step 2: Pencairan Simpanan
     * @param {string} metodePembayaran - Payment method (Kas/Transfer Bank)
     * @param {string} tanggalPembayaran - Payment date (YYYY-MM-DD)
     * @param {string} keterangan - Optional notes
     * @returns {object} Pencairan result
     */
    async executeStep2Pencairan(metodePembayaran, tanggalPembayaran, keterangan = '') {
        try {
            // Validate that we're on step 2
            if (this.currentStep !== 2) {
                return {
                    success: false,
                    error: 'Not on step 2. Navigate to step 2 first.'
                };
            }
            
            // Validate that step 1 is completed
            if (!this.completedSteps.includes(1)) {
                return {
                    success: false,
                    error: 'Step 1 must be completed first.'
                };
            }
            
            // Call pencairan function from anggotaKeluarManager
            const pencairanResult = prosesPencairanSimpanan(
                this.anggotaId,
                metodePembayaran,
                tanggalPembayaran,
                keterangan
            );
            
            // Store result
            this.wizardData.pencairanData = pencairanResult;
            
            // If pencairan successful, mark step as completed
            if (pencairanResult.success) {
                if (!this.completedSteps.includes(2)) {
                    this.completedSteps.push(2);
                }
                
                // Log step completion
                this._logAuditEvent('COMPLETE_STEP_2_PENCAIRAN', {
                    pengembalianId: pencairanResult.data.pengembalianId,
                    totalPencairan: pencairanResult.data.totalPencairan,
                    metodePembayaran: metodePembayaran,
                    anggotaId: this.anggotaId
                });
            } else {
                // Log pencairan failure
                this._logAuditEvent('STEP_2_PENCAIRAN_FAILED', {
                    error: pencairanResult.error,
                    anggotaId: this.anggotaId
                });
            }
            
            return pencairanResult;
            
        } catch (error) {
            console.error('Error in executeStep2Pencairan:', error);
            this._logAuditEvent('STEP_2_ERROR', {
                error: error.message,
                anggotaId: this.anggotaId
            });
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    /**
     * Execute Step 3: Print Dokumen
     * @returns {object} Document generation result
     */
    async executeStep3Print() {
        try {
            // Validate that we're on step 3
            if (this.currentStep !== 3) {
                return {
                    success: false,
                    error: 'Not on step 3. Navigate to step 3 first.'
                };
            }
            
            // Validate that step 2 is completed
            if (!this.completedSteps.includes(2)) {
                return {
                    success: false,
                    error: 'Step 2 must be completed first.'
                };
            }
            
            // Get pengembalianId from step 2
            const pengembalianId = this.wizardData.pencairanData?.data?.pengembalianId;
            if (!pengembalianId) {
                return {
                    success: false,
                    error: 'Pengembalian ID not found. Complete step 2 first.'
                };
            }
            
            // Call document generation function from anggotaKeluarUI
            const documentResult = generateDokumenAnggotaKeluar(this.anggotaId, pengembalianId);
            
            // Store result
            this.wizardData.documentRefs = documentResult;
            
            // Mark step as completed
            if (!this.completedSteps.includes(3)) {
                this.completedSteps.push(3);
            }
            
            // Log step completion
            this._logAuditEvent('COMPLETE_STEP_3_PRINT', {
                documentRefs: documentResult,
                anggotaId: this.anggotaId
            });
            
            return {
                success: true,
                data: documentResult
            };
            
        } catch (error) {
            console.error('Error in executeStep3Print:', error);
            this._logAuditEvent('STEP_3_ERROR', {
                error: error.message,
                anggotaId: this.anggotaId
            });
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    /**
     * Execute Step 4: Update Status
     * @param {string} tanggalKeluar - Exit date (YYYY-MM-DD)
     * @param {string} alasanKeluar - Reason for exit
     * @returns {object} Update result
     */
    async executeStep4Update(tanggalKeluar, alasanKeluar) {
        try {
            // Validate that we're on step 4
            if (this.currentStep !== 4) {
                return {
                    success: false,
                    error: 'Not on step 4. Navigate to step 4 first.'
                };
            }
            
            // Validate that step 3 is completed
            if (!this.completedSteps.includes(3)) {
                return {
                    success: false,
                    error: 'Step 3 must be completed first.'
                };
            }
            
            // Get required data from previous steps
            const pengembalianId = this.wizardData.pencairanData?.data?.pengembalianId;
            const documentRefs = this.wizardData.documentRefs;
            
            if (!pengembalianId) {
                return {
                    success: false,
                    error: 'Pengembalian ID not found. Complete step 2 first.'
                };
            }
            
            // Call status update function from anggotaKeluarManager
            const updateResult = updateStatusAnggotaKeluar(
                this.anggotaId,
                tanggalKeluar,
                alasanKeluar,
                pengembalianId,
                documentRefs
            );
            
            // Store result
            this.wizardData.updateResult = updateResult;
            
            // If update successful, mark step as completed
            if (updateResult.success) {
                if (!this.completedSteps.includes(4)) {
                    this.completedSteps.push(4);
                }
                
                // Log step completion
                this._logAuditEvent('COMPLETE_STEP_4_UPDATE', {
                    tanggalKeluar: tanggalKeluar,
                    alasanKeluar: alasanKeluar,
                    anggotaId: this.anggotaId
                });
            } else {
                // Log update failure
                this._logAuditEvent('STEP_4_UPDATE_FAILED', {
                    error: updateResult.error,
                    anggotaId: this.anggotaId
                });
            }
            
            return updateResult;
            
        } catch (error) {
            console.error('Error in executeStep4Update:', error);
            this._logAuditEvent('STEP_4_ERROR', {
                error: error.message,
                anggotaId: this.anggotaId
            });
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    /**
     * Execute Step 5: Verifikasi Accounting
     * @returns {object} Verification result
     */
    async executeStep5Verification() {
        try {
            // Validate that we're on step 5
            if (this.currentStep !== 5) {
                return {
                    success: false,
                    error: 'Not on step 5. Navigate to step 5 first.'
                };
            }
            
            // Validate that step 4 is completed
            if (!this.completedSteps.includes(4)) {
                return {
                    success: false,
                    error: 'Step 4 must be completed first.'
                };
            }
            
            // Get pengembalianId from step 2
            const pengembalianId = this.wizardData.pencairanData?.data?.pengembalianId;
            if (!pengembalianId) {
                return {
                    success: false,
                    error: 'Pengembalian ID not found. Complete step 2 first.'
                };
            }
            
            // Call verification function from anggotaKeluarManager
            const verificationResult = verifikasiAccounting(this.anggotaId, pengembalianId);
            
            // Store result
            this.wizardData.verificationResult = verificationResult;
            
            // If verification successful, mark step as completed
            if (verificationResult.valid) {
                if (!this.completedSteps.includes(5)) {
                    this.completedSteps.push(5);
                }
                
                // Log step completion
                this._logAuditEvent('COMPLETE_STEP_5_VERIFICATION', {
                    result: 'passed',
                    anggotaId: this.anggotaId
                });
            } else {
                // Log verification failure
                this._logAuditEvent('STEP_5_VERIFICATION_FAILED', {
                    error: verificationResult.error,
                    details: verificationResult.details,
                    anggotaId: this.anggotaId
                });
            }
            
            return verificationResult;
            
        } catch (error) {
            console.error('Error in executeStep5Verification:', error);
            this._logAuditEvent('STEP_5_ERROR', {
                error: error.message,
                anggotaId: this.anggotaId
            });
            return {
                success: false,
                valid: false,
                error: {
                    code: 'SYSTEM_ERROR',
                    message: error.message
                }
            };
        }
    }
    
    // ==================== STATE MANAGEMENT ====================
    
    /**
     * Save snapshot of current state for rollback
     * @returns {object} Snapshot object
     */
    saveSnapshot() {
        try {
            const snapshot = {
                anggota: localStorage.getItem('anggota'),
                simpananPokok: localStorage.getItem('simpananPokok'),
                simpananWajib: localStorage.getItem('simpananWajib'),
                simpananSukarela: localStorage.getItem('simpananSukarela'),
                jurnal: localStorage.getItem('jurnal'),
                pengembalian: localStorage.getItem('pengembalian'),
                timestamp: new Date().toISOString()
            };
            
            this.snapshot = snapshot;
            
            this._logAuditEvent('SNAPSHOT_CREATED', {
                timestamp: snapshot.timestamp,
                anggotaId: this.anggotaId
            });
            
            return snapshot;
            
        } catch (error) {
            console.error('Error in saveSnapshot:', error);
            return null;
        }
    }
    
    /**
     * Rollback to saved snapshot
     * @returns {boolean} True if rollback successful
     */
    rollback() {
        try {
            if (!this.snapshot) {
                console.error('No snapshot available for rollback');
                return false;
            }
            
            // Restore all data from snapshot
            if (this.snapshot.anggota) localStorage.setItem('anggota', this.snapshot.anggota);
            if (this.snapshot.simpananPokok) localStorage.setItem('simpananPokok', this.snapshot.simpananPokok);
            if (this.snapshot.simpananWajib) localStorage.setItem('simpananWajib', this.snapshot.simpananWajib);
            if (this.snapshot.simpananSukarela) localStorage.setItem('simpananSukarela', this.snapshot.simpananSukarela);
            if (this.snapshot.jurnal) localStorage.setItem('jurnal', this.snapshot.jurnal);
            if (this.snapshot.pengembalian) localStorage.setItem('pengembalian', this.snapshot.pengembalian);
            
            this._logAuditEvent('ROLLBACK_EXECUTED', {
                snapshotTimestamp: this.snapshot.timestamp,
                anggotaId: this.anggotaId
            });
            
            return true;
            
        } catch (error) {
            console.error('Error in rollback:', error);
            this._logAuditEvent('ROLLBACK_FAILED', {
                error: error.message,
                anggotaId: this.anggotaId
            });
            return false;
        }
    }
    
    /**
     * Get current wizard state
     * @returns {object} Wizard state object
     */
    getWizardState() {
        return {
            anggotaId: this.anggotaId,
            currentStep: this.currentStep,
            maxStep: this.maxStep,
            completedSteps: [...this.completedSteps],
            wizardData: { ...this.wizardData },
            status: this.status,
            createdAt: this.createdAt,
            completedAt: this.completedAt
        };
    }
    
    /**
     * Complete wizard
     * @returns {object} Completion result
     */
    complete() {
        try {
            // Validate all steps completed
            if (this.completedSteps.length !== this.maxStep) {
                return {
                    success: false,
                    error: 'Not all steps completed. Complete all steps before finishing.'
                };
            }
            
            this.status = 'completed';
            this.completedAt = new Date().toISOString();
            
            this._logAuditEvent('WIZARD_COMPLETED', {
                anggotaId: this.anggotaId,
                completedAt: this.completedAt,
                duration: new Date(this.completedAt) - new Date(this.createdAt)
            });
            
            return {
                success: true,
                message: 'Wizard completed successfully',
                wizardState: this.getWizardState()
            };
            
        } catch (error) {
            console.error('Error in complete:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    /**
     * Cancel wizard
     * @param {string} reason - Reason for cancellation
     * @returns {object} Cancellation result
     */
    cancel(reason = 'User cancelled') {
        try {
            this.status = 'cancelled';
            this.completedAt = new Date().toISOString();
            
            this._logAuditEvent('WIZARD_CANCELLED', {
                anggotaId: this.anggotaId,
                reason: reason,
                currentStep: this.currentStep,
                completedSteps: this.completedSteps
            });
            
            return {
                success: true,
                message: 'Wizard cancelled',
                reason: reason
            };
            
        } catch (error) {
            console.error('Error in cancel:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    // ==================== UI RENDERING ====================
    
    /**
     * Render step indicator
     * @returns {string} HTML for step indicator
     */
    renderStepIndicator() {
        const steps = [
            { number: 1, label: 'Validasi' },
            { number: 2, label: 'Pencairan' },
            { number: 3, label: 'Print' },
            { number: 4, label: 'Update' },
            { number: 5, label: 'Verifikasi' }
        ];
        
        let html = '<div class="wizard-step-indicator">';
        
        steps.forEach((step, index) => {
            const isActive = step.number === this.currentStep;
            const isCompleted = this.completedSteps.includes(step.number);
            const isPending = step.number > this.currentStep;
            
            let stepClass = 'wizard-step';
            let icon = '';
            
            if (isCompleted) {
                stepClass += ' completed';
                icon = '<i class="bi bi-check-circle-fill"></i>';
            } else if (isActive) {
                stepClass += ' active';
                icon = '<i class="bi bi-circle-fill"></i>';
            } else {
                stepClass += ' pending';
                icon = '<i class="bi bi-circle"></i>';
            }
            
            html += `
                <div class="${stepClass}">
                    <div class="step-icon">${icon}</div>
                    <div class="step-label">${step.number}. ${step.label}</div>
                </div>
            `;
            
            // Add arrow between steps (except after last step)
            if (index < steps.length - 1) {
                html += '<div class="step-arrow"><i class="bi bi-arrow-right"></i></div>';
            }
        });
        
        html += '</div>';
        
        return html;
    }
    
    /**
     * Render navigation buttons
     * @returns {string} HTML for navigation buttons
     */
    renderNavigationButtons() {
        const canPrev = this.canNavigatePrevious();
        const canNext = this.canNavigateNext();
        const isLastStep = this.currentStep === this.maxStep;
        const allCompleted = this.completedSteps.length === this.maxStep;
        
        let html = '<div class="wizard-navigation-buttons d-flex justify-content-between">';
        
        // Kembali button
        html += `
            <button type="button" class="btn btn-secondary" 
                    onclick="wizardPreviousStep()" 
                    ${!canPrev ? 'disabled' : ''}>
                <i class="bi bi-arrow-left me-1"></i>Kembali
            </button>
        `;
        
        // Batal button
        html += `
            <button type="button" class="btn btn-outline-danger" 
                    onclick="confirmCancelWizard()">
                <i class="bi bi-x-circle me-1"></i>Batal
            </button>
        `;
        
        // Lanjut or Selesai button
        if (isLastStep && allCompleted) {
            html += `
                <button type="button" class="btn btn-success" 
                        onclick="completeWizard()">
                    <i class="bi bi-check-circle me-1"></i>Selesai
                </button>
            `;
        } else {
            html += `
                <button type="button" class="btn btn-primary" 
                        onclick="wizardNextStep()" 
                        ${!canNext ? 'disabled' : ''}>
                    Lanjut<i class="bi bi-arrow-right ms-1"></i>
                </button>
            `;
        }
        
        html += '</div>';
        
        return html;
    }
    
    // ==================== PRIVATE METHODS ====================
    
    /**
     * Log audit event
     * @private
     * @param {string} action - Action name
     * @param {object} details - Event details
     */
    _logAuditEvent(action, details) {
        try {
            if (typeof saveAuditLog === 'function') {
                const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
                
                saveAuditLog({
                    id: generateId(),
                    timestamp: new Date().toISOString(),
                    userId: currentUser.id || 'system',
                    userName: currentUser.username || 'System',
                    action: action,
                    anggotaId: this.anggotaId,
                    details: details,
                    severity: action.includes('ERROR') || action.includes('FAILED') ? 'ERROR' : 'INFO'
                });
            }
        } catch (error) {
            console.error('Error logging audit event:', error);
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AnggotaKeluarWizard;
}
