// Enhanced Tutup Kasir Modal - Improved UI/UX
// Task 3: Enhance modal tutup kasir interface dan user experience

/**
 * Enhanced showTutupKasirModal with improved UI/UX
 * Features:
 * - Better responsive design
 * - Clearer instructions and guidance
 * - Better error handling and validation feedback
 * - Loading states and progress indicators
 * - Enhanced accessibility
 */
function showTutupKasirModalEnhanced() {
    // Show loading state
    showLoadingState('Memuat data shift...');
    
    // Enhanced session validation with better error handling
    const sessionValidation = validateBukaKasSessionEnhanced();
    
    if (!sessionValidation.valid) {
        hideLoadingState();
        showEnhancedAlert(sessionValidation.message, 'error', sessionValidation.action);
        return;
    }
    
    const shiftData = sessionValidation.data;
    
    try {
        // Calculate sales data with loading feedback
        const salesData = calculateSalesDataEnhanced(shiftData);
        
        // Create enhanced modal HTML
        const modalHTML = createEnhancedModalHTML(shiftData, salesData);
        
        // Remove existing modal if any
        const existingModal = document.getElementById('tutupKasirModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Load enhanced cash calculation script if not already loaded
        if (typeof calculateKasSeharusnyaEnhanced === 'undefined') {
            const script = document.createElement('script');
            script.src = 'js/enhanced-cash-calculation.js';
            document.head.appendChild(script);
        }
        
        // Initialize enhanced modal functionality
        initializeEnhancedModal(shiftData, salesData);
        
        // Show modal with animation
        const modal = new bootstrap.Modal(document.getElementById('tutupKasirModal'), {
            backdrop: 'static',
            keyboard: false
        });
        
        hideLoadingState();
        modal.show();
        
        // Focus on kas aktual input after modal is shown
        document.getElementById('tutupKasirModal').addEventListener('shown.bs.modal', function() {
            document.getElementById('kasAktual').focus();
        });
        
    } catch (error) {
        hideLoadingState();
        console.error('Error creating tutup kasir modal:', error);
        showEnhancedAlert('Terjadi kesalahan saat memuat modal tutup kasir. Silakan coba lagi.', 'error', 'retry');
    }
}

/**
 * Enhanced session validation with detailed error handling
 */
function validateBukaKasSessionEnhanced() {
    const bukaKas = sessionStorage.getItem('bukaKas');
    
    if (!bukaKas) {
        return {
            valid: false,
            message: 'Belum ada kas yang dibuka. Silakan buka kas terlebih dahulu untuk memulai shift.',
            action: 'buka_kas',
            guidance: 'Klik tombol "Buka Kas" di menu utama untuk memulai shift kasir.'
        };
    }
    
    try {
        const data = JSON.parse(bukaKas);
        
        // Validate required fields with specific error messages
        const missingFields = [];
        if (!data.kasir) missingFields.push('nama kasir');
        if (!data.modalAwal) missingFields.push('modal awal');
        if (!data.waktuBuka) missingFields.push('waktu buka kas');
        if (!data.id) missingFields.push('ID shift');
        
        if (missingFields.length > 0) {
            return {
                valid: false,
                message: `Data buka kas tidak lengkap. Field yang hilang: ${missingFields.join(', ')}.`,
                action: 'buka_kas_ulang',
                guidance: 'Silakan buka kas ulang dengan data yang lengkap.'
            };
        }
        
        // Validate data types and ranges
        if (typeof data.modalAwal !== 'number' || data.modalAwal < 0) {
            return {
                valid: false,
                message: 'Modal awal tidak valid. Harus berupa angka positif.',
                action: 'buka_kas_ulang',
                guidance: 'Silakan buka kas ulang dengan modal awal yang valid.'
            };
        }
        
        // Validate shift duration (not too old)
        const waktuBuka = new Date(data.waktuBuka);
        const sekarang = new Date();
        const diffHours = (sekarang - waktuBuka) / (1000 * 60 * 60);
        
        if (diffHours > 24) {
            return {
                valid: false,
                message: 'Shift sudah terlalu lama (lebih dari 24 jam). Silakan buka kas baru.',
                action: 'buka_kas_ulang',
                guidance: 'Untuk keamanan, shift tidak boleh lebih dari 24 jam.'
            };
        }
        
        return { valid: true, data: data };
        
    } catch (e) {
        // Clean up corrupted session
        sessionStorage.removeItem('bukaKas');
        sessionStorage.removeItem('shiftId');
        
        return {
            valid: false,
            message: 'Data buka kas rusak atau tidak dapat dibaca. Session telah dibersihkan.',
            action: 'session_corrupt',
            guidance: 'Silakan buka kas ulang untuk memulai shift baru.'
        };
    }
}

/**
 * Calculate sales data with enhanced error handling and precision
 */
function calculateSalesDataEnhanced(shiftData) {
    try {
        // Use the enhanced calculation function
        const result = calculateSalesDataEnhancedV2(shiftData);
        
        if (!result.success) {
            throw new Error(result.error);
        }
        
        return {
            penjualanShift: result.penjualanShift,
            totalPenjualan: result.totalPenjualan,
            totalCash: result.totalCash,
            totalKredit: result.totalKredit,
            kasSeharusnya: result.kasSeharusnya,
            jumlahTransaksi: result.jumlahTransaksi,
            validation: result.validation
        };
        
    } catch (error) {
        console.error('Error calculating sales data:', error);
        throw new Error('Gagal menghitung data penjualan. Data mungkin rusak.');
    }
}

/**
 * Create enhanced modal HTML with better UI/UX
 */
function createEnhancedModalHTML(shiftData, salesData) {
    const shiftDuration = calculateShiftDurationEnhanced(shiftData.waktuBuka);
    
    return `
        <div class="modal fade" id="tutupKasirModal" tabindex="-1" aria-labelledby="tutupKasirModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
                <div class="modal-content">
                    <!-- Enhanced Header -->
                    <div class="modal-header bg-gradient-warning text-dark">
                        <div class="d-flex align-items-center">
                            <div class="bg-white rounded-circle p-2 me-3">
                                <i class="bi bi-calculator text-warning fs-4"></i>
                            </div>
                            <div>
                                <h4 class="modal-title mb-0" id="tutupKasirModalLabel">Tutup Kasir</h4>
                                <small class="text-muted">Proses penutupan shift kasir</small>
                            </div>
                        </div>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    
                    <!-- Enhanced Body -->
                    <div class="modal-body p-4">
                        <!-- Progress Indicator -->
                        <div class="progress mb-4" style="height: 6px;">
                            <div class="progress-bar bg-warning" role="progressbar" style="width: 33%" 
                                 aria-valuenow="33" aria-valuemin="0" aria-valuemax="100">
                            </div>
                        </div>
                        
                        <!-- Step Indicator -->
                        <div class="d-flex justify-content-between mb-4">
                            <div class="text-center">
                                <div class="bg-warning text-white rounded-circle d-inline-flex align-items-center justify-content-center" 
                                     style="width: 30px; height: 30px;">
                                    <small>1</small>
                                </div>
                                <div class="small mt-1 text-warning fw-bold">Verifikasi Data</div>
                            </div>
                            <div class="text-center">
                                <div class="bg-light text-muted rounded-circle d-inline-flex align-items-center justify-content-center" 
                                     style="width: 30px; height: 30px;">
                                    <small>2</small>
                                </div>
                                <div class="small mt-1 text-muted">Hitung Kas</div>
                            </div>
                            <div class="text-center">
                                <div class="bg-light text-muted rounded-circle d-inline-flex align-items-center justify-content-center" 
                                     style="width: 30px; height: 30px;">
                                    <small>3</small>
                                </div>
                                <div class="small mt-1 text-muted">Selesai</div>
                            </div>
                        </div>
                        
                        <!-- Instructions -->
                        <div class="alert alert-info border-0 mb-4">
                            <div class="d-flex">
                                <i class="bi bi-info-circle-fill me-2 mt-1"></i>
                                <div>
                                    <strong>Petunjuk:</strong> Pastikan semua transaksi sudah selesai sebelum menutup kasir. 
                                    Hitung dengan teliti uang cash yang ada di kasir untuk menghindari selisih.
                                </div>
                            </div>
                        </div>
                        
                        <!-- Shift Information Cards -->
                        <div class="row g-3 mb-4">
                            <!-- Shift Info -->
                            <div class="col-lg-6">
                                <div class="card border-0 shadow-sm h-100">
                                    <div class="card-header bg-light border-0">
                                        <h6 class="mb-0 text-primary">
                                            <i class="bi bi-person-badge me-2"></i>Informasi Shift
                                        </h6>
                                    </div>
                                    <div class="card-body">
                                        <div class="row g-2">
                                            <div class="col-4 text-muted small">Kasir:</div>
                                            <div class="col-8 fw-bold">${shiftData.kasir}</div>
                                            
                                            <div class="col-4 text-muted small">Mulai:</div>
                                            <div class="col-8">${formatDateTime(shiftData.waktuBuka)}</div>
                                            
                                            <div class="col-4 text-muted small">Durasi:</div>
                                            <div class="col-8 text-success fw-bold">${shiftDuration}</div>
                                            
                                            <div class="col-4 text-muted small">Modal:</div>
                                            <div class="col-8 text-primary fw-bold">${formatRupiah(shiftData.modalAwal)}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Sales Summary -->
                            <div class="col-lg-6">
                                <div class="card border-0 shadow-sm h-100">
                                    <div class="card-header bg-light border-0">
                                        <h6 class="mb-0 text-success">
                                            <i class="bi bi-graph-up me-2"></i>Ringkasan Penjualan
                                        </h6>
                                    </div>
                                    <div class="card-body">
                                        <div class="row g-2">
                                            <div class="col-6 text-muted small">Transaksi:</div>
                                            <div class="col-6 fw-bold">${salesData.jumlahTransaksi} item</div>
                                            
                                            <div class="col-6 text-muted small">Total:</div>
                                            <div class="col-6 fw-bold">${formatRupiah(salesData.totalPenjualan)}</div>
                                            
                                            <div class="col-6 text-muted small">Cash:</div>
                                            <div class="col-6 text-success fw-bold">${formatRupiah(salesData.totalCash)}</div>
                                            
                                            <div class="col-6 text-muted small">Kredit:</div>
                                            <div class="col-6 text-info fw-bold">${formatRupiah(salesData.totalKredit)}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Cash Calculation -->
                        <div class="card border-0 shadow-sm mb-4">
                            <div class="card-header bg-gradient-primary text-white border-0">
                                <h6 class="mb-0">
                                    <i class="bi bi-calculator me-2"></i>Perhitungan Kas
                                </h6>
                            </div>
                            <div class="card-body">
                                <div class="row g-3 text-center">
                                    <div class="col-md-4">
                                        <div class="bg-light rounded p-3">
                                            <div class="text-muted small mb-1">Modal Awal</div>
                                            <div class="h5 text-primary mb-0">${formatRupiah(shiftData.modalAwal)}</div>
                                        </div>
                                    </div>
                                    <div class="col-md-4">
                                        <div class="bg-light rounded p-3">
                                            <div class="text-muted small mb-1">Penjualan Cash</div>
                                            <div class="h5 text-success mb-0">${formatRupiah(salesData.totalCash)}</div>
                                        </div>
                                    </div>
                                    <div class="col-md-4">
                                        <div class="bg-warning bg-opacity-25 rounded p-3 border border-warning">
                                            <div class="text-muted small mb-1">Kas Seharusnya</div>
                                            <div class="h5 text-warning mb-0 fw-bold">${formatRupiah(salesData.kasSeharusnya)}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Cash Input Form -->
                        <form id="tutupKasirForm" novalidate>
                            <div class="card border-0 shadow-sm">
                                <div class="card-header bg-light border-0">
                                    <h6 class="mb-0 text-dark">
                                        <i class="bi bi-cash-stack me-2"></i>Input Kas Aktual
                                    </h6>
                                </div>
                                <div class="card-body">
                                    <div class="mb-3">
                                        <label class="form-label fw-bold">
                                            Kas Aktual (Hitung Uang di Kasir)
                                            <span class="text-danger">*</span>
                                        </label>
                                        <div class="input-group input-group-lg">
                                            <span class="input-group-text bg-light">Rp</span>
                                            <input type="number" 
                                                   class="form-control form-control-lg" 
                                                   id="kasAktual" 
                                                   placeholder="0"
                                                   min="0"
                                                   step="1000"
                                                   required
                                                   aria-describedby="kasAktualHelp kasAktualFeedback">
                                        </div>
                                        <div id="kasAktualHelp" class="form-text">
                                            <i class="bi bi-lightbulb me-1"></i>
                                            Hitung semua uang kertas dan koin yang ada di kasir dengan teliti
                                        </div>
                                        <div id="kasAktualFeedback" class="invalid-feedback"></div>
                                    </div>
                                    
                                    <!-- Quick Amount Buttons -->
                                    <div class="mb-3">
                                        <label class="form-label small text-muted">Bantuan Perhitungan:</label>
                                        <div class="d-flex flex-wrap gap-2">
                                            <button type="button" class="btn btn-outline-secondary btn-sm" 
                                                    onclick="setKasAktual(${salesData.kasSeharusnya})">
                                                Sesuai (${formatRupiah(salesData.kasSeharusnya)})
                                            </button>
                                            <button type="button" class="btn btn-outline-secondary btn-sm" 
                                                    onclick="addToKasAktual(50000)">
                                                +50K
                                            </button>
                                            <button type="button" class="btn btn-outline-secondary btn-sm" 
                                                    onclick="addToKasAktual(100000)">
                                                +100K
                                            </button>
                                            <button type="button" class="btn btn-outline-secondary btn-sm" 
                                                    onclick="addToKasAktual(-50000)">
                                                -50K
                                            </button>
                                            <button type="button" class="btn btn-outline-secondary btn-sm" 
                                                    onclick="clearKasAktual()">
                                                Reset
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <!-- Difference Display -->
                                    <div id="selisihContainer" style="display: none;">
                                        <div class="alert mb-3" id="selisihAlert">
                                            <div class="d-flex align-items-center">
                                                <i class="bi me-2" id="selisihIcon"></i>
                                                <div class="flex-grow-1">
                                                    <div class="fw-bold" id="selisihTitle"></div>
                                                    <div id="selisihDetail"></div>
                                                </div>
                                                <div class="text-end">
                                                    <div class="h5 mb-0 fw-bold" id="selisihAmount"></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <!-- Keterangan Section -->
                                    <div id="keteranganSection" style="display: none;">
                                        <div class="mb-3">
                                            <label class="form-label fw-bold">
                                                Keterangan Selisih
                                                <span class="text-danger">*</span>
                                            </label>
                                            <textarea class="form-control" 
                                                      id="keteranganSelisih" 
                                                      rows="3" 
                                                      placeholder="Jelaskan penyebab selisih kas (wajib diisi jika ada selisih)..."
                                                      aria-describedby="keteranganHelp keteranganFeedback"></textarea>
                                            <div id="keteranganHelp" class="form-text">
                                                Contoh: "Uang kembalian kurang Rp 5.000" atau "Ada uang receh lebih dari customer"
                                            </div>
                                            <div id="keteranganFeedback" class="invalid-feedback"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                    
                    <!-- Enhanced Footer -->
                    <div class="modal-footer bg-light border-0 p-4">
                        <div class="d-flex justify-content-between w-100 align-items-center">
                            <div class="text-muted small">
                                <i class="bi bi-shield-check me-1"></i>
                                Data akan disimpan secara otomatis
                            </div>
                            <div class="d-flex gap-2">
                                <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">
                                    <i class="bi bi-x-circle me-1"></i>Batal
                                </button>
                                <button type="button" class="btn btn-warning btn-lg" id="prosesTutupKasirBtn" 
                                        onclick="prosesTutupKasirEnhanced()" disabled>
                                    <span class="spinner-border spinner-border-sm me-2" id="processSpinner" style="display: none;"></span>
                                    <i class="bi bi-printer me-1" id="processIcon"></i>
                                    <span id="processText">Tutup & Print Laporan</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Initialize enhanced modal functionality
 */
function initializeEnhancedModal(shiftData, salesData) {
    const kasAktualInput = document.getElementById('kasAktual');
    const form = document.getElementById('tutupKasirForm');
    const processBtn = document.getElementById('prosesTutupKasirBtn');
    
    // Enhanced input validation and feedback
    kasAktualInput.addEventListener('input', function() {
        validateAndUpdateKasAktual(shiftData, salesData);
        updateProcessButton();
    });
    
    kasAktualInput.addEventListener('blur', function() {
        validateKasAktualField();
    });
    
    // Form validation
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        if (validateForm()) {
            prosesTutupKasirEnhanced();
        }
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.key === 'Enter') {
            e.preventDefault();
            if (!processBtn.disabled) {
                prosesTutupKasirEnhanced();
            }
        }
    });
    
    // Auto-save draft (optional)
    setInterval(() => {
        saveDraftData();
    }, 30000); // Save every 30 seconds
}

/**
 * Enhanced kas aktual validation and feedback with improved calculation
 */
function validateAndUpdateKasAktual(shiftData, salesData) {
    const kasAktualInput = document.getElementById('kasAktual');
    const kasAktualValue = kasAktualInput.value;
    
    // Use enhanced validation
    const validation = validateKasAktualEnhanced(kasAktualValue);
    
    if (!validation.valid) {
        // Show validation error
        kasAktualInput.classList.add('is-invalid');
        const feedback = document.getElementById('kasAktualFeedback');
        if (feedback) {
            feedback.textContent = validation.error;
        }
        
        // Hide selisih container for invalid input
        const selisihContainer = document.getElementById('selisihContainer');
        const keteranganSection = document.getElementById('keteranganSection');
        if (selisihContainer) selisihContainer.style.display = 'none';
        if (keteranganSection) keteranganSection.style.display = 'none';
        updateStepIndicator(1);
        return;
    }
    
    // Clear validation errors
    kasAktualInput.classList.remove('is-invalid');
    kasAktualInput.classList.add('is-valid');
    
    // Show warning if applicable
    if (validation.warning) {
        const feedback = document.getElementById('kasAktualFeedback');
        if (feedback) {
            feedback.textContent = validation.warning;
            feedback.className = 'form-text text-warning';
        }
    }
    
    const kasAktual = validation.value;
    
    // Use enhanced selisih calculation
    const selisihResult = calculateSelisihEnhanced(kasAktual, salesData.kasSeharusnya);
    
    if (!selisihResult.success) {
        // Handle calculation error
        console.error('Selisih calculation error:', selisihResult.error);
        return;
    }
    
    const selisihContainer = document.getElementById('selisihContainer');
    const selisihAlert = document.getElementById('selisihAlert');
    const selisihIcon = document.getElementById('selisihIcon');
    const selisihTitle = document.getElementById('selisihTitle');
    const selisihDetail = document.getElementById('selisihDetail');
    const selisihAmount = document.getElementById('selisihAmount');
    const keteranganSection = document.getElementById('keteranganSection');
    
    // Update progress bar
    updateProgressBar(kasAktual > 0 ? 66 : 33);
    
    if (kasAktual > 0) {
        selisihContainer.style.display = 'block';
        
        // Use enhanced selisih result for display
        const alertClass = `alert alert-${selisihResult.alertType} mb-3`;
        selisihAlert.className = alertClass;
        selisihIcon.className = `${selisihResult.icon} me-2`;
        selisihTitle.textContent = selisihResult.status === 'sesuai' ? 'Kas Sesuai!' : 
                                  selisihResult.status === 'lebih' ? 'Kas Lebih' : 'Kas Kurang';
        
        // Enhanced detail message with severity and recommendations
        let detailMessage = selisihResult.message;
        if (selisihResult.severity && selisihResult.severity !== 'none') {
            detailMessage += ` (Tingkat: ${selisihResult.severity})`;
        }
        if (selisihResult.percentageDiff > 0) {
            detailMessage += ` - ${selisihResult.percentageDiff.toFixed(2)}% dari kas seharusnya.`;
        }
        selisihDetail.textContent = detailMessage;
        
        // Format selisih amount with proper sign
        const formattedAmount = selisihResult.status === 'lebih' ? 
                               '+' + formatRupiah(selisihResult.selisihAbs) : 
                               selisihResult.status === 'kurang' ? 
                               '-' + formatRupiah(selisihResult.selisihAbs) : 
                               formatRupiah(0);
        
        selisihAmount.textContent = formattedAmount;
        selisihAmount.className = `h5 mb-0 fw-bold text-${selisihResult.alertType === 'success' ? 'success' : 
                                                          selisihResult.alertType === 'warning' ? 'warning' : 'danger'}`;
        
        // Show/hide keterangan section based on enhanced logic
        keteranganSection.style.display = selisihResult.isKeteranganRequired ? 'block' : 'none';
        
        // Add recommendations if available
        if (selisihResult.recommendations && selisihResult.recommendations.length > 0) {
            addRecommendationsToUI(selisihResult.recommendations);
        }
        
        // Update step indicator
        updateStepIndicator(2);
        
    } else {
        selisihContainer.style.display = 'none';
        keteranganSection.style.display = 'none';
        updateStepIndicator(1);
    }
}

/**
 * Helper functions for enhanced modal
 */
function setKasAktual(amount) {
    document.getElementById('kasAktual').value = amount;
    document.getElementById('kasAktual').dispatchEvent(new Event('input'));
}

function addToKasAktual(amount) {
    const input = document.getElementById('kasAktual');
    const current = parseFloat(input.value) || 0;
    const newAmount = Math.max(0, current + amount);
    input.value = newAmount;
    input.dispatchEvent(new Event('input'));
}

function clearKasAktual() {
    document.getElementById('kasAktual').value = '';
    document.getElementById('kasAktual').dispatchEvent(new Event('input'));
}

function updateProgressBar(percentage) {
    const progressBar = document.querySelector('.progress-bar');
    progressBar.style.width = percentage + '%';
    progressBar.setAttribute('aria-valuenow', percentage);
}

function updateStepIndicator(step) {
    const steps = document.querySelectorAll('.modal-body .text-center');
    steps.forEach((stepEl, index) => {
        const circle = stepEl.querySelector('div:first-child');
        const text = stepEl.querySelector('div:last-child');
        
        if (index + 1 <= step) {
            circle.className = 'bg-warning text-white rounded-circle d-inline-flex align-items-center justify-content-center';
            text.className = 'small mt-1 text-warning fw-bold';
        } else {
            circle.className = 'bg-light text-muted rounded-circle d-inline-flex align-items-center justify-content-center';
            text.className = 'small mt-1 text-muted';
        }
    });
}

function validateKasAktualField() {
    const input = document.getElementById('kasAktual');
    const feedback = document.getElementById('kasAktualFeedback');
    const value = parseFloat(input.value);
    
    if (!input.value) {
        input.classList.add('is-invalid');
        feedback.textContent = 'Kas aktual harus diisi';
        return false;
    }
    
    if (isNaN(value) || value < 0) {
        input.classList.add('is-invalid');
        feedback.textContent = 'Kas aktual harus berupa angka positif';
        return false;
    }
    
    input.classList.remove('is-invalid');
    input.classList.add('is-valid');
    return true;
}

function validateForm() {
    const kasAktualValid = validateKasAktualField();
    const keteranganSection = document.getElementById('keteranganSection');
    const keteranganInput = document.getElementById('keteranganSelisih');
    const keteranganFeedback = document.getElementById('keteranganFeedback');
    
    let keteranganValid = true;
    
    if (keteranganSection.style.display !== 'none') {
        if (!keteranganInput.value.trim()) {
            keteranganInput.classList.add('is-invalid');
            keteranganFeedback.textContent = 'Keterangan selisih harus diisi jika ada selisih kas';
            keteranganValid = false;
        } else {
            keteranganInput.classList.remove('is-invalid');
            keteranganInput.classList.add('is-valid');
        }
    }
    
    return kasAktualValid && keteranganValid;
}

function updateProcessButton() {
    const processBtn = document.getElementById('prosesTutupKasirBtn');
    const kasAktual = parseFloat(document.getElementById('kasAktual').value);
    
    if (kasAktual > 0) {
        processBtn.disabled = false;
        processBtn.classList.remove('btn-outline-warning');
        processBtn.classList.add('btn-warning');
    } else {
        processBtn.disabled = true;
        processBtn.classList.remove('btn-warning');
        processBtn.classList.add('btn-outline-warning');
    }
}

function calculateShiftDurationEnhanced(waktuBuka) {
    const start = new Date(waktuBuka);
    const now = new Date();
    const diffMs = now - start;
    
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
        return `${hours} jam ${minutes} menit`;
    } else {
        return `${minutes} menit`;
    }
}

function saveDraftData() {
    const kasAktual = document.getElementById('kasAktual')?.value;
    const keterangan = document.getElementById('keteranganSelisih')?.value;
    
    if (kasAktual) {
        const draft = {
            kasAktual: kasAktual,
            keterangan: keterangan,
            timestamp: new Date().toISOString()
        };
        
        sessionStorage.setItem('tutupKasirDraft', JSON.stringify(draft));
    }
}

function loadDraftData() {
    const draft = sessionStorage.getItem('tutupKasirDraft');
    if (draft) {
        try {
            const data = JSON.parse(draft);
            const kasAktualInput = document.getElementById('kasAktual');
            const keteranganInput = document.getElementById('keteranganSelisih');
            
            if (kasAktualInput && data.kasAktual) {
                kasAktualInput.value = data.kasAktual;
                kasAktualInput.dispatchEvent(new Event('input'));
            }
            
            if (keteranganInput && data.keterangan) {
                keteranganInput.value = data.keterangan;
            }
        } catch (e) {
            console.warn('Failed to load draft data:', e);
        }
    }
}

function clearDraftData() {
    sessionStorage.removeItem('tutupKasirDraft');
}

/**
 * Enhanced loading and alert functions
 */
function showLoadingState(message = 'Memuat...') {
    const loadingHTML = `
        <div id="loadingOverlay" class="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" 
             style="background: rgba(0,0,0,0.5); z-index: 9999;">
            <div class="bg-white rounded p-4 text-center">
                <div class="spinner-border text-warning mb-3" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <div>${message}</div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', loadingHTML);
}

function hideLoadingState() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.remove();
    }
}

function showEnhancedAlert(message, type = 'info', action = null) {
    const alertClass = {
        'success': 'alert-success',
        'error': 'alert-danger',
        'warning': 'alert-warning',
        'info': 'alert-info'
    }[type] || 'alert-info';
    
    const icon = {
        'success': 'bi-check-circle-fill',
        'error': 'bi-exclamation-triangle-fill',
        'warning': 'bi-exclamation-triangle-fill',
        'info': 'bi-info-circle-fill'
    }[type] || 'bi-info-circle-fill';
    
    let actionButton = '';
    if (action === 'buka_kas') {
        actionButton = '<button class="btn btn-primary btn-sm ms-2" onclick="navigateTo(\'pos\')">Buka Kas</button>';
    } else if (action === 'retry') {
        actionButton = '<button class="btn btn-outline-secondary btn-sm ms-2" onclick="showTutupKasirModalEnhanced()">Coba Lagi</button>';
    }
    
    const alertHTML = `
        <div class="alert ${alertClass} alert-dismissible fade show" role="alert">
            <i class="bi ${icon} me-2"></i>
            ${message}
            ${actionButton}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    
    // Show alert in a toast container or modal
    showAlert(message, type);
}

/**
 * Add recommendations to the UI
 * @param {Array} recommendations - Array of recommendation objects
 */
function addRecommendationsToUI(recommendations) {
    // Find or create recommendations container
    let recommendationsContainer = document.getElementById('recommendationsContainer');
    
    if (!recommendationsContainer) {
        // Create recommendations container after selisih container
        const selisihContainer = document.getElementById('selisihContainer');
        if (selisihContainer) {
            recommendationsContainer = document.createElement('div');
            recommendationsContainer.id = 'recommendationsContainer';
            recommendationsContainer.className = 'mt-3';
            selisihContainer.parentNode.insertBefore(recommendationsContainer, selisihContainer.nextSibling);
        }
    }
    
    if (!recommendationsContainer) return;
    
    // Clear existing recommendations
    recommendationsContainer.innerHTML = '';
    
    if (recommendations.length === 0) return;
    
    // Create recommendations HTML
    let html = '<div class="card border-0 shadow-sm"><div class="card-header bg-light border-0">';
    html += '<h6 class="mb-0 text-info"><i class="bi bi-lightbulb me-2"></i>Rekomendasi</h6></div>';
    html += '<div class="card-body">';
    
    recommendations.forEach((rec, index) => {
        const alertClass = rec.type === 'success' ? 'alert-success' : 
                          rec.type === 'warning' ? 'alert-warning' : 
                          rec.type === 'danger' ? 'alert-danger' : 'alert-info';
        
        const icon = rec.type === 'success' ? 'bi-check-circle' : 
                    rec.type === 'warning' ? 'bi-exclamation-triangle' : 
                    rec.type === 'danger' ? 'bi-exclamation-octagon' : 'bi-info-circle';
        
        html += `<div class="alert ${alertClass} alert-dismissible fade show mb-2" role="alert">`;
        html += `<i class="bi ${icon} me-2"></i>${rec.message}`;
        html += '<button type="button" class="btn-close" data-bs-dismiss="alert"></button>';
        html += '</div>';
    });
    
    html += '</div></div>';
    
    recommendationsContainer.innerHTML = html;
}

// Export enhanced functions for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        showTutupKasirModalEnhanced,
        validateBukaKasSessionEnhanced,
        calculateSalesDataEnhanced
    };
}