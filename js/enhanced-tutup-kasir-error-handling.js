/**
 * Enhanced Tutup Kasir with Comprehensive Error Handling
 * Integrates with ComprehensiveErrorHandler for robust error management
 */

class EnhancedTutupKasir {
    constructor() {
        this.errorHandler = window.errorHandler;
        this.isProcessing = false;
        this.validationRules = this.initializeValidationRules();
        
        // Bind methods
        this.showTutupKasirModal = this.showTutupKasirModal.bind(this);
        this.processTutupKasir = this.processTutupKasir.bind(this);
    }

    /**
     * Initialize validation rules
     */
    initializeValidationRules() {
        return {
            kasAktual: {
                required: true,
                type: 'currency',
                min: 0,
                max: 999999999
            },
            keterangan: {
                required: false,
                type: 'text',
                maxLength: 500
            }
        };
    }

    /**
     * Enhanced showTutupKasirModal with comprehensive error handling
     */
    async showTutupKasirModal() {
        try {
            // Validate session with recovery
            const sessionResult = this.errorHandler.validateSessionWithRecovery('bukaKas');
            
            if (!sessionResult.success) {
                this.handleSessionError(sessionResult);
                return;
            }

            const bukaKasData = sessionResult.data;
            
            // Calculate sales data with error handling
            const salesData = await this.calculateSalesDataSafely();
            
            // Create and show modal
            this.createTutupKasirModal(bukaKasData, salesData);
            
        } catch (error) {
            this.errorHandler.logError('Show Tutup Kasir Modal Error', error);
            this.errorHandler.showUserError('Gagal Membuka Modal', 
                'Terjadi kesalahan saat membuka modal tutup kasir. Silakan coba lagi.');
        }
    }

    /**
     * Handle session errors
     */
    handleSessionError(sessionResult) {
        switch (sessionResult.action) {
            case 'redirect_to_buka_kas':
                this.redirectToBukaKas();
                break;
            case 'clear_and_restart':
                this.clearSessionAndRestart();
                break;
            default:
                this.errorHandler.showUserError('Session Error', 
                    'Terjadi masalah dengan session. Silakan refresh halaman.');
        }
    }

    /**
     * Redirect to buka kas
     */
    redirectToBukaKas() {
        const confirmRedirect = confirm('Anda perlu membuka kas terlebih dahulu. Redirect ke halaman buka kas?');
        if (confirmRedirect) {
            window.location.href = '#keuangan';
            // Trigger buka kas modal if function exists
            if (typeof showBukaKasModal === 'function') {
                setTimeout(() => showBukaKasModal(), 500);
            }
        }
    }

    /**
     * Clear session and restart
     */
    clearSessionAndRestart() {
        this.errorHandler.safeLocalStorageRemove('bukaKas');
        this.errorHandler.safeLocalStorageRemove('bukaKas_backup');
        
        this.errorHandler.showUserWarning('Session Dibersihkan', 
            'Session telah dibersihkan. Silakan buka kas ulang.');
        
        this.redirectToBukaKas();
    }

    /**
     * Calculate sales data with error handling
     */
    async calculateSalesDataSafely() {
        try {
            const salesData = {
                totalPenjualan: 0,
                totalCash: 0,
                totalKredit: 0,
                jumlahTransaksi: 0
            };

            // Get transactions from localStorage safely
            const transactionsData = this.errorHandler.safeLocalStorageGet('transactions');
            
            if (transactionsData) {
                const transactions = JSON.parse(transactionsData);
                const bukaKasData = JSON.parse(this.errorHandler.safeLocalStorageGet('bukaKas'));
                const shiftStart = new Date(bukaKasData.waktuBuka);
                
                // Filter transactions for current shift
                const shiftTransactions = transactions.filter(t => {
                    const transactionTime = new Date(t.tanggal);
                    return transactionTime >= shiftStart;
                });

                // Calculate totals with validation
                shiftTransactions.forEach(transaction => {
                    const total = this.validateNumber(transaction.total, 0);
                    salesData.totalPenjualan += total;
                    salesData.jumlahTransaksi++;
                    
                    if (transaction.metodePembayaran === 'cash') {
                        salesData.totalCash += total;
                    } else {
                        salesData.totalKredit += total;
                    }
                });
            }

            return salesData;
            
        } catch (error) {
            this.errorHandler.logError('Calculate Sales Data Error', error);
            
            // Return default values on error
            return {
                totalPenjualan: 0,
                totalCash: 0,
                totalKredit: 0,
                jumlahTransaksi: 0
            };
        }
    }

    /**
     * Validate number with fallback
     */
    validateNumber(value, fallback = 0) {
        const num = parseFloat(value);
        return isNaN(num) ? fallback : num;
    }

    /**
     * Create tutup kasir modal with enhanced error handling
     */
    createTutupKasirModal(bukaKasData, salesData) {
        try {
            const kasSeharusnya = bukaKasData.modalAwal + salesData.totalCash;
            
            const modalHtml = `
                <div class="modal fade" id="tutupKasirModal" tabindex="-1">
                    <div class="modal-dialog modal-lg">
                        <div class="modal-content">
                            <div class="modal-header bg-warning">
                                <h5 class="modal-title">
                                    <i class="bi bi-calculator me-2"></i>Tutup Kasir
                                </h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                <div class="row">
                                    <div class="col-md-6">
                                        <h6>Informasi Shift</h6>
                                        <table class="table table-sm">
                                            <tr><td>Kasir:</td><td><strong>${bukaKasData.kasir}</strong></td></tr>
                                            <tr><td>Waktu Buka:</td><td>${new Date(bukaKasData.waktuBuka).toLocaleString()}</td></tr>
                                            <tr><td>Modal Awal:</td><td>Rp ${bukaKasData.modalAwal.toLocaleString()}</td></tr>
                                        </table>
                                    </div>
                                    <div class="col-md-6">
                                        <h6>Ringkasan Penjualan</h6>
                                        <table class="table table-sm">
                                            <tr><td>Total Penjualan:</td><td>Rp ${salesData.totalPenjualan.toLocaleString()}</td></tr>
                                            <tr><td>Penjualan Cash:</td><td>Rp ${salesData.totalCash.toLocaleString()}</td></tr>
                                            <tr><td>Penjualan Kredit:</td><td>Rp ${salesData.totalKredit.toLocaleString()}</td></tr>
                                            <tr><td>Jumlah Transaksi:</td><td>${salesData.jumlahTransaksi}</td></tr>
                                        </table>
                                    </div>
                                </div>
                                
                                <hr>
                                
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label class="form-label">Kas Seharusnya</label>
                                            <input type="text" class="form-control" value="Rp ${kasSeharusnya.toLocaleString()}" readonly>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label class="form-label">Kas Aktual <span class="text-danger">*</span></label>
                                            <input type="number" id="kasAktual" class="form-control" placeholder="Masukkan jumlah kas aktual" required>
                                            <div class="invalid-feedback"></div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label class="form-label">Selisih Kas</label>
                                            <input type="text" id="selisihKas" class="form-control" readonly>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="mb-3" id="keteranganGroup" style="display: none;">
                                            <label class="form-label">Keterangan Selisih <span class="text-danger">*</span></label>
                                            <textarea id="keteranganSelisih" class="form-control" rows="2" placeholder="Jelaskan penyebab selisih kas"></textarea>
                                            <div class="invalid-feedback"></div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="alert alert-info">
                                    <i class="bi bi-info-circle me-2"></i>
                                    <strong>Petunjuk:</strong> Masukkan jumlah kas fisik yang ada di kasir saat ini. 
                                    Sistem akan menghitung selisih secara otomatis.
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Batal</button>
                                <button type="button" class="btn btn-warning" onclick="enhancedTutupKasir.processTutupKasir()" id="btnProsesTutupKasir">
                                    <i class="bi bi-calculator me-2"></i>Proses Tutup Kasir
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // Remove existing modal if any
            const existingModal = document.getElementById('tutupKasirModal');
            if (existingModal) {
                existingModal.remove();
            }

            // Add modal to DOM
            document.body.insertAdjacentHTML('beforeend', modalHtml);
            
            // Initialize modal functionality
            this.initializeModalFunctionality(kasSeharusnya);
            
            // Show modal
            const modal = new bootstrap.Modal(document.getElementById('tutupKasirModal'));
            modal.show();
            
        } catch (error) {
            this.errorHandler.logError('Create Modal Error', error);
            this.errorHandler.showUserError('Gagal Membuat Modal', 
                'Terjadi kesalahan saat membuat modal tutup kasir.');
        }
    }

    /**
     * Initialize modal functionality with error handling
     */
    initializeModalFunctionality(kasSeharusnya) {
        try {
            const kasAktualInput = document.getElementById('kasAktual');
            const selisihKasInput = document.getElementById('selisihKas');
            const keteranganGroup = document.getElementById('keteranganGroup');
            const keteranganInput = document.getElementById('keteranganSelisih');

            // Real-time calculation with validation
            kasAktualInput.addEventListener('input', (e) => {
                this.handleKasAktualInput(e.target, kasSeharusnya, selisihKasInput, keteranganGroup);
            });

            // Validation on blur
            kasAktualInput.addEventListener('blur', (e) => {
                this.validateKasAktualInput(e.target);
            });

            keteranganInput.addEventListener('blur', (e) => {
                this.validateKeteranganInput(e.target);
            });

            // Focus on kas aktual input
            setTimeout(() => kasAktualInput.focus(), 300);
            
        } catch (error) {
            this.errorHandler.logError('Initialize Modal Functionality Error', error);
        }
    }

    /**
     * Handle kas aktual input with validation
     */
    handleKasAktualInput(input, kasSeharusnya, selisihKasInput, keteranganGroup) {
        try {
            const kasAktual = parseFloat(input.value) || 0;
            const selisih = kasAktual - kasSeharusnya;
            
            // Update selisih display
            selisihKasInput.value = `Rp ${selisih.toLocaleString()}`;
            
            // Show/hide keterangan based on selisih
            if (Math.abs(selisih) > 0.01) { // Allow for small floating point differences
                keteranganGroup.style.display = 'block';
                selisihKasInput.className = selisih > 0 ? 'form-control text-success' : 'form-control text-danger';
            } else {
                keteranganGroup.style.display = 'none';
                selisihKasInput.className = 'form-control';
            }
            
            // Clear validation errors
            input.classList.remove('is-invalid');
            
        } catch (error) {
            this.errorHandler.logError('Handle Kas Aktual Input Error', error);
        }
    }

    /**
     * Validate kas aktual input
     */
    validateKasAktualInput(input) {
        const validation = this.errorHandler.validateInput(input.value, 'currency', 'Kas Aktual');
        
        if (!validation.isValid) {
            input.classList.add('is-invalid');
            input.nextElementSibling.textContent = validation.errors.join(', ');
            return false;
        }
        
        input.classList.remove('is-invalid');
        return true;
    }

    /**
     * Validate keterangan input
     */
    validateKeteranganInput(input) {
        const keteranganGroup = document.getElementById('keteranganGroup');
        
        if (keteranganGroup.style.display !== 'none') {
            const validation = this.errorHandler.validateInput(input.value, 'required', 'Keterangan');
            
            if (!validation.isValid) {
                input.classList.add('is-invalid');
                input.nextElementSibling.textContent = validation.errors.join(', ');
                return false;
            }
        }
        
        input.classList.remove('is-invalid');
        return true;
    }

    /**
     * Process tutup kasir with comprehensive error handling
     */
    async processTutupKasir() {
        if (this.isProcessing) {
            this.errorHandler.showUserWarning('Sedang Diproses', 
                'Proses tutup kasir sedang berlangsung. Mohon tunggu...');
            return;
        }

        try {
            this.isProcessing = true;
            this.updateProcessButton(true);

            // Validate all inputs
            if (!this.validateAllInputs()) {
                return;
            }

            // Get form data
            const formData = this.getFormData();
            
            // Create backup before processing
            this.createBackup(formData);
            
            // Process tutup kasir
            const result = await this.performTutupKasirProcess(formData);
            
            if (result.success) {
                await this.handleSuccessfulTutupKasir(result.data);
            } else {
                this.handleTutupKasirError(result.error);
            }
            
        } catch (error) {
            this.errorHandler.logError('Process Tutup Kasir Error', error);
            this.errorHandler.showUserError('Gagal Proses Tutup Kasir', 
                'Terjadi kesalahan saat memproses tutup kasir. Data Anda aman dan tersimpan.');
        } finally {
            this.isProcessing = false;
            this.updateProcessButton(false);
        }
    }

    /**
     * Validate all inputs
     */
    validateAllInputs() {
        const kasAktualInput = document.getElementById('kasAktual');
        const keteranganInput = document.getElementById('keteranganSelisih');
        
        let isValid = true;
        
        if (!this.validateKasAktualInput(kasAktualInput)) {
            isValid = false;
        }
        
        if (!this.validateKeteranganInput(keteranganInput)) {
            isValid = false;
        }
        
        if (!isValid) {
            this.errorHandler.showUserError('Data Tidak Valid', 
                'Silakan perbaiki data yang ditandai merah.');
        }
        
        return isValid;
    }

    /**
     * Get form data
     */
    getFormData() {
        const bukaKasData = JSON.parse(this.errorHandler.safeLocalStorageGet('bukaKas'));
        const kasAktual = parseFloat(document.getElementById('kasAktual').value);
        const selisihText = document.getElementById('selisihKas').value;
        const selisih = parseFloat(selisihText.replace(/[^\d.-]/g, ''));
        const keterangan = document.getElementById('keteranganSelisih').value;
        
        return {
            bukaKasData,
            kasAktual,
            selisih,
            keterangan: keterangan.trim()
        };
    }

    /**
     * Create backup before processing
     */
    createBackup(formData) {
        const backupData = {
            timestamp: new Date().toISOString(),
            formData: formData,
            sessionData: this.errorHandler.safeLocalStorageGet('bukaKas')
        };
        
        this.errorHandler.safeLocalStorageSet('tutupKasir_backup', JSON.stringify(backupData));
    }

    /**
     * Perform tutup kasir process
     */
    async performTutupKasirProcess(formData) {
        try {
            const salesData = await this.calculateSalesDataSafely();
            
            const tutupKasirData = {
                id: 'TK' + Date.now(),
                shiftId: formData.bukaKasData.id,
                kasir: formData.bukaKasData.kasir,
                kasirId: formData.bukaKasData.kasirId,
                waktuBuka: formData.bukaKasData.waktuBuka,
                waktuTutup: new Date().toISOString(),
                modalAwal: formData.bukaKasData.modalAwal,
                totalPenjualan: salesData.totalPenjualan,
                totalCash: salesData.totalCash,
                totalKredit: salesData.totalKredit,
                kasSeharusnya: formData.bukaKasData.modalAwal + salesData.totalCash,
                kasAktual: formData.kasAktual,
                selisih: formData.selisih,
                keteranganSelisih: formData.keterangan,
                jumlahTransaksi: salesData.jumlahTransaksi,
                tanggalTutup: new Date().toLocaleDateString()
            };

            // Save tutup kasir data
            const saveResult = this.saveTutupKasirData(tutupKasirData);
            if (!saveResult) {
                throw new Error('Failed to save tutup kasir data');
            }

            // Create journal entries if there's a difference
            if (Math.abs(formData.selisih) > 0.01) {
                await this.createJournalEntries(tutupKasirData);
            }

            // Update kas balance
            await this.updateKasBalance(tutupKasirData);

            return { success: true, data: tutupKasirData };
            
        } catch (error) {
            this.errorHandler.logError('Perform Tutup Kasir Process Error', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Save tutup kasir data with retry mechanism
     */
    saveTutupKasirData(tutupKasirData) {
        try {
            // Get existing riwayat
            const existingRiwayat = this.errorHandler.safeLocalStorageGet('riwayatTutupKas');
            let riwayatArray = [];
            
            if (existingRiwayat) {
                riwayatArray = JSON.parse(existingRiwayat);
            }
            
            // Add new data
            riwayatArray.push(tutupKasirData);
            
            // Save with error handling
            const success = this.errorHandler.safeLocalStorageSet('riwayatTutupKas', JSON.stringify(riwayatArray));
            
            if (success) {
                // Create additional backup
                this.errorHandler.safeLocalStorageSet('riwayatTutupKas_backup', JSON.stringify(riwayatArray));
            }
            
            return success;
            
        } catch (error) {
            this.errorHandler.logError('Save Tutup Kasir Data Error', error);
            return false;
        }
    }

    /**
     * Create journal entries for kas difference
     */
    async createJournalEntries(tutupKasirData) {
        try {
            if (Math.abs(tutupKasirData.selisih) <= 0.01) {
                return; // No journal needed for zero difference
            }

            const journalEntry = {
                id: 'JE' + Date.now(),
                tanggal: new Date().toISOString(),
                keterangan: `Selisih Kas Tutup Kasir - ${tutupKasirData.kasir}`,
                referensi: tutupKasirData.id,
                items: []
            };

            if (tutupKasirData.selisih > 0) {
                // Kas lebih (Debit Kas, Credit Pendapatan Lain-lain)
                journalEntry.items.push({
                    akun: 'Kas',
                    debit: tutupKasirData.selisih,
                    kredit: 0
                });
                journalEntry.items.push({
                    akun: 'Pendapatan Lain-lain',
                    debit: 0,
                    kredit: tutupKasirData.selisih
                });
            } else {
                // Kas kurang (Debit Beban Lain-lain, Credit Kas)
                const absSelisih = Math.abs(tutupKasirData.selisih);
                journalEntry.items.push({
                    akun: 'Beban Lain-lain',
                    debit: absSelisih,
                    kredit: 0
                });
                journalEntry.items.push({
                    akun: 'Kas',
                    debit: 0,
                    kredit: absSelisih
                });
            }

            // Save journal entry
            const existingJournals = this.errorHandler.safeLocalStorageGet('journalEntries');
            let journalsArray = [];
            
            if (existingJournals) {
                journalsArray = JSON.parse(existingJournals);
            }
            
            journalsArray.push(journalEntry);
            this.errorHandler.safeLocalStorageSet('journalEntries', JSON.stringify(journalsArray));
            
        } catch (error) {
            this.errorHandler.logError('Create Journal Entries Error', error);
            // Don't throw error - journal creation failure shouldn't stop tutup kasir
        }
    }

    /**
     * Update kas balance
     */
    async updateKasBalance(tutupKasirData) {
        try {
            // This would typically update the accounting system
            // For now, we'll just log the balance update
            this.errorHandler.logError('Kas Balance Update', null, {
                kasir: tutupKasirData.kasir,
                modalAwal: tutupKasirData.modalAwal,
                kasAktual: tutupKasirData.kasAktual,
                selisih: tutupKasirData.selisih
            });
            
        } catch (error) {
            this.errorHandler.logError('Update Kas Balance Error', error);
            // Don't throw error - balance update failure shouldn't stop tutup kasir
        }
    }

    /**
     * Handle successful tutup kasir
     */
    async handleSuccessfulTutupKasir(tutupKasirData) {
        try {
            // Clear session data
            this.errorHandler.safeLocalStorageRemove('bukaKas');
            this.errorHandler.safeLocalStorageRemove('bukaKas_backup');
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('tutupKasirModal'));
            if (modal) {
                modal.hide();
            }
            
            // Show success message
            this.errorHandler.showUserSuccess('Tutup Kasir Berhasil', 
                'Proses tutup kasir telah selesai. Laporan akan dicetak.');
            
            // Print report with error handling
            await this.printTutupKasirReport(tutupKasirData);
            
        } catch (error) {
            this.errorHandler.logError('Handle Successful Tutup Kasir Error', error);
        }
    }

    /**
     * Handle tutup kasir error
     */
    handleTutupKasirError(errorMessage) {
        this.errorHandler.showUserError('Gagal Tutup Kasir', 
            `Terjadi kesalahan: ${errorMessage}. Data Anda telah disimpan sebagai backup.`);
    }

    /**
     * Print tutup kasir report with error handling
     */
    async printTutupKasirReport(tutupKasirData) {
        try {
            const reportHtml = this.generateReportHtml(tutupKasirData);
            
            // Try to print
            const printWindow = window.open('', '_blank');
            printWindow.document.write(reportHtml);
            printWindow.document.close();
            printWindow.print();
            
        } catch (error) {
            this.errorHandler.logError('Print Report Error', error);
            
            // Use error handler's print failure mechanism
            const reportHtml = this.generateReportHtml(tutupKasirData);
            await this.errorHandler.handlePrintFailure(reportHtml, 'Laporan Tutup Kasir');
        }
    }

    /**
     * Generate report HTML
     */
    generateReportHtml(data) {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Laporan Tutup Kasir</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .header { text-align: center; margin-bottom: 20px; }
                    .info-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
                    .info-table td { padding: 5px; border-bottom: 1px solid #ddd; }
                    .total-row { font-weight: bold; border-top: 2px solid #000; }
                    @media print { body { margin: 0; } }
                </style>
            </head>
            <body>
                <div class="header">
                    <h2>LAPORAN TUTUP KASIR</h2>
                    <p>Tanggal: ${new Date(data.waktuTutup).toLocaleDateString()}</p>
                </div>
                
                <table class="info-table">
                    <tr><td>Kasir:</td><td>${data.kasir}</td></tr>
                    <tr><td>Waktu Buka:</td><td>${new Date(data.waktuBuka).toLocaleString()}</td></tr>
                    <tr><td>Waktu Tutup:</td><td>${new Date(data.waktuTutup).toLocaleString()}</td></tr>
                    <tr><td>Modal Awal:</td><td>Rp ${data.modalAwal.toLocaleString()}</td></tr>
                    <tr><td>Total Penjualan:</td><td>Rp ${data.totalPenjualan.toLocaleString()}</td></tr>
                    <tr><td>Penjualan Cash:</td><td>Rp ${data.totalCash.toLocaleString()}</td></tr>
                    <tr><td>Penjualan Kredit:</td><td>Rp ${data.totalKredit.toLocaleString()}</td></tr>
                    <tr><td>Jumlah Transaksi:</td><td>${data.jumlahTransaksi}</td></tr>
                    <tr><td>Kas Seharusnya:</td><td>Rp ${data.kasSeharusnya.toLocaleString()}</td></tr>
                    <tr><td>Kas Aktual:</td><td>Rp ${data.kasAktual.toLocaleString()}</td></tr>
                    <tr class="total-row"><td>Selisih Kas:</td><td>Rp ${data.selisih.toLocaleString()}</td></tr>
                    ${data.keteranganSelisih ? `<tr><td>Keterangan:</td><td>${data.keteranganSelisih}</td></tr>` : ''}
                </table>
                
                <div style="margin-top: 40px; text-align: right;">
                    <p>Kasir: ${data.kasir}</p>
                    <p style="margin-top: 60px;">_________________</p>
                    <p>Tanda Tangan</p>
                </div>
            </body>
            </html>
        `;
    }

    /**
     * Update process button state
     */
    updateProcessButton(isProcessing) {
        const button = document.getElementById('btnProsesTutupKasir');
        if (button) {
            if (isProcessing) {
                button.disabled = true;
                button.innerHTML = '<i class="bi bi-hourglass-split me-2"></i>Memproses...';
            } else {
                button.disabled = false;
                button.innerHTML = '<i class="bi bi-calculator me-2"></i>Proses Tutup Kasir';
            }
        }
    }
}

// Initialize enhanced tutup kasir
window.enhancedTutupKasir = new EnhancedTutupKasir();

// Replace existing showTutupKasirModal function
window.showTutupKasirModal = window.enhancedTutupKasir.showTutupKasirModal;