// Anggota Keluar Manager Module
// Handles business logic for member exit and refund processing
// Task 15.1: Integrated with caching for performance optimization

/**
 * Mark an anggota as exited from the cooperative
 * @param {string} anggotaId - ID of the anggota
 * @param {string} tanggalKeluar - Exit date in ISO format (YYYY-MM-DD)
 * @param {string} alasanKeluar - Reason for exit
 * @returns {object} Result object with success status and data/error
 */
function markAnggotaKeluar(anggotaId, tanggalKeluar, alasanKeluar) {
    try {
        // Validate input parameters
        if (!anggotaId || typeof anggotaId !== 'string') {
            return {
                success: false,
                error: {
                    code: 'INVALID_PARAMETER',
                    message: 'ID anggota tidak valid',
                    timestamp: new Date().toISOString()
                }
            };
        }

        if (!tanggalKeluar || typeof tanggalKeluar !== 'string') {
            return {
                success: false,
                error: {
                    code: 'INVALID_PARAMETER',
                    message: 'Tanggal keluar tidak valid',
                    timestamp: new Date().toISOString()
                }
            };
        }

        if (!alasanKeluar || typeof alasanKeluar !== 'string' || alasanKeluar.trim() === '') {
            return {
                success: false,
                error: {
                    code: 'INVALID_PARAMETER',
                    message: 'Alasan keluar harus diisi',
                    timestamp: new Date().toISOString()
                }
            };
        }

        // Get anggota data
        const anggota = getAnggotaById(anggotaId);
        
        if (!anggota) {
            return {
                success: false,
                error: {
                    code: 'ANGGOTA_NOT_FOUND',
                    message: 'Anggota tidak ditemukan',
                    timestamp: new Date().toISOString()
                }
            };
        }

        // Check if anggota is already marked as keluar
        if (anggota.statusKeanggotaan === 'Keluar') {
            return {
                success: false,
                error: {
                    code: 'ANGGOTA_ALREADY_KELUAR',
                    message: 'Anggota sudah berstatus keluar',
                    timestamp: new Date().toISOString()
                }
            };
        }

        // Validate date format (YYYY-MM-DD)
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(tanggalKeluar)) {
            return {
                success: false,
                error: {
                    code: 'INVALID_DATE_FORMAT',
                    message: 'Format tanggal harus YYYY-MM-DD',
                    timestamp: new Date().toISOString()
                }
            };
        }

        // Validate date is not in the future
        const exitDate = new Date(tanggalKeluar);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (exitDate > today) {
            return {
                success: false,
                error: {
                    code: 'INVALID_DATE',
                    message: 'Tanggal keluar tidak boleh di masa depan',
                    timestamp: new Date().toISOString()
                }
            };
        }

        // Get current user for audit log
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        
        // Update anggota status
        const updateSuccess = updateAnggotaStatus(anggotaId, 'Keluar', {
            tanggalKeluar: tanggalKeluar,
            alasanKeluar: alasanKeluar.trim(),
            pengembalianStatus: 'Pending',
            pengembalianId: null
        });

        if (!updateSuccess) {
            return {
                success: false,
                error: {
                    code: 'UPDATE_FAILED',
                    message: 'Gagal mengupdate status anggota',
                    timestamp: new Date().toISOString()
                }
            };
        }

        // Create audit log entry
        const auditLog = {
            id: generateId(),
            timestamp: new Date().toISOString(),
            userId: currentUser.id || 'system',
            userName: currentUser.username || 'System',
            action: 'MARK_KELUAR',
            anggotaId: anggotaId,
            anggotaNama: anggota.nama,
            details: {
                tanggalKeluar: tanggalKeluar,
                alasanKeluar: alasanKeluar.trim(),
                previousStatus: anggota.statusKeanggotaan || 'Aktif'
            },
            ipAddress: null // Can be added if available
        };

        saveAuditLog(auditLog);

        // Invalidate cache for this anggota (Task 15.1)
        if (typeof AnggotaKeluarCache !== 'undefined') {
            AnggotaKeluarCache.invalidateAnggota(anggotaId);
            AnggotaKeluarCache.invalidateReports();
        }

        // Return success
        return {
            success: true,
            data: {
                anggotaId: anggotaId,
                anggotaNama: anggota.nama,
                statusKeanggotaan: 'Keluar',
                tanggalKeluar: tanggalKeluar,
                alasanKeluar: alasanKeluar.trim(),
                pengembalianStatus: 'Pending'
            },
            message: `Anggota ${anggota.nama} berhasil ditandai keluar dari koperasi`
        };

    } catch (error) {
        console.error('Error in markAnggotaKeluar:', error);
        return {
            success: false,
            error: {
                code: 'SYSTEM_ERROR',
                message: error.message,
                timestamp: new Date().toISOString()
            }
        };
    }
}

/**
 * Calculate total pengembalian for an anggota
 * Task 15.1: Uses cached calculations for better performance
 * @param {string} anggotaId - ID of the anggota
 * @returns {object} Calculation result with breakdown
 */
function calculatePengembalian(anggotaId) {
    try {
        // Validate input
        if (!anggotaId || typeof anggotaId !== 'string') {
            return {
                success: false,
                error: {
                    code: 'INVALID_PARAMETER',
                    message: 'ID anggota tidak valid',
                    timestamp: new Date().toISOString()
                }
            };
        }
        
        // Check if anggota exists
        const anggota = getAnggotaById(anggotaId);
        if (!anggota) {
            return {
                success: false,
                error: {
                    code: 'ANGGOTA_NOT_FOUND',
                    message: 'Anggota tidak ditemukan',
                    timestamp: new Date().toISOString()
                }
            };
        }
        
        // Use cached calculation if available (Task 15.1)
        let simpananPokok, simpananWajib, kewajibanLain;
        
        if (typeof AnggotaKeluarCache !== 'undefined') {
            // Use cached functions for better performance
            simpananPokok = AnggotaKeluarCache.getTotalSimpananPokokCached(anggotaId);
            simpananWajib = AnggotaKeluarCache.getTotalSimpananWajibCached(anggotaId);
            kewajibanLain = AnggotaKeluarCache.getKewajibanLainCached(anggotaId);
        } else {
            // Fallback to non-cached functions
            simpananPokok = getTotalSimpananPokok(anggotaId);
            simpananWajib = getTotalSimpananWajib(anggotaId);
            kewajibanLain = getKewajibanLain(anggotaId);
        }
        
        const pinjamanAktif = getPinjamanAktif(anggotaId);
        
        // Calculate total simpanan
        const totalSimpanan = simpananPokok + simpananWajib;
        
        // Calculate total pengembalian (simpanan - kewajiban)
        const totalPengembalian = totalSimpanan - kewajibanLain;
        
        // Return calculation result
        return {
            success: true,
            data: {
                anggotaId: anggotaId,
                anggotaNama: anggota.nama,
                anggotaNIK: anggota.nik,
                simpananPokok: simpananPokok,
                simpananWajib: simpananWajib,
                totalSimpanan: totalSimpanan,
                kewajibanLain: kewajibanLain,
                pinjamanAktif: pinjamanAktif,
                totalPengembalian: totalPengembalian,
                hasPinjamanAktif: pinjamanAktif.length > 0
            },
            message: 'Perhitungan pengembalian berhasil'
        };
        
    } catch (error) {
        console.error('Error in calculatePengembalian:', error);
        return {
            success: false,
            error: {
                code: 'SYSTEM_ERROR',
                message: error.message,
                timestamp: new Date().toISOString()
            }
        };
    }
}

/**
 * Validate pengembalian eligibility
 * @param {string} anggotaId - ID of the anggota
 * @param {string} metodePembayaran - Payment method (optional - only validated if provided)
 * @returns {object} Validation result with detailed errors
 */
function validatePengembalian(anggotaId, metodePembayaran) {
    try {
        // Validate input
        if (!anggotaId || typeof anggotaId !== 'string') {
            return {
                success: false,
                error: {
                    code: 'INVALID_PARAMETER',
                    message: 'ID anggota tidak valid',
                    timestamp: new Date().toISOString()
                }
            };
        }
        
        // Check if anggota exists
        const anggota = getAnggotaById(anggotaId);
        if (!anggota) {
            return {
                success: false,
                error: {
                    code: 'ANGGOTA_NOT_FOUND',
                    message: 'Anggota tidak ditemukan',
                    timestamp: new Date().toISOString()
                }
            };
        }
        
        // Collect validation errors
        const validationErrors = [];
        const validationWarnings = [];
        
        // Validation 1: Check for active loans (Requirement 6.1)
        const pinjamanAktif = getPinjamanAktif(anggotaId);
        if (pinjamanAktif.length > 0) {
            const totalPinjaman = pinjamanAktif.reduce((sum, p) => sum + (parseFloat(p.jumlah) || 0), 0);
            validationErrors.push({
                code: 'ACTIVE_LOAN_EXISTS',
                message: `Anggota memiliki ${pinjamanAktif.length} pinjaman aktif dengan total Rp ${totalPinjaman.toLocaleString('id-ID')}`,
                field: 'pinjaman',
                severity: 'error',
                data: {
                    count: pinjamanAktif.length,
                    total: totalPinjaman,
                    loans: pinjamanAktif
                }
            });
        }
        
        // Validation 2: Check for sufficient kas/bank balance (Requirement 6.2)
        // Changed to WARNING instead of ERROR for practical flexibility
        const calculation = calculatePengembalian(anggotaId);
        if (calculation.success) {
            const totalPengembalian = calculation.data.totalPengembalian;
            
            // Get current kas and bank balance
            const jurnal = JSON.parse(localStorage.getItem('jurnal') || '[]');
            
            // Calculate Kas balance (1-1000)
            const kasBalance = jurnal
                .filter(j => j.akun === '1-1000') // Akun Kas
                .reduce((sum, j) => sum + (j.debit || 0) - (j.kredit || 0), 0);
            
            // Calculate Bank balance (1-1100)
            const bankBalance = jurnal
                .filter(j => j.akun === '1-1100') // Akun Bank
                .reduce((sum, j) => sum + (j.debit || 0) - (j.kredit || 0), 0);
            
            // Total available balance (Kas + Bank)
            const totalAvailableBalance = kasBalance + bankBalance;
            
            // Check if payment method is specified to validate specific account
            if (metodePembayaran !== undefined && metodePembayaran) {
                if (metodePembayaran === 'Kas') {
                    // Validate Kas balance only - WARNING instead of ERROR
                    if (totalPengembalian > 0 && kasBalance < totalPengembalian) {
                        validationWarnings.push({
                            code: 'INSUFFICIENT_BALANCE',
                            message: `Saldo kas tidak mencukupi. Dibutuhkan: Rp ${totalPengembalian.toLocaleString('id-ID')}, Tersedia di Kas: Rp ${kasBalance.toLocaleString('id-ID')}. Pastikan dana tersedia sebelum melakukan pengembalian.`,
                            field: 'kas',
                            severity: 'warning',
                            data: {
                                required: totalPengembalian,
                                available: kasBalance,
                                shortfall: totalPengembalian - kasBalance,
                                paymentMethod: 'Kas'
                            }
                        });
                    }
                } else if (metodePembayaran === 'Transfer Bank') {
                    // Validate Bank balance only - WARNING instead of ERROR
                    if (totalPengembalian > 0 && bankBalance < totalPengembalian) {
                        validationWarnings.push({
                            code: 'INSUFFICIENT_BALANCE',
                            message: `Saldo bank tidak mencukupi. Dibutuhkan: Rp ${totalPengembalian.toLocaleString('id-ID')}, Tersedia di Bank: Rp ${bankBalance.toLocaleString('id-ID')}. Pastikan dana tersedia sebelum melakukan pengembalian.`,
                            field: 'bank',
                            severity: 'warning',
                            data: {
                                required: totalPengembalian,
                                available: bankBalance,
                                shortfall: totalPengembalian - bankBalance,
                                paymentMethod: 'Transfer Bank'
                            }
                        });
                    }
                }
            } else {
                // If payment method not specified, check total available balance - WARNING instead of ERROR
                if (totalPengembalian > 0 && totalAvailableBalance < totalPengembalian) {
                    validationWarnings.push({
                        code: 'INSUFFICIENT_BALANCE',
                        message: `Saldo kas/bank tidak mencukupi. Dibutuhkan: Rp ${totalPengembalian.toLocaleString('id-ID')}, Tersedia: Rp ${totalAvailableBalance.toLocaleString('id-ID')} (Kas: Rp ${kasBalance.toLocaleString('id-ID')}, Bank: Rp ${bankBalance.toLocaleString('id-ID')}). Pastikan dana tersedia sebelum melakukan pengembalian.`,
                        field: 'kas',
                        severity: 'warning',
                        data: {
                            required: totalPengembalian,
                            available: totalAvailableBalance,
                            kasBalance: kasBalance,
                            bankBalance: bankBalance,
                            shortfall: totalPengembalian - totalAvailableBalance
                        }
                    });
                }
            }
            
            // Warning if totalPengembalian is negative (anggota owes money)
            if (totalPengembalian < 0) {
                validationWarnings.push({
                    code: 'NEGATIVE_PENGEMBALIAN',
                    message: `Total pengembalian negatif (Rp ${totalPengembalian.toLocaleString('id-ID')}). Anggota masih memiliki kewajiban.`,
                    field: 'totalPengembalian',
                    severity: 'warning',
                    data: {
                        totalPengembalian: totalPengembalian,
                        kewajibanLain: calculation.data.kewajibanLain
                    }
                });
            }
        }
        
        // Validation 3: Check for payment method (Requirement 6.3)
        // Note: undefined means parameter not provided (optional), null means explicitly provided as null (invalid)
        if (metodePembayaran !== undefined) {
            if (!metodePembayaran || typeof metodePembayaran !== 'string' || metodePembayaran.trim() === '') {
                validationErrors.push({
                    code: 'PAYMENT_METHOD_REQUIRED',
                    message: 'Metode pembayaran harus dipilih',
                    field: 'metodePembayaran',
                    severity: 'error',
                    data: null
                });
            } else {
                // Validate payment method value
                const validMethods = ['Kas', 'Transfer Bank'];
                if (!validMethods.includes(metodePembayaran)) {
                    validationErrors.push({
                        code: 'INVALID_PAYMENT_METHOD',
                        message: `Metode pembayaran tidak valid. Pilihan: ${validMethods.join(', ')}`,
                        field: 'metodePembayaran',
                        severity: 'error',
                        data: {
                            provided: metodePembayaran,
                            validOptions: validMethods
                        }
                    });
                }
            }
        }
        
        // Check if validation passed
        const hasErrors = validationErrors.length > 0;
        
        if (hasErrors) {
            // Validation failed (Requirement 6.4)
            return {
                success: false,
                valid: false,
                errors: validationErrors,
                warnings: validationWarnings,
                message: `Validasi gagal: ${validationErrors.length} error ditemukan`,
                timestamp: new Date().toISOString()
            };
        } else {
            // Validation passed (Requirement 6.5)
            return {
                success: true,
                valid: true,
                errors: [],
                warnings: validationWarnings,
                message: validationWarnings.length > 0 
                    ? `Validasi berhasil dengan ${validationWarnings.length} peringatan`
                    : 'Validasi berhasil, pengembalian dapat diproses',
                timestamp: new Date().toISOString()
            };
        }
        
    } catch (error) {
        console.error('Error in validatePengembalian:', error);
        return {
            success: false,
            valid: false,
            errors: [{
                code: 'SYSTEM_ERROR',
                message: error.message,
                field: null,
                severity: 'error',
                data: null
            }],
            warnings: [],
            message: 'Terjadi kesalahan sistem saat validasi',
            timestamp: new Date().toISOString()
        };
    }
}

/**
 * Process pengembalian simpanan
 * @param {string} anggotaId - ID of the anggota
 * @param {string} metodePembayaran - Payment method (Kas/Transfer Bank)
 * @param {string} tanggalPembayaran - Payment date in ISO format
 * @param {string} keterangan - Optional notes
 * @returns {object} Processing result
 */
function processPengembalian(anggotaId, metodePembayaran, tanggalPembayaran, keterangan = '') {
    try {
        // Create snapshot for rollback
        const snapshot = createSnapshot();
        
        try {
            // Step 1: Validate input parameters
            if (!anggotaId || typeof anggotaId !== 'string') {
                return {
                    success: false,
                    error: {
                        code: 'INVALID_PARAMETER',
                        message: 'ID anggota tidak valid',
                        timestamp: new Date().toISOString()
                    }
                };
            }
            
            if (!metodePembayaran || typeof metodePembayaran !== 'string') {
                return {
                    success: false,
                    error: {
                        code: 'INVALID_PARAMETER',
                        message: 'Metode pembayaran tidak valid',
                        timestamp: new Date().toISOString()
                    }
                };
            }
            
            if (!tanggalPembayaran || typeof tanggalPembayaran !== 'string') {
                return {
                    success: false,
                    error: {
                        code: 'INVALID_PARAMETER',
                        message: 'Tanggal pembayaran tidak valid',
                        timestamp: new Date().toISOString()
                    }
                };
            }
            
            // Step 2: Run validation checks
            const validation = validatePengembalian(anggotaId, metodePembayaran);
            if (!validation.valid) {
                return {
                    success: false,
                    error: {
                        code: 'VALIDATION_FAILED',
                        message: 'Validasi gagal',
                        details: validation.errors,
                        timestamp: new Date().toISOString()
                    }
                };
            }
            
            // Step 3: Get anggota and calculation data
            const anggota = getAnggotaById(anggotaId);
            if (!anggota) {
                return {
                    success: false,
                    error: {
                        code: 'ANGGOTA_NOT_FOUND',
                        message: 'Anggota tidak ditemukan',
                        timestamp: new Date().toISOString()
                    }
                };
            }
            
            const calculation = calculatePengembalian(anggotaId);
            if (!calculation.success) {
                return {
                    success: false,
                    error: {
                        code: 'CALCULATION_FAILED',
                        message: 'Gagal menghitung pengembalian',
                        details: calculation.error,
                        timestamp: new Date().toISOString()
                    }
                };
            }
            
            const { simpananPokok, simpananWajib, totalPengembalian } = calculation.data;
            
            // Step 4: Create pengembalian record
            const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
            const pengembalianId = generateId();
            const nomorReferensi = `PGM-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${pengembalianId.substring(0, 8)}`;
            
            const pengembalianRecord = {
                id: pengembalianId,
                anggotaId: anggotaId,
                anggotaNama: anggota.nama,
                anggotaNIK: anggota.nik,
                simpananPokok: simpananPokok,
                simpananWajib: simpananWajib,
                totalSimpanan: simpananPokok + simpananWajib,
                kewajibanLain: calculation.data.kewajibanLain,
                keterangan: keterangan || '',
                totalPengembalian: totalPengembalian,
                metodePembayaran: metodePembayaran,
                tanggalPembayaran: tanggalPembayaran,
                nomorReferensi: nomorReferensi,
                status: 'Diproses',
                createdAt: new Date().toISOString(),
                createdBy: currentUser.id || 'system',
                processedAt: null,
                processedBy: null,
                jurnalId: null
            };
            
            // Step 5: Generate journal entries
            const jurnalId = generateId();
            const jurnalEntries = [];
            
            // Determine kas/bank account based on payment method
            const kasAccount = metodePembayaran === 'Kas' ? '1-1000' : '1-1100';
            
            // Journal entry for Simpanan Pokok
            if (simpananPokok > 0) {
                jurnalEntries.push({
                    akun: '2-1100', // Simpanan Pokok (Kewajiban)
                    debit: simpananPokok,
                    kredit: 0
                });
            }
            
            // Journal entry for Simpanan Wajib
            if (simpananWajib > 0) {
                jurnalEntries.push({
                    akun: '2-1200', // Simpanan Wajib (Kewajiban)
                    debit: simpananWajib,
                    kredit: 0
                });
            }
            
            // Journal entry for Kas/Bank (total pengembalian)
            if (totalPengembalian > 0) {
                jurnalEntries.push({
                    akun: kasAccount, // Kas or Bank
                    debit: 0,
                    kredit: totalPengembalian
                });
            }
            
            // Validate double-entry balance
            const totalDebit = jurnalEntries.reduce((sum, e) => sum + e.debit, 0);
            const totalKredit = jurnalEntries.reduce((sum, e) => sum + e.kredit, 0);
            
            if (Math.abs(totalDebit - totalKredit) > 0.01) {
                throw new Error(`Journal entries tidak seimbang: Debit=${totalDebit}, Kredit=${totalKredit}`);
            }
            
            // Step 6: Save journal entries using addJurnal
            if (typeof addJurnal === 'function') {
                addJurnal(
                    `Pengembalian Simpanan - ${anggota.nama} (${nomorReferensi})`,
                    jurnalEntries,
                    tanggalPembayaran
                );
            } else {
                // Fallback: manual journal creation
                const jurnal = JSON.parse(localStorage.getItem('jurnal') || '[]');
                jurnal.push({
                    id: jurnalId,
                    tanggal: tanggalPembayaran,
                    keterangan: `Pengembalian Simpanan - ${anggota.nama} (${nomorReferensi})`,
                    entries: jurnalEntries
                });
                localStorage.setItem('jurnal', JSON.stringify(jurnal));
                
                // Update COA balances manually
                const coa = JSON.parse(localStorage.getItem('coa') || '[]');
                jurnalEntries.forEach(entry => {
                    const akun = coa.find(c => c.kode === entry.akun);
                    if (akun) {
                        if (akun.tipe === 'Aset' || akun.tipe === 'Beban') {
                            akun.saldo += entry.debit - entry.kredit;
                        } else {
                            akun.saldo += entry.kredit - entry.debit;
                        }
                    }
                });
                localStorage.setItem('coa', JSON.stringify(coa));
            }
            
            // Step 7: Update simpanan balances to zero
            // Zero out simpanan pokok
            const simpananPokokList = JSON.parse(localStorage.getItem('simpananPokok') || '[]');
            const updatedSimpananPokok = simpananPokokList.map(s => {
                if (s.anggotaId === anggotaId) {
                    return {
                        ...s,
                        saldoSebelumPengembalian: s.jumlah, // Save historical data
                        jumlah: 0, // Zero out balance
                        statusPengembalian: 'Dikembalikan',
                        pengembalianId: pengembalianId,
                        tanggalPengembalian: tanggalPembayaran
                    };
                }
                return s;
            });
            localStorage.setItem('simpananPokok', JSON.stringify(updatedSimpananPokok));
            
            // Zero out simpanan wajib
            const simpananWajibList = JSON.parse(localStorage.getItem('simpananWajib') || '[]');
            const updatedSimpananWajib = simpananWajibList.map(s => {
                if (s.anggotaId === anggotaId) {
                    return {
                        ...s,
                        saldoSebelumPengembalian: s.jumlah,
                        jumlah: 0,
                        statusPengembalian: 'Dikembalikan',
                        pengembalianId: pengembalianId,
                        tanggalPengembalian: tanggalPembayaran
                    };
                }
                return s;
            });
            localStorage.setItem('simpananWajib', JSON.stringify(updatedSimpananWajib));
            
            // Zero out simpanan sukarela (if any)
            const simpananSukarelaList = JSON.parse(localStorage.getItem('simpananSukarela') || '[]');
            const updatedSimpananSukarela = simpananSukarelaList.map(s => {
                if (s.anggotaId === anggotaId) {
                    return {
                        ...s,
                        saldoSebelumPengembalian: s.jumlah,
                        jumlah: 0,
                        statusPengembalian: 'Dikembalikan',
                        pengembalianId: pengembalianId,
                        tanggalPengembalian: tanggalPembayaran
                    };
                }
                return s;
            });
            localStorage.setItem('simpananSukarela', JSON.stringify(updatedSimpananSukarela));
            
            // Step 8: Update pengembalian status to "Selesai"
            pengembalianRecord.status = 'Selesai';
            pengembalianRecord.processedAt = new Date().toISOString();
            pengembalianRecord.processedBy = currentUser.id || 'system';
            pengembalianRecord.jurnalId = jurnalId;
            
            // Save pengembalian record
            const pengembalianList = JSON.parse(localStorage.getItem('pengembalian') || '[]');
            pengembalianList.push(pengembalianRecord);
            localStorage.setItem('pengembalian', JSON.stringify(pengembalianList));
            
            // Step 9: Update anggota status
            const anggotaList = JSON.parse(localStorage.getItem('anggota') || '[]');
            const anggotaIndex = anggotaList.findIndex(a => a.id === anggotaId);
            if (anggotaIndex !== -1) {
                anggotaList[anggotaIndex].pengembalianStatus = 'Selesai';
                anggotaList[anggotaIndex].pengembalianId = pengembalianId;
                localStorage.setItem('anggota', JSON.stringify(anggotaList));
            }
            
            // Step 10: Create audit log entry
            const auditLog = {
                id: generateId(),
                timestamp: new Date().toISOString(),
                userId: currentUser.id || 'system',
                userName: currentUser.username || 'System',
                action: 'PROSES_PENGEMBALIAN',
                anggotaId: anggotaId,
                anggotaNama: anggota.nama,
                details: {
                    pengembalianId: pengembalianId,
                    nomorReferensi: nomorReferensi,
                    simpananPokok: simpananPokok,
                    simpananWajib: simpananWajib,
                    totalPengembalian: totalPengembalian,
                    metodePembayaran: metodePembayaran,
                    tanggalPembayaran: tanggalPembayaran,
                    jurnalId: jurnalId
                },
                ipAddress: null
            };
            
            saveAuditLog(auditLog);
            
            // Invalidate cache after successful processing (Task 15.1)
            if (typeof AnggotaKeluarCache !== 'undefined') {
                AnggotaKeluarCache.invalidateAnggota(anggotaId);
                AnggotaKeluarCache.invalidateSimpanan();
                AnggotaKeluarCache.invalidateReports();
            }
            
            // Return success
            return {
                success: true,
                data: {
                    pengembalianId: pengembalianId,
                    nomorReferensi: nomorReferensi,
                    anggotaId: anggotaId,
                    anggotaNama: anggota.nama,
                    simpananPokok: simpananPokok,
                    simpananWajib: simpananWajib,
                    totalPengembalian: totalPengembalian,
                    metodePembayaran: metodePembayaran,
                    tanggalPembayaran: tanggalPembayaran,
                    jurnalId: jurnalId,
                    status: 'Selesai'
                },
                message: `Pengembalian simpanan berhasil diproses untuk ${anggota.nama}`
            };
            
        } catch (innerError) {
            // Rollback on error
            console.error('Error during pengembalian processing, rolling back:', innerError);
            restoreSnapshot(snapshot);
            
            // Log failed pengembalian to audit log (Requirement 8.5)
            try {
                const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
                const anggota = getAnggotaById(anggotaId);
                
                const failedAuditLog = {
                    id: generateId(),
                    timestamp: new Date().toISOString(),
                    userId: currentUser.id || 'system',
                    userName: currentUser.username || 'System',
                    action: 'PROSES_PENGEMBALIAN_FAILED',
                    anggotaId: anggotaId,
                    anggotaNama: anggota ? anggota.nama : 'Unknown',
                    details: {
                        error: innerError.message,
                        errorStack: innerError.stack,
                        metodePembayaran: metodePembayaran,
                        tanggalPembayaran: tanggalPembayaran,
                        rollbackPerformed: true
                    },
                    ipAddress: null,
                    severity: 'ERROR'
                };
                
                saveAuditLog(failedAuditLog);
            } catch (auditError) {
                console.error('Failed to log audit entry for failed pengembalian:', auditError);
            }
            
            throw innerError;
        }
        
    } catch (error) {
        console.error('Error in processPengembalian:', error);
        
        // Log to audit if not already logged
        try {
            const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
            const anggota = getAnggotaById(anggotaId);
            
            const failedAuditLog = {
                id: generateId(),
                timestamp: new Date().toISOString(),
                userId: currentUser.id || 'system',
                userName: currentUser.username || 'System',
                action: 'PROSES_PENGEMBALIAN_ERROR',
                anggotaId: anggotaId,
                anggotaNama: anggota ? anggota.nama : 'Unknown',
                details: {
                    error: error.message,
                    errorCode: error.code || 'SYSTEM_ERROR',
                    metodePembayaran: metodePembayaran,
                    tanggalPembayaran: tanggalPembayaran
                },
                ipAddress: null,
                severity: 'ERROR'
            };
            
            saveAuditLog(failedAuditLog);
        } catch (auditError) {
            console.error('Failed to log audit entry:', auditError);
        }
        
        return {
            success: false,
            error: {
                code: 'SYSTEM_ERROR',
                message: error.message,
                timestamp: new Date().toISOString()
            }
        };
    }
}

/**
 * Create snapshot of current state for rollback
 * @returns {object} Snapshot of localStorage state
 */
function createSnapshot() {
    return {
        anggota: localStorage.getItem('anggota'),
        pengembalian: localStorage.getItem('pengembalian'),
        jurnal: localStorage.getItem('jurnal'),
        coa: localStorage.getItem('coa'),
        auditLogsAnggotaKeluar: localStorage.getItem('auditLogsAnggotaKeluar'),
        // NEW: Include simpanan data for rollback
        simpananPokok: localStorage.getItem('simpananPokok'),
        simpananWajib: localStorage.getItem('simpananWajib'),
        simpananSukarela: localStorage.getItem('simpananSukarela')
    };
}

/**
 * Restore snapshot to rollback changes
 * @param {object} snapshot - Snapshot to restore
 */
function restoreSnapshot(snapshot) {
    if (snapshot.anggota) localStorage.setItem('anggota', snapshot.anggota);
    if (snapshot.pengembalian) localStorage.setItem('pengembalian', snapshot.pengembalian);
    if (snapshot.jurnal) localStorage.setItem('jurnal', snapshot.jurnal);
    if (snapshot.coa) localStorage.setItem('coa', snapshot.coa);
    if (snapshot.auditLogsAnggotaKeluar) localStorage.setItem('auditLogsAnggotaKeluar', snapshot.auditLogsAnggotaKeluar);
    // NEW: Restore simpanan data on rollback
    if (snapshot.simpananPokok) localStorage.setItem('simpananPokok', snapshot.simpananPokok);
    if (snapshot.simpananWajib) localStorage.setItem('simpananWajib', snapshot.simpananWajib);
    if (snapshot.simpananSukarela) localStorage.setItem('simpananSukarela', snapshot.simpananSukarela);
}

/**
 * Cancel anggota keluar status
 * @param {string} anggotaId - ID of the anggota
 * @returns {object} Cancellation result
 */
function cancelStatusKeluar(anggotaId) {
    try {
        // Step 1: Validate input parameter
        if (!anggotaId || typeof anggotaId !== 'string') {
            return {
                success: false,
                error: {
                    code: 'INVALID_PARAMETER',
                    message: 'ID anggota tidak valid',
                    timestamp: new Date().toISOString()
                }
            };
        }
        
        // Step 2: Get anggota data
        const anggota = getAnggotaById(anggotaId);
        
        if (!anggota) {
            return {
                success: false,
                error: {
                    code: 'ANGGOTA_NOT_FOUND',
                    message: 'Anggota tidak ditemukan',
                    timestamp: new Date().toISOString()
                }
            };
        }
        
        // Step 3: Validate anggota has status "Keluar" (Requirement 8.1)
        if (anggota.statusKeanggotaan !== 'Keluar') {
            return {
                success: false,
                error: {
                    code: 'ANGGOTA_NOT_KELUAR',
                    message: 'Anggota tidak berstatus keluar',
                    timestamp: new Date().toISOString()
                }
            };
        }
        
        // Step 4: Validate pengembalian has not been processed (Requirement 8.4)
        if (anggota.pengembalianStatus === 'Selesai') {
            return {
                success: false,
                error: {
                    code: 'PENGEMBALIAN_ALREADY_PROCESSED',
                    message: 'Pembatalan tidak dapat dilakukan karena pengembalian sudah diproses',
                    timestamp: new Date().toISOString()
                }
            };
        }
        
        // Step 5: Get current user for audit log
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        
        // Step 6: Store original data for audit log
        const originalData = {
            statusKeanggotaan: anggota.statusKeanggotaan,
            tanggalKeluar: anggota.tanggalKeluar,
            alasanKeluar: anggota.alasanKeluar,
            pengembalianStatus: anggota.pengembalianStatus,
            pengembalianId: anggota.pengembalianId
        };
        
        // Step 7: Restore status to "Aktif" and clear keluar-related fields (Requirement 8.3)
        const updateSuccess = updateAnggotaStatus(anggotaId, 'Aktif', {
            tanggalKeluar: null,
            alasanKeluar: null,
            pengembalianStatus: null,
            pengembalianId: null
        });
        
        if (!updateSuccess) {
            return {
                success: false,
                error: {
                    code: 'UPDATE_FAILED',
                    message: 'Gagal mengupdate status anggota',
                    timestamp: new Date().toISOString()
                }
            };
        }
        
        // Step 8: Create audit log entry (Requirement 8.5)
        const auditLog = {
            id: generateId(),
            timestamp: new Date().toISOString(),
            userId: currentUser.id || 'system',
            userName: currentUser.username || 'System',
            action: 'CANCEL_KELUAR',
            anggotaId: anggotaId,
            anggotaNama: anggota.nama,
            details: {
                originalData: originalData,
                restoredStatus: 'Aktif'
            },
            ipAddress: null
        };
        
        saveAuditLog(auditLog);
        
        // Invalidate cache after cancellation (Task 15.1)
        if (typeof AnggotaKeluarCache !== 'undefined') {
            AnggotaKeluarCache.invalidateAnggota(anggotaId);
            AnggotaKeluarCache.invalidateReports();
        }
        
        // Step 9: Return success
        return {
            success: true,
            data: {
                anggotaId: anggotaId,
                anggotaNama: anggota.nama,
                statusKeanggotaan: 'Aktif',
                previousStatus: 'Keluar'
            },
            message: `Status keluar untuk anggota ${anggota.nama} berhasil dibatalkan`
        };
        
    } catch (error) {
        console.error('Error in cancelStatusKeluar:', error);
        return {
            success: false,
            error: {
                code: 'SYSTEM_ERROR',
                message: error.message,
                timestamp: new Date().toISOString()
            }
        };
    }
}

/**
 * Generate bukti pengembalian document
 * @param {string} pengembalianId - ID of the pengembalian record
 * @returns {object} Document generation result
 */
function generateBuktiPengembalian(pengembalianId) {
    try {
        // Validate input
        if (!pengembalianId || typeof pengembalianId !== 'string') {
            return {
                success: false,
                error: {
                    code: 'INVALID_PARAMETER',
                    message: 'ID pengembalian tidak valid',
                    timestamp: new Date().toISOString()
                }
            };
        }
        
        // Get pengembalian record
        const pengembalianList = JSON.parse(localStorage.getItem('pengembalian') || '[]');
        const pengembalian = pengembalianList.find(p => p.id === pengembalianId);
        
        if (!pengembalian) {
            return {
                success: false,
                error: {
                    code: 'PENGEMBALIAN_NOT_FOUND',
                    message: 'Data pengembalian tidak ditemukan',
                    timestamp: new Date().toISOString()
                }
            };
        }
        
        // Get anggota data
        const anggota = getAnggotaById(pengembalian.anggotaId);
        if (!anggota) {
            return {
                success: false,
                error: {
                    code: 'ANGGOTA_NOT_FOUND',
                    message: 'Data anggota tidak ditemukan',
                    timestamp: new Date().toISOString()
                }
            };
        }
        
        // Get system settings for koperasi info
        const systemSettings = JSON.parse(localStorage.getItem('systemSettings') || '{}');
        const namaKoperasi = systemSettings.namaKoperasi || 'KOPERASI';
        const alamatKoperasi = systemSettings.alamatKoperasi || '';
        const teleponKoperasi = systemSettings.teleponKoperasi || '';
        
        // Format dates
        const tanggalCetak = new Date().toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
        
        const tanggalKeluar = anggota.tanggalKeluar ? new Date(anggota.tanggalKeluar).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        }) : '-';
        
        const tanggalPembayaran = new Date(pengembalian.tanggalPembayaran).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
        
        // Generate HTML document
        const buktiHTML = `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bukti Pengembalian Simpanan - ${pengembalian.nomorReferensi}</title>
    <style>
        @media print {
            @page {
                size: A4;
                margin: 2cm;
            }
            body {
                margin: 0;
                padding: 0;
            }
            .no-print {
                display: none !important;
            }
        }
        
        body {
            font-family: 'Arial', sans-serif;
            font-size: 12pt;
            line-height: 1.6;
            color: #333;
            max-width: 21cm;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            text-align: center;
            border-bottom: 3px solid #333;
            padding-bottom: 15px;
            margin-bottom: 30px;
        }
        
        .header h1 {
            margin: 0;
            font-size: 20pt;
            font-weight: bold;
            text-transform: uppercase;
        }
        
        .header p {
            margin: 5px 0;
            font-size: 10pt;
        }
        
        .title {
            text-align: center;
            margin: 30px 0;
        }
        
        .title h2 {
            margin: 0;
            font-size: 16pt;
            font-weight: bold;
            text-decoration: underline;
        }
        
        .reference {
            text-align: center;
            margin-bottom: 30px;
            font-size: 11pt;
        }
        
        .content {
            margin: 20px 0;
        }
        
        .section {
            margin: 20px 0;
        }
        
        .section-title {
            font-weight: bold;
            margin-bottom: 10px;
            font-size: 13pt;
            border-bottom: 1px solid #666;
            padding-bottom: 5px;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0;
        }
        
        table.info td {
            padding: 5px;
            vertical-align: top;
        }
        
        table.info td:first-child {
            width: 200px;
            font-weight: bold;
        }
        
        table.rincian {
            border: 1px solid #333;
        }
        
        table.rincian th,
        table.rincian td {
            border: 1px solid #333;
            padding: 8px;
            text-align: left;
        }
        
        table.rincian th {
            background-color: #f0f0f0;
            font-weight: bold;
        }
        
        table.rincian td.amount {
            text-align: right;
        }
        
        table.rincian tr.total {
            font-weight: bold;
            background-color: #f9f9f9;
        }
        
        .signatures {
            margin-top: 50px;
            display: flex;
            justify-content: space-between;
        }
        
        .signature-box {
            width: 45%;
            text-align: center;
        }
        
        .signature-line {
            margin-top: 80px;
            border-top: 1px solid #333;
            padding-top: 5px;
        }
        
        .footer {
            margin-top: 30px;
            padding-top: 15px;
            border-top: 1px solid #ccc;
            font-size: 9pt;
            color: #666;
            text-align: center;
        }
        
        .print-button {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 10px 20px;
            background-color: #007bff;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        }
        
        .print-button:hover {
            background-color: #0056b3;
        }
    </style>
</head>
<body>
    <button class="print-button no-print" onclick="window.print()">
        🖨️ Cetak Dokumen
    </button>
    
    <!-- Header Koperasi -->
    <div class="header">
        <h1>${namaKoperasi}</h1>
        ${alamatKoperasi ? `<p>${alamatKoperasi}</p>` : ''}
        ${teleponKoperasi ? `<p>Telp: ${teleponKoperasi}</p>` : ''}
    </div>
    
    <!-- Title -->
    <div class="title">
        <h2>BUKTI PENGEMBALIAN SIMPANAN</h2>
    </div>
    
    <!-- Reference Number -->
    <div class="reference">
        <strong>No. Referensi: ${pengembalian.nomorReferensi}</strong>
    </div>
    
    <!-- Content -->
    <div class="content">
        <!-- Informasi Anggota -->
        <div class="section">
            <div class="section-title">Informasi Anggota</div>
            <table class="info">
                <tr>
                    <td>Nomor Induk Keanggotaan (NIK)</td>
                    <td>: ${pengembalian.anggotaNIK}</td>
                </tr>
                <tr>
                    <td>Nama Lengkap</td>
                    <td>: ${pengembalian.anggotaNama}</td>
                </tr>
                <tr>
                    <td>Tanggal Keluar</td>
                    <td>: ${tanggalKeluar}</td>
                </tr>
                ${anggota.alasanKeluar ? `
                <tr>
                    <td>Alasan Keluar</td>
                    <td>: ${anggota.alasanKeluar}</td>
                </tr>
                ` : ''}
            </table>
        </div>
        
        <!-- Rincian Pengembalian -->
        <div class="section">
            <div class="section-title">Rincian Pengembalian Simpanan</div>
            <table class="rincian">
                <thead>
                    <tr>
                        <th>Jenis Simpanan</th>
                        <th style="text-align: right;">Jumlah (Rp)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Simpanan Pokok</td>
                        <td class="amount">${pengembalian.simpananPokok.toLocaleString('id-ID')}</td>
                    </tr>
                    <tr>
                        <td>Simpanan Wajib</td>
                        <td class="amount">${pengembalian.simpananWajib.toLocaleString('id-ID')}</td>
                    </tr>
                    <tr class="total">
                        <td>Total Simpanan</td>
                        <td class="amount">${pengembalian.totalSimpanan.toLocaleString('id-ID')}</td>
                    </tr>
                    ${pengembalian.kewajibanLain > 0 ? `
                    <tr>
                        <td>Kewajiban Lain</td>
                        <td class="amount">(${pengembalian.kewajibanLain.toLocaleString('id-ID')})</td>
                    </tr>
                    ` : ''}
                    <tr class="total" style="background-color: #e8f5e9;">
                        <td><strong>TOTAL PENGEMBALIAN</strong></td>
                        <td class="amount"><strong>${pengembalian.totalPengembalian.toLocaleString('id-ID')}</strong></td>
                    </tr>
                </tbody>
            </table>
        </div>
        
        <!-- Detail Pembayaran -->
        <div class="section">
            <div class="section-title">Detail Pembayaran</div>
            <table class="info">
                <tr>
                    <td>Metode Pembayaran</td>
                    <td>: ${pengembalian.metodePembayaran}</td>
                </tr>
                <tr>
                    <td>Tanggal Pembayaran</td>
                    <td>: ${tanggalPembayaran}</td>
                </tr>
                ${pengembalian.keterangan ? `
                <tr>
                    <td>Keterangan</td>
                    <td>: ${pengembalian.keterangan}</td>
                </tr>
                ` : ''}
            </table>
        </div>
        
        <!-- Tanda Tangan -->
        <div class="signatures">
            <div class="signature-box">
                <p>Penerima,</p>
                <div class="signature-line">
                    ${pengembalian.anggotaNama}
                </div>
            </div>
            <div class="signature-box">
                <p>Petugas Koperasi,</p>
                <div class="signature-line">
                    (&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;)
                </div>
            </div>
        </div>
    </div>
    
    <!-- Footer -->
    <div class="footer">
        <p>Dokumen ini dicetak pada: ${tanggalCetak}</p>
        <p>Referensi: ${pengembalian.nomorReferensi} | Status: ${pengembalian.status}</p>
        <p><em>Dokumen ini sah tanpa tanda tangan basah</em></p>
    </div>
</body>
</html>
        `;
        
        // Return success with HTML
        return {
            success: true,
            data: {
                pengembalianId: pengembalianId,
                nomorReferensi: pengembalian.nomorReferensi,
                anggotaNama: pengembalian.anggotaNama,
                html: buktiHTML
            },
            message: 'Bukti pengembalian berhasil dibuat'
        };
        
    } catch (error) {
        console.error('Error in generateBuktiPengembalian:', error);
        return {
            success: false,
            error: {
                code: 'SYSTEM_ERROR',
                message: error.message,
                timestamp: new Date().toISOString()
            }
        };
    }
}

// ===== Helper Functions =====

/**
 * Get total simpanan pokok for an anggota
 * @param {string} anggotaId - ID of the anggota
 * @returns {number} Total simpanan pokok
 */
function getTotalSimpananPokok(anggotaId) {
    try {
        if (!anggotaId || typeof anggotaId !== 'string') {
            return 0;
        }
        
        const simpananPokok = JSON.parse(localStorage.getItem('simpananPokok') || '[]');
        
        // Sum all simpanan pokok for this anggota (only jumlah > 0)
        const total = simpananPokok
            .filter(s => s.anggotaId === anggotaId && s.jumlah > 0)
            .reduce((sum, s) => sum + (parseFloat(s.jumlah) || 0), 0);
        
        return total;
    } catch (error) {
        console.error('Error in getTotalSimpananPokok:', error);
        return 0;
    }
}

/**
 * Get total simpanan wajib for an anggota
 * @param {string} anggotaId - ID of the anggota
 * @returns {number} Total simpanan wajib
 */
function getTotalSimpananWajib(anggotaId) {
    try {
        if (!anggotaId || typeof anggotaId !== 'string') {
            return 0;
        }
        
        const simpananWajib = JSON.parse(localStorage.getItem('simpananWajib') || '[]');
        
        // Sum all simpanan wajib for this anggota (only jumlah > 0)
        const total = simpananWajib
            .filter(s => s.anggotaId === anggotaId && s.jumlah > 0)
            .reduce((sum, s) => sum + (parseFloat(s.jumlah) || 0), 0);
        
        return total;
    } catch (error) {
        console.error('Error in getTotalSimpananWajib:', error);
        return 0;
    }
}

/**
 * Get active pinjaman for an anggota
 * @param {string} anggotaId - ID of the anggota
 * @returns {array} Array of active pinjaman records
 */
function getPinjamanAktif(anggotaId) {
    try {
        if (!anggotaId || typeof anggotaId !== 'string') {
            return [];
        }
        
        const pinjaman = JSON.parse(localStorage.getItem('pinjaman') || '[]');
        
        // Filter pinjaman that are not yet fully paid (status != 'lunas')
        const pinjamanAktif = pinjaman.filter(p => 
            p.anggotaId === anggotaId && 
            p.status && 
            p.status.toLowerCase() !== 'lunas'
        );
        
        return pinjamanAktif;
    } catch (error) {
        console.error('Error in getPinjamanAktif:', error);
        return [];
    }
}

/**
 * Get other obligations for an anggota
 * @param {string} anggotaId - ID of the anggota
 * @returns {number} Total kewajiban lain
 */
function getKewajibanLain(anggotaId) {
    try {
        if (!anggotaId || typeof anggotaId !== 'string') {
            return 0;
        }
        
        // For now, kewajiban lain is 0
        // In the future, this could include:
        // - Outstanding hutang from POS
        // - Other obligations
        // - Penalties or fees
        
        // Check if there's outstanding hutang from POS
        let totalHutang = 0;
        
        // Try to use hitungSaldoHutang if available
        if (typeof hitungSaldoHutang === 'function') {
            totalHutang = hitungSaldoHutang(anggotaId);
        } else {
            // Fallback: calculate manually
            const penjualan = JSON.parse(localStorage.getItem('penjualan') || '[]');
            const pembayaran = JSON.parse(localStorage.getItem('pembayaranHutangPiutang') || '[]');
            
            // Total kredit dari POS
            const totalKredit = penjualan
                .filter(p => p.anggotaId === anggotaId && p.status === 'kredit')
                .reduce((sum, p) => sum + (parseFloat(p.total) || 0), 0);
            
            // Total pembayaran hutang
            const totalBayar = pembayaran
                .filter(p => p.anggotaId === anggotaId && p.jenis === 'hutang' && p.status === 'selesai')
                .reduce((sum, p) => sum + (parseFloat(p.jumlah) || 0), 0);
            
            totalHutang = totalKredit - totalBayar;
        }
        
        return totalHutang > 0 ? totalHutang : 0;
    } catch (error) {
        console.error('Error in getKewajibanLain:', error);
        return 0;
    }
}

/**
 * Get laporan anggota keluar with optional date range filter
 * Task 15.1: Uses cached report data for better performance
 * @param {string} startDate - Optional start date (YYYY-MM-DD)
 * @param {string} endDate - Optional end date (YYYY-MM-DD)
 * @returns {object} Laporan result with data array
 */
function getLaporanAnggotaKeluar(startDate = null, endDate = null) {
    try {
        // Try to use cached report if available (Task 15.1)
        if (typeof AnggotaKeluarCache !== 'undefined') {
            const cachedReport = AnggotaKeluarCache.getAnggotaKeluarReportCached(startDate, endDate);
            if (cachedReport && cachedReport.length >= 0) {
                return {
                    success: true,
                    data: cachedReport,
                    summary: {
                        total: cachedReport.length,
                        pending: cachedReport.filter(a => a.pengembalianStatus === 'Pending').length,
                        selesai: cachedReport.filter(a => a.pengembalianStatus === 'Selesai').length,
                        totalPengembalian: cachedReport.reduce((sum, a) => sum + (a.totalPengembalian || 0), 0)
                    },
                    filter: {
                        startDate: startDate,
                        endDate: endDate
                    },
                    message: `Laporan berhasil dibuat dengan ${cachedReport.length} data (cached)`,
                    cached: true
                };
            }
        }
        
        // Fallback to non-cached version
        // Get all anggota keluar
        const anggotaKeluar = getAnggotaKeluar();
        
        // Filter by date range if provided (Requirement 5.4, Property 9)
        let filteredAnggota = anggotaKeluar;
        
        if (startDate || endDate) {
            filteredAnggota = anggotaKeluar.filter(anggota => {
                if (!anggota.tanggalKeluar) return false;
                
                const tanggalKeluar = new Date(anggota.tanggalKeluar);
                tanggalKeluar.setHours(0, 0, 0, 0);
                
                // Check start date (inclusive)
                if (startDate) {
                    const start = new Date(startDate);
                    start.setHours(0, 0, 0, 0);
                    if (tanggalKeluar < start) return false;
                }
                
                // Check end date (inclusive)
                if (endDate) {
                    const end = new Date(endDate);
                    end.setHours(0, 0, 0, 0);
                    if (tanggalKeluar > end) return false;
                }
                
                return true;
            });
        }
        
        // Enrich with pengembalian data
        const enrichedData = filteredAnggota.map(anggota => {
            const pengembalianList = getPengembalianByAnggota(anggota.id);
            const pengembalian = pengembalianList.length > 0 ? pengembalianList[pengembalianList.length - 1] : null;
            
            // Calculate totals if pengembalian not yet processed
            let simpananPokok = 0;
            let simpananWajib = 0;
            let kewajibanLain = 0;
            let totalPengembalian = 0;
            
            if (pengembalian) {
                simpananPokok = pengembalian.simpananPokok || 0;
                simpananWajib = pengembalian.simpananWajib || 0;
                kewajibanLain = pengembalian.kewajibanLain || 0;
                totalPengembalian = pengembalian.totalPengembalian || 0;
            } else {
                const calculation = calculatePengembalian(anggota.id);
                if (calculation.success) {
                    simpananPokok = calculation.data.simpananPokok;
                    simpananWajib = calculation.data.simpananWajib;
                    kewajibanLain = calculation.data.kewajibanLain;
                    totalPengembalian = calculation.data.totalPengembalian;
                }
            }
            
            return {
                nik: anggota.nik,
                nama: anggota.nama,
                departemen: anggota.departemen || '',
                tipeAnggota: anggota.tipeAnggota || 'Umum',
                tanggalKeluar: anggota.tanggalKeluar,
                alasanKeluar: anggota.alasanKeluar || '',
                statusPengembalian: anggota.pengembalianStatus || 'Pending',
                simpananPokok: simpananPokok,
                simpananWajib: simpananWajib,
                kewajibanLain: kewajibanLain,
                totalPengembalian: totalPengembalian,
                metodePembayaran: pengembalian ? pengembalian.metodePembayaran : '',
                tanggalPembayaran: pengembalian ? pengembalian.tanggalPembayaran : '',
                nomorReferensi: pengembalian ? pengembalian.nomorReferensi : ''
            };
        });
        
        return {
            success: true,
            data: enrichedData,
            summary: {
                total: enrichedData.length,
                pending: enrichedData.filter(a => a.statusPengembalian === 'Pending').length,
                selesai: enrichedData.filter(a => a.statusPengembalian === 'Selesai').length,
                totalPengembalian: enrichedData.reduce((sum, a) => sum + a.totalPengembalian, 0)
            },
            filter: {
                startDate: startDate,
                endDate: endDate
            },
            message: `Laporan berhasil dibuat dengan ${enrichedData.length} data`
        };
        
    } catch (error) {
        console.error('Error in getLaporanAnggotaKeluar:', error);
        return {
            success: false,
            error: {
                code: 'SYSTEM_ERROR',
                message: error.message,
                timestamp: new Date().toISOString()
            }
        };
    }
}

/**
 * Generate bukti transaksi anggota keluar
 * @param {string} anggotaId - ID of the anggota
 * @returns {object} Document generation result
 */
function generateBuktiAnggotaKeluar(anggotaId) {
    try {
        // Validate input
        if (!anggotaId || typeof anggotaId !== 'string') {
            return {
                success: false,
                error: {
                    code: 'INVALID_PARAMETER',
                    message: 'ID anggota tidak valid',
                    timestamp: new Date().toISOString()
                }
            };
        }
        
        // Get anggota data
        const anggota = getAnggotaById(anggotaId);
        
        if (!anggota) {
            return {
                success: false,
                error: {
                    code: 'ANGGOTA_NOT_FOUND',
                    message: 'Anggota tidak ditemukan',
                    timestamp: new Date().toISOString()
                }
            };
        }
        
        // Check if anggota has status "Keluar"
        if (anggota.statusKeanggotaan !== 'Keluar') {
            return {
                success: false,
                error: {
                    code: 'ANGGOTA_NOT_KELUAR',
                    message: 'Anggota belum berstatus keluar',
                    timestamp: new Date().toISOString()
                }
            };
        }
        
        // Calculate pengembalian
        const calculation = calculatePengembalian(anggotaId);
        if (!calculation.success) {
            return {
                success: false,
                error: {
                    code: 'CALCULATION_FAILED',
                    message: 'Gagal menghitung pengembalian',
                    details: calculation.error,
                    timestamp: new Date().toISOString()
                }
            };
        }
        
        const { simpananPokok, simpananWajib, totalSimpanan, kewajibanLain, totalPengembalian } = calculation.data;
        
        // Get system settings for koperasi info
        const systemSettings = JSON.parse(localStorage.getItem('systemSettings') || '{}');
        const namaKoperasi = systemSettings.namaKoperasi || 'KOPERASI';
        const alamatKoperasi = systemSettings.alamatKoperasi || '';
        const teleponKoperasi = systemSettings.teleponKoperasi || '';
        
        // Format dates
        const tanggalCetak = new Date().toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
        
        const tanggalKeluar = anggota.tanggalKeluar ? new Date(anggota.tanggalKeluar).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        }) : '-';
        
        // Generate reference number
        const nomorReferensi = `AK-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${anggotaId.substring(0, 8)}`;
        
        // Generate HTML document
        const buktiHTML = `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bukti Anggota Keluar - ${nomorReferensi}</title>
    <style>
        @media print {
            @page {
                size: A4;
                margin: 2cm;
            }
            body {
                margin: 0;
                padding: 0;
            }
            .no-print {
                display: none !important;
            }
        }
        
        body {
            font-family: 'Arial', sans-serif;
            font-size: 12pt;
            line-height: 1.6;
            color: #333;
            max-width: 21cm;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            text-align: center;
            border-bottom: 3px solid #333;
            padding-bottom: 15px;
            margin-bottom: 30px;
        }
        
        .header h1 {
            margin: 0;
            font-size: 20pt;
            font-weight: bold;
            text-transform: uppercase;
        }
        
        .header p {
            margin: 5px 0;
            font-size: 10pt;
        }
        
        .title {
            text-align: center;
            margin: 30px 0;
        }
        
        .title h2 {
            margin: 0;
            font-size: 16pt;
            font-weight: bold;
            text-decoration: underline;
        }
        
        .reference {
            text-align: center;
            margin-bottom: 30px;
            font-size: 11pt;
        }
        
        .content {
            margin: 20px 0;
        }
        
        .section {
            margin: 20px 0;
        }
        
        .section-title {
            font-weight: bold;
            margin-bottom: 10px;
            font-size: 13pt;
            border-bottom: 1px solid #666;
            padding-bottom: 5px;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0;
        }
        
        table.info td {
            padding: 5px;
            vertical-align: top;
        }
        
        table.info td:first-child {
            width: 200px;
            font-weight: bold;
        }
        
        table.rincian {
            border: 1px solid #333;
        }
        
        table.rincian th,
        table.rincian td {
            border: 1px solid #333;
            padding: 8px;
            text-align: left;
        }
        
        table.rincian th {
            background-color: #f0f0f0;
            font-weight: bold;
        }
        
        table.rincian td.amount {
            text-align: right;
        }
        
        table.rincian tr.total {
            font-weight: bold;
            background-color: #f9f9f9;
        }
        
        .signatures {
            margin-top: 50px;
            display: flex;
            justify-content: space-between;
        }
        
        .signature-box {
            text-align: center;
            width: 45%;
        }
        
        .signature-line {
            margin-top: 80px;
            border-top: 1px solid #333;
            padding-top: 5px;
        }
        
        .footer {
            margin-top: 30px;
            padding-top: 15px;
            border-top: 1px solid #ccc;
            font-size: 9pt;
            color: #666;
            text-align: center;
        }
        
        .print-button {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 10px 20px;
            background-color: #007bff;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        }
        
        .print-button:hover {
            background-color: #0056b3;
        }
        
        .alert-box {
            background-color: #fff3cd;
            border: 1px solid #ffc107;
            border-radius: 5px;
            padding: 15px;
            margin: 20px 0;
        }
        
        .alert-box strong {
            color: #856404;
        }
    </style>
</head>
<body>
    <button class="print-button no-print" onclick="window.print()">
        🖨️ Cetak Dokumen
    </button>
    
    <div class="header">
        <h1>${namaKoperasi}</h1>
        ${alamatKoperasi ? `<p>${alamatKoperasi}</p>` : ''}
        ${teleponKoperasi ? `<p>Telp: ${teleponKoperasi}</p>` : ''}
    </div>
    
    <div class="title">
        <h2>BUKTI ANGGOTA KELUAR</h2>
    </div>
    
    <div class="reference">
        <strong>Nomor Referensi:</strong> ${nomorReferensi}
    </div>
    
    <div class="content">
        <div class="section">
            <div class="section-title">Data Anggota</div>
            <table class="info">
                <tr>
                    <td>NIK</td>
                    <td>: ${anggota.nik}</td>
                </tr>
                <tr>
                    <td>Nama Lengkap</td>
                    <td>: ${anggota.nama}</td>
                </tr>
                <tr>
                    <td>Departemen</td>
                    <td>: ${anggota.departemen || '-'}</td>
                </tr>
                <tr>
                    <td>Tipe Anggota</td>
                    <td>: ${anggota.tipeAnggota || 'Umum'}</td>
                </tr>
                <tr>
                    <td>Tanggal Keluar</td>
                    <td>: ${tanggalKeluar}</td>
                </tr>
                <tr>
                    <td>Alasan Keluar</td>
                    <td>: ${anggota.alasanKeluar || '-'}</td>
                </tr>
            </table>
        </div>
        
        <div class="section">
            <div class="section-title">Rincian Simpanan yang Akan Dikembalikan</div>
            <table class="rincian">
                <thead>
                    <tr>
                        <th>Jenis Simpanan</th>
                        <th style="text-align: right;">Jumlah (Rp)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Simpanan Pokok</td>
                        <td class="amount">${simpananPokok.toLocaleString('id-ID')}</td>
                    </tr>
                    <tr>
                        <td>Simpanan Wajib</td>
                        <td class="amount">${simpananWajib.toLocaleString('id-ID')}</td>
                    </tr>
                    <tr class="total">
                        <td>Total Simpanan</td>
                        <td class="amount">${totalSimpanan.toLocaleString('id-ID')}</td>
                    </tr>
                    ${kewajibanLain > 0 ? `
                    <tr>
                        <td>Kewajiban Lain</td>
                        <td class="amount" style="color: red;">- ${kewajibanLain.toLocaleString('id-ID')}</td>
                    </tr>
                    ` : ''}
                    <tr class="total" style="background-color: #d4edda;">
                        <td>Total yang Akan Dikembalikan</td>
                        <td class="amount" style="font-size: 14pt;">${totalPengembalian.toLocaleString('id-ID')}</td>
                    </tr>
                </tbody>
            </table>
        </div>
        
        <div class="alert-box">
            <strong>Catatan Penting:</strong><br>
            - Dokumen ini adalah bukti bahwa anggota telah resmi keluar dari koperasi<br>
            - Pengembalian simpanan akan diproses sesuai dengan ketentuan yang berlaku<br>
            - Status pengembalian: <strong>${anggota.pengembalianStatus || 'Pending'}</strong><br>
            - Anggota tidak dapat melakukan transaksi baru setelah status keluar
        </div>
        
        <div class="signatures">
            <div class="signature-box">
                <p>Anggota,</p>
                <div class="signature-line">
                    ${anggota.nama}
                </div>
            </div>
            <div class="signature-box">
                <p>Petugas Koperasi,</p>
                <div class="signature-line">
                    (...................................)
                </div>
            </div>
        </div>
    </div>
    
    <div class="footer">
        <p>Dokumen ini dicetak pada: ${tanggalCetak}</p>
        <p>Referensi: ${nomorReferensi}</p>
        <p>Dokumen ini sah tanpa tanda tangan basah</p>
    </div>
</body>
</html>
        `;
        
        // Return success with HTML
        return {
            success: true,
            data: {
                html: buktiHTML,
                nomorReferensi: nomorReferensi,
                anggotaId: anggotaId,
                anggotaNama: anggota.nama,
                tanggalKeluar: anggota.tanggalKeluar,
                totalPengembalian: totalPengembalian
            },
            message: 'Bukti anggota keluar berhasil dibuat'
        };
        
    } catch (error) {
        console.error('Error in generateBuktiAnggotaKeluar:', error);
        return {
            success: false,
            error: {
                code: 'SYSTEM_ERROR',
                message: error.message,
                timestamp: new Date().toISOString()
            }
        };
    }
}


/**
 * Get total simpanan pokok for laporan (excluding anggota keluar yang sudah diproses)
 * @param {string} anggotaId - ID of the anggota
 * @param {boolean} excludeProcessedKeluar - Whether to exclude anggota keluar with processed pengembalian
 * @returns {number} Total simpanan pokok
 */
function getTotalSimpananPokokForLaporan(anggotaId, excludeProcessedKeluar = true) {
    try {
        if (!anggotaId || typeof anggotaId !== 'string') {
            return 0;
        }
        
        // Check if anggota keluar and pengembalian processed
        if (excludeProcessedKeluar) {
            const anggota = getAnggotaById(anggotaId);
            if (anggota && anggota.statusKeanggotaan === 'Keluar' && anggota.pengembalianStatus === 'Selesai') {
                // Pengembalian sudah diproses, simpanan sudah ditarik
                return 0;
            }
        }
        
        return getTotalSimpananPokok(anggotaId);
    } catch (error) {
        console.error('Error in getTotalSimpananPokokForLaporan:', error);
        return 0;
    }
}

/**
 * Get total simpanan wajib for laporan (excluding anggota keluar yang sudah diproses)
 * @param {string} anggotaId - ID of the anggota
 * @param {boolean} excludeProcessedKeluar - Whether to exclude anggota keluar with processed pengembalian
 * @returns {number} Total simpanan wajib
 */
function getTotalSimpananWajibForLaporan(anggotaId, excludeProcessedKeluar = true) {
    try {
        if (!anggotaId || typeof anggotaId !== 'string') {
            return 0;
        }
        
        // Check if anggota keluar and pengembalian processed
        if (excludeProcessedKeluar) {
            const anggota = getAnggotaById(anggotaId);
            if (anggota && anggota.statusKeanggotaan === 'Keluar' && anggota.pengembalianStatus === 'Selesai') {
                // Pengembalian sudah diproses, simpanan sudah ditarik
                return 0;
            }
        }
        
        return getTotalSimpananWajib(anggotaId);
    } catch (error) {
        console.error('Error in getTotalSimpananWajibForLaporan:', error);
        return 0;
    }
}

/**
 * Get all anggota with their simpanan totals for laporan
 * Excludes anggota keluar yang sudah diproses pengembaliannya
 * @returns {array} Array of anggota with simpanan totals
 */
function getAnggotaWithSimpananForLaporan() {
    try {
        const anggotaList = JSON.parse(localStorage.getItem('anggota') || '[]');
        
        return anggotaList.map(anggota => {
            // Skip anggota keluar yang sudah diproses pengembalian
            const isProcessedKeluar = anggota.statusKeanggotaan === 'Keluar' && anggota.pengembalianStatus === 'Selesai';
            
            return {
                ...anggota,
                simpananPokok: isProcessedKeluar ? 0 : getTotalSimpananPokok(anggota.id),
                simpananWajib: isProcessedKeluar ? 0 : getTotalSimpananWajib(anggota.id),
                totalSimpanan: isProcessedKeluar ? 0 : (getTotalSimpananPokok(anggota.id) + getTotalSimpananWajib(anggota.id)),
                isProcessedKeluar: isProcessedKeluar
            };
        }).filter(anggota => {
            // Filter out anggota with zero simpanan if they are processed keluar
            if (anggota.isProcessedKeluar) {
                return false; // Don't show in laporan
            }
            return true;
        });
    } catch (error) {
        console.error('Error in getAnggotaWithSimpananForLaporan:', error);
        return [];
    }
}
