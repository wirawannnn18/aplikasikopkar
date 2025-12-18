// Enhanced Tutup Kasir Process - Improved Error Handling and User Feedback
// Task 3: Enhance modal tutup kasir interface dan user experience

/**
 * Enhanced process tutup kasir with better error handling and user feedback
 */
function prosesTutupKasirEnhanced() {
    // Validate form first
    if (!validateForm()) {
        showEnhancedAlert('Mohon lengkapi semua field yang diperlukan', 'error');
        return;
    }
    
    // Show processing state
    setProcessingState(true);
    
    try {
        // Get form data
        const kasAktual = parseFloat(document.getElementById('kasAktual').value);
        const keteranganSelisih = document.getElementById('keteranganSelisih').value.trim();
        
        // Validate kas aktual
        if (!kasAktual || kasAktual < 0) {
            throw new Error('Kas aktual tidak valid. Harus berupa angka positif.');
        }
        
        // Get session data with validation
        const sessionValidation = validateBukaKasSessionEnhanced();
        if (!sessionValidation.valid) {
            throw new Error(sessionValidation.message);
        }
        
        const shiftData = sessionValidation.data;
        
        // Calculate sales data with enhanced precision
        const salesData = calculateSalesDataEnhanced(shiftData);
        
        // Use enhanced selisih calculation
        const selisihResult = calculateSelisihEnhanced(kasAktual, salesData.kasSeharusnya);
        
        if (!selisihResult.success) {
            throw new Error('Gagal menghitung selisih kas: ' + selisihResult.error);
        }
        
        const selisih = selisihResult.selisih;
        
        // Validate keterangan if there's a difference
        if (selisih !== 0 && !keteranganSelisih) {
            throw new Error('Keterangan selisih harus diisi jika ada selisih kas.');
        }
        
        // Update progress
        updateProgressBar(100);
        updateStepIndicator(3);
        
        // Create tutup kasir record
        const tutupKasData = createTutupKasirRecord(shiftData, salesData, kasAktual, keteranganSelisih);
        
        // Save data with error handling
        saveTutupKasirData(tutupKasData);
        
        // Create journal entries if needed
        if (selisih !== 0) {
            createSelisihJournalEntry(tutupKasData, selisih);
        }
        
        // Clear session and draft data
        clearSessionData();
        clearDraftData();
        
        // Hide modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('tutupKasirModal'));
        modal.hide();
        
        // Show success message with details
        showSuccessMessage(tutupKasData);
        
        // Print laporan with enhanced formatting
        setTimeout(() => {
            printLaporanTutupKasirEnhanced(tutupKasData);
        }, 500);
        
        // Return to dashboard after delay
        setTimeout(() => {
            exitPOSFullscreen();
        }, 3000);
        
    } catch (error) {
        console.error('Error processing tutup kasir:', error);
        setProcessingState(false);
        showEnhancedAlert(error.message || 'Terjadi kesalahan saat memproses tutup kasir', 'error', 'retry');
    }
}

/**
 * Create tutup kasir record with enhanced validation
 */
function createTutupKasirRecord(shiftData, salesData, kasAktual, keteranganSelisih) {
    const sekarang = new Date();
    const selisih = kasAktual - salesData.kasSeharusnya;
    
    return {
        id: generateId(),
        shiftId: shiftData.id,
        kasir: shiftData.kasir,
        kasirId: shiftData.kasirId || shiftData.id,
        waktuBuka: shiftData.waktuBuka,
        waktuTutup: sekarang.toISOString(),
        modalAwal: shiftData.modalAwal,
        totalPenjualan: salesData.totalPenjualan,
        totalCash: salesData.totalCash,
        totalKredit: salesData.totalKredit,
        kasSeharusnya: salesData.kasSeharusnya,
        kasAktual: kasAktual,
        selisih: selisih,
        keteranganSelisih: keteranganSelisih,
        jumlahTransaksi: salesData.jumlahTransaksi,
        tanggalTutup: sekarang.toISOString().split('T')[0],
        // Enhanced fields
        durasi: calculateShiftDurationMinutes(shiftData.waktuBuka, sekarang.toISOString()),
        status: selisih === 0 ? 'sesuai' : (selisih > 0 ? 'lebih' : 'kurang'),
        createdAt: sekarang.toISOString(),
        version: '2.0' // Enhanced version
    };
}

/**
 * Save tutup kasir data with enhanced error handling
 */
function saveTutupKasirData(tutupKasData) {
    try {
        // Get existing data
        const riwayatTutupKas = JSON.parse(localStorage.getItem('riwayatTutupKas') || '[]');
        
        // Validate existing data structure
        if (!Array.isArray(riwayatTutupKas)) {
            console.warn('Invalid riwayat data structure, resetting...');
            localStorage.setItem('riwayatTutupKas', '[]');
        }
        
        // Add new record
        riwayatTutupKas.push(tutupKasData);
        
        // Save with backup
        localStorage.setItem('riwayatTutupKas', JSON.stringify(riwayatTutupKas));
        localStorage.setItem('riwayatTutupKas_backup', JSON.stringify(riwayatTutupKas));
        
        // Update statistics
        updateTutupKasirStatistics(tutupKasData);
        
    } catch (error) {
        console.error('Error saving tutup kasir data:', error);
        throw new Error('Gagal menyimpan data tutup kasir. Silakan coba lagi.');
    }
}

/**
 * Create journal entry for selisih kas with enhanced validation
 */
function createSelisihJournalEntry(tutupKasData, selisih) {
    try {
        const keterangan = `Selisih Kas Tutup Kasir - ${tutupKasData.kasir} - ${formatDate(tutupKasData.waktuTutup)}`;
        const referensi = `TK-${tutupKasData.id}`;
        
        if (selisih > 0) {
            // Kas lebih - Debit Kas, Kredit Pendapatan Lain-lain
            addJurnal(keterangan, [
                { 
                    akun: '1001', 
                    namaAkun: 'Kas',
                    debit: Math.abs(selisih), 
                    kredit: 0,
                    keterangan: `Kas lebih ${formatRupiah(Math.abs(selisih))}`
                },
                { 
                    akun: '4002', 
                    namaAkun: 'Pendapatan Lain-lain',
                    debit: 0, 
                    kredit: Math.abs(selisih),
                    keterangan: `Kas lebih dari tutup kasir`
                }
            ], referensi);
        } else {
            // Kas kurang - Debit Beban Lain-lain, Kredit Kas
            addJurnal(keterangan, [
                { 
                    akun: '5002', 
                    namaAkun: 'Beban Lain-lain',
                    debit: Math.abs(selisih), 
                    kredit: 0,
                    keterangan: `Kas kurang ${formatRupiah(Math.abs(selisih))}`
                },
                { 
                    akun: '1001', 
                    namaAkun: 'Kas',
                    debit: 0, 
                    kredit: Math.abs(selisih),
                    keterangan: `Kas kurang dari tutup kasir`
                }
            ], referensi);
        }
        
    } catch (error) {
        console.error('Error creating journal entry:', error);
        // Don't throw error here, just log it as journal is not critical for tutup kasir
        console.warn('Journal entry creation failed, but tutup kasir will continue');
    }
}

/**
 * Clear session data safely
 */
function clearSessionData() {
    try {
        sessionStorage.removeItem('bukaKas');
        sessionStorage.removeItem('shiftId');
        sessionStorage.removeItem('tutupKasirDraft');
        
        // Clear any POS related session data
        sessionStorage.removeItem('currentTransaction');
        sessionStorage.removeItem('selectedMember');
        
    } catch (error) {
        console.error('Error clearing session data:', error);
    }
}

/**
 * Show enhanced success message
 */
function showSuccessMessage(tutupKasData) {
    const selisihText = tutupKasData.selisih === 0 ? 
        'Kas sesuai' : 
        (tutupKasData.selisih > 0 ? 
            `Kas lebih ${formatRupiah(tutupKasData.selisih)}` : 
            `Kas kurang ${formatRupiah(Math.abs(tutupKasData.selisih))}`);
    
    const message = `
        <div class="text-center">
            <i class="bi bi-check-circle-fill text-success" style="font-size: 3rem;"></i>
            <h4 class="mt-3 mb-2">Kas Berhasil Ditutup!</h4>
            <p class="mb-2">Shift kasir <strong>${tutupKasData.kasir}</strong> telah ditutup</p>
            <p class="mb-2">Status: <strong>${selisihText}</strong></p>
            <p class="text-muted small">Laporan akan dicetak otomatis</p>
        </div>
    `;
    
    // Create success modal
    const successModalHTML = `
        <div class="modal fade" id="successModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content border-0 shadow">
                    <div class="modal-body p-4">
                        ${message}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', successModalHTML);
    
    const successModal = new bootstrap.Modal(document.getElementById('successModal'));
    successModal.show();
    
    // Auto hide after 2.5 seconds
    setTimeout(() => {
        successModal.hide();
        setTimeout(() => {
            document.getElementById('successModal')?.remove();
        }, 300);
    }, 2500);
}

/**
 * Enhanced print function with better formatting
 */
function printLaporanTutupKasirEnhanced(data) {
    try {
        const koperasi = JSON.parse(localStorage.getItem('koperasi') || '{}');
        const currentTime = new Date().toISOString();
        
        const laporanWindow = window.open('', '', 'width=800,height=600');
        
        if (!laporanWindow) {
            throw new Error('Popup diblokir. Silakan izinkan popup untuk mencetak laporan.');
        }
        
        laporanWindow.document.write(generateEnhancedLaporanHTML(data, koperasi, currentTime));
        laporanWindow.document.close();
        
        // Wait for content to load then print
        laporanWindow.onload = function() {
            setTimeout(() => {
                laporanWindow.print();
            }, 500);
        };
        
    } catch (error) {
        console.error('Error printing laporan:', error);
        showEnhancedAlert(
            'Gagal mencetak laporan: ' + error.message + '. Anda dapat mencetak ulang dari menu riwayat.', 
            'warning'
        );
    }
}

/**
 * Generate enhanced laporan HTML
 */
function generateEnhancedLaporanHTML(data, koperasi, currentTime) {
    const shiftDuration = calculateShiftDurationEnhanced(data.waktuBuka);
    const printTime = formatDateTime(currentTime);
    
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Laporan Tutup Kasir - ${data.kasir}</title>
            <meta charset="UTF-8">
            <style>
                body { 
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                    font-size: 12px; 
                    padding: 20px; 
                    line-height: 1.5;
                    color: #333;
                }
                .header { 
                    text-align: center; 
                    margin-bottom: 30px; 
                    border-bottom: 3px solid #000;
                    padding-bottom: 15px;
                }
                .logo { 
                    max-width: 80px; 
                    max-height: 80px; 
                    margin: 10px auto; 
                }
                .company-info {
                    margin-bottom: 20px;
                }
                .report-title {
                    font-size: 18px;
                    font-weight: bold;
                    margin: 15px 0 5px 0;
                    color: #2c3e50;
                }
                .report-number {
                    color: #7f8c8d;
                    font-size: 11px;
                }
                .section { 
                    margin-bottom: 25px; 
                    page-break-inside: avoid;
                }
                .section-title { 
                    font-weight: bold; 
                    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
                    padding: 10px 15px; 
                    margin-bottom: 15px;
                    border-left: 4px solid #007bff;
                    border-radius: 4px;
                    font-size: 13px;
                    color: #495057;
                }
                .info-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 20px;
                    margin-bottom: 20px;
                }
                .info-row { 
                    display: flex; 
                    justify-content: space-between; 
                    margin-bottom: 8px; 
                    padding: 5px 0;
                    border-bottom: 1px dotted #dee2e6;
                }
                .info-label {
                    color: #6c757d;
                    font-weight: 500;
                }
                .info-value {
                    font-weight: bold;
                    color: #495057;
                }
                .amount { 
                    text-align: right; 
                    font-weight: bold; 
                    font-family: 'Courier New', monospace;
                }
                .total-row { 
                    border-top: 2px solid #000; 
                    border-bottom: 1px solid #000;
                    padding: 8px 0; 
                    font-weight: bold; 
                    background-color: #f8f9fa;
                    margin: 10px 0;
                }
                .selisih-row {
                    padding: 8px 0;
                    font-weight: bold;
                    font-size: 13px;
                }
                .selisih-sesuai { color: #28a745; }
                .selisih-lebih { color: #ffc107; }
                .selisih-kurang { color: #dc3545; }
                .signature { 
                    margin-top: 50px; 
                    display: flex; 
                    justify-content: space-between; 
                    page-break-inside: avoid;
                }
                .signature-box { 
                    text-align: center; 
                    width: 200px; 
                }
                .signature-line { 
                    border-top: 1px solid #000; 
                    margin-top: 60px; 
                    padding-top: 5px; 
                    font-weight: bold;
                }
                .footer {
                    margin-top: 30px;
                    padding-top: 15px;
                    border-top: 1px solid #dee2e6;
                    font-size: 10px;
                    color: #6c757d;
                    text-align: center;
                }
                .status-badge {
                    display: inline-block;
                    padding: 4px 8px;
                    border-radius: 12px;
                    font-size: 10px;
                    font-weight: bold;
                    text-transform: uppercase;
                }
                .status-sesuai { background-color: #d4edda; color: #155724; }
                .status-lebih { background-color: #fff3cd; color: #856404; }
                .status-kurang { background-color: #f8d7da; color: #721c24; }
                @media print {
                    body { margin: 0; padding: 15px; }
                    .no-print { display: none; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                ${koperasi.logo ? `<img src="${koperasi.logo}" alt="Logo" class="logo">` : ''}
                <div class="company-info">
                    <h2 style="margin: 10px 0; color: #2c3e50;">${koperasi.nama || 'Koperasi Karyawan'}</h2>
                    <p style="margin: 5px 0; color: #6c757d;">${koperasi.alamat || ''}</p>
                    ${koperasi.telepon ? `<p style="margin: 5px 0; color: #6c757d;">Telp: ${koperasi.telepon}</p>` : ''}
                </div>
                <div class="report-title">LAPORAN TUTUP KASIR</div>
                <div class="report-number">No: TK-${data.id} | Dicetak: ${printTime}</div>
            </div>

            <div class="section">
                <div class="section-title">📋 INFORMASI SHIFT</div>
                <div class="info-grid">
                    <div>
                        <div class="info-row">
                            <span class="info-label">Kasir:</span>
                            <span class="info-value">${data.kasir}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Waktu Buka:</span>
                            <span class="info-value">${formatDateTime(data.waktuBuka)}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Waktu Tutup:</span>
                            <span class="info-value">${formatDateTime(data.waktuTutup)}</span>
                        </div>
                    </div>
                    <div>
                        <div class="info-row">
                            <span class="info-label">Durasi Shift:</span>
                            <span class="info-value">${shiftDuration}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Status:</span>
                            <span class="status-badge status-${data.status}">${data.status}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">ID Shift:</span>
                            <span class="info-value">${data.shiftId}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="section">
                <div class="section-title">📊 RINGKASAN PENJUALAN</div>
                <div class="info-row">
                    <span class="info-label">Jumlah Transaksi:</span>
                    <span class="info-value">${data.jumlahTransaksi} transaksi</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Total Penjualan:</span>
                    <span class="amount info-value">${formatRupiah(data.totalPenjualan)}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">- Penjualan Cash:</span>
                    <span class="amount info-value">${formatRupiah(data.totalCash)}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">- Penjualan Kredit:</span>
                    <span class="amount info-value">${formatRupiah(data.totalKredit)}</span>
                </div>
            </div>

            <div class="section">
                <div class="section-title">💰 REKONSILIASI KAS</div>
                <div class="info-row">
                    <span class="info-label">Modal Awal Kasir:</span>
                    <span class="amount info-value">${formatRupiah(data.modalAwal)}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Penjualan Cash:</span>
                    <span class="amount info-value">${formatRupiah(data.totalCash)}</span>
                </div>
                <div class="info-row total-row">
                    <span class="info-label">Kas Seharusnya:</span>
                    <span class="amount">${formatRupiah(data.kasSeharusnya)}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Kas Aktual:</span>
                    <span class="amount info-value">${formatRupiah(data.kasAktual)}</span>
                </div>
                <div class="info-row selisih-row selisih-${data.status}">
                    <span class="info-label">Selisih:</span>
                    <span class="amount">${formatRupiah(data.selisih)}</span>
                </div>
                ${data.keteranganSelisih ? `
                <div style="margin-top: 15px; padding: 10px; background-color: #f8f9fa; border-radius: 4px;">
                    <strong>Keterangan Selisih:</strong><br>
                    ${data.keteranganSelisih}
                </div>
                ` : ''}
            </div>

            <div class="signature">
                <div class="signature-box">
                    <div>Kasir</div>
                    <div class="signature-line">${data.kasir}</div>
                </div>
                <div class="signature-box">
                    <div>Supervisor</div>
                    <div class="signature-line">(...........................)</div>
                </div>
                <div class="signature-box">
                    <div>Manager</div>
                    <div class="signature-line">(...........................)</div>
                </div>
            </div>

            <div class="footer">
                <p>Laporan ini digenerate otomatis oleh sistem POS Koperasi</p>
                <p>Dicetak pada: ${printTime} | Versi: ${data.version || '2.0'}</p>
            </div>
        </body>
        </html>
    `;
}

/**
 * Set processing state for button and UI
 */
function setProcessingState(processing) {
    const processBtn = document.getElementById('prosesTutupKasirBtn');
    const processSpinner = document.getElementById('processSpinner');
    const processIcon = document.getElementById('processIcon');
    const processText = document.getElementById('processText');
    
    if (processing) {
        processBtn.disabled = true;
        processSpinner.style.display = 'inline-block';
        processIcon.style.display = 'none';
        processText.textContent = 'Memproses...';
        processBtn.classList.add('btn-outline-warning');
        processBtn.classList.remove('btn-warning');
    } else {
        processBtn.disabled = false;
        processSpinner.style.display = 'none';
        processIcon.style.display = 'inline';
        processText.textContent = 'Tutup & Print Laporan';
        processBtn.classList.remove('btn-outline-warning');
        processBtn.classList.add('btn-warning');
    }
}

/**
 * Calculate shift duration in minutes
 */
function calculateShiftDurationMinutes(waktuBuka, waktuTutup) {
    const start = new Date(waktuBuka);
    const end = new Date(waktuTutup);
    return Math.floor((end - start) / (1000 * 60));
}

/**
 * Update tutup kasir statistics
 */
function updateTutupKasirStatistics(tutupKasData) {
    try {
        const stats = JSON.parse(localStorage.getItem('tutupKasirStats') || '{}');
        
        const today = tutupKasData.tanggalTutup;
        const month = today.substring(0, 7); // YYYY-MM
        
        // Daily stats
        if (!stats.daily) stats.daily = {};
        if (!stats.daily[today]) stats.daily[today] = { count: 0, totalSelisih: 0 };
        stats.daily[today].count++;
        stats.daily[today].totalSelisih += Math.abs(tutupKasData.selisih);
        
        // Monthly stats
        if (!stats.monthly) stats.monthly = {};
        if (!stats.monthly[month]) stats.monthly[month] = { count: 0, totalSelisih: 0 };
        stats.monthly[month].count++;
        stats.monthly[month].totalSelisih += Math.abs(tutupKasData.selisih);
        
        // Kasir stats
        if (!stats.kasir) stats.kasir = {};
        if (!stats.kasir[tutupKasData.kasir]) stats.kasir[tutupKasData.kasir] = { count: 0, totalSelisih: 0 };
        stats.kasir[tutupKasData.kasir].count++;
        stats.kasir[tutupKasData.kasir].totalSelisih += Math.abs(tutupKasData.selisih);
        
        localStorage.setItem('tutupKasirStats', JSON.stringify(stats));
        
    } catch (error) {
        console.error('Error updating statistics:', error);
    }
}

// Export functions for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        prosesTutupKasirEnhanced,
        createTutupKasirRecord,
        printLaporanTutupKasirEnhanced
    };
}