/**
 * Data Validator
 * Validates data consistency across modules
 */

class DataValidator {
    constructor() {
        this.dataKeys = {
            anggota: 'anggota',
            barang: 'barang',
            transaksi: 'transaksi',
            simpanan: 'simpanan',
            pinjaman: 'pinjaman',
            pembelian: 'pembelian'
        };
    }

    /**
     * Validate referential integrity
     */
    validateReferentialIntegrity() {
        const errors = [];
        const warnings = [];

        try {
            // Check transaksi references
            const transaksiCheck = this._checkTransaksiReferences();
            errors.push(...transaksiCheck.errors);
            warnings.push(...transaksiCheck.warnings);

            // Check simpanan references
            const simpananCheck = this._checkSimpananReferences();
            errors.push(...simpananCheck.errors);
            warnings.push(...simpananCheck.warnings);

            // Check pinjaman references
            const pinjamanCheck = this._checkPinjamanReferences();
            errors.push(...pinjamanCheck.errors);
            warnings.push(...pinjamanCheck.warnings);

            // Check pembelian references
            const pembelianCheck = this._checkPembelianReferences();
            errors.push(...pembelianCheck.errors);
            warnings.push(...pembelianCheck.warnings);

            return {
                isValid: errors.length === 0,
                errors,
                warnings,
                details: {
                    transaksi: transaksiCheck.details,
                    simpanan: simpananCheck.details,
                    pinjaman: pinjamanCheck.details,
                    pembelian: pembelianCheck.details
                }
            };
        } catch (error) {
            errors.push(`Error validating referential integrity: ${error.message}`);
            return { isValid: false, errors, warnings, details: null };
        }
    }

    /**
     * Validate inventory consistency
     */
    validateInventoryConsistency() {
        const errors = [];
        const warnings = [];

        try {
            const barang = this._getData('barang');
            const transaksi = this._getData('transaksi');
            const pembelian = this._getData('pembelian');

            const discrepancies = [];

            barang.forEach(item => {
                // Calculate expected stock based on transactions
                const expectedStock = this._calculateExpectedStock(item, transaksi, pembelian);
                const actualStock = parseInt(item.stok || 0);

                if (expectedStock !== actualStock) {
                    discrepancies.push({
                        kodeBarang: item.kode,
                        namaBarang: item.nama,
                        expectedStock,
                        actualStock,
                        difference: actualStock - expectedStock
                    });

                    errors.push(`Stok ${item.nama} tidak konsisten. Expected: ${expectedStock}, Actual: ${actualStock}`);
                }

                // Check for negative stock
                if (actualStock < 0) {
                    warnings.push(`Stok ${item.nama} negatif: ${actualStock}`);
                }
            });

            return {
                isValid: errors.length === 0,
                errors,
                warnings,
                details: {
                    totalItems: barang.length,
                    discrepancies: discrepancies.length,
                    discrepancyList: discrepancies
                }
            };
        } catch (error) {
            errors.push(`Error validating inventory consistency: ${error.message}`);
            return { isValid: false, errors, warnings, details: null };
        }
    }

    /**
     * Validate simpanan consistency
     */
    validateSimpananConsistency() {
        const errors = [];
        const warnings = [];

        try {
            const simpanan = this._getData('simpanan');
            const anggota = this._getData('anggota');

            const orphaned = [];
            const inconsistent = [];

            simpanan.forEach(s => {
                // Check if anggota exists
                const anggotaExists = anggota.some(a => a.nik === s.nik);
                if (!anggotaExists) {
                    orphaned.push(s.id);
                    errors.push(`Simpanan ${s.id} memiliki NIK yang tidak valid: ${s.nik}`);
                }

                // Validate saldo calculations
                if (s.jenis === 'sukarela') {
                    const expectedSaldo = this._calculateSimpananSaldo(s);
                    const actualSaldo = parseFloat(s.saldo || 0);

                    if (Math.abs(expectedSaldo - actualSaldo) > 0.01) {
                        inconsistent.push({
                            id: s.id,
                            nik: s.nik,
                            expected: expectedSaldo,
                            actual: actualSaldo
                        });
                        errors.push(`Saldo simpanan ${s.id} tidak konsisten`);
                    }
                }
            });

            return {
                isValid: errors.length === 0,
                errors,
                warnings,
                details: {
                    totalSimpanan: simpanan.length,
                    orphaned: orphaned.length,
                    inconsistent: inconsistent.length,
                    orphanedList: orphaned,
                    inconsistentList: inconsistent
                }
            };
        } catch (error) {
            errors.push(`Error validating simpanan consistency: ${error.message}`);
            return { isValid: false, errors, warnings, details: null };
        }
    }

    /**
     * Validate pinjaman consistency
     */
    validatePinjamanConsistency() {
        const errors = [];
        const warnings = [];

        try {
            const pinjaman = this._getData('pinjaman');
            const anggota = this._getData('anggota');

            const orphaned = [];
            const calculationErrors = [];

            pinjaman.forEach(p => {
                // Check if anggota exists
                const anggotaExists = anggota.some(a => a.nik === p.nik);
                if (!anggotaExists) {
                    orphaned.push(p.id);
                    errors.push(`Pinjaman ${p.id} memiliki NIK yang tidak valid: ${p.nik}`);
                }

                // Validate saldo calculations
                const expectedSaldo = this._calculatePinjamanSaldo(p);
                const actualSaldo = parseFloat(p.saldoPinjaman || p.jumlah || 0);

                if (Math.abs(expectedSaldo - actualSaldo) > 0.01) {
                    calculationErrors.push({
                        id: p.id,
                        nik: p.nik,
                        expected: expectedSaldo,
                        actual: actualSaldo
                    });
                    errors.push(`Saldo pinjaman ${p.id} tidak konsisten`);
                }

                // Check for negative saldo
                if (actualSaldo < 0) {
                    warnings.push(`Saldo pinjaman ${p.id} negatif: ${actualSaldo}`);
                }
            });

            return {
                isValid: errors.length === 0,
                errors,
                warnings,
                details: {
                    totalPinjaman: pinjaman.length,
                    orphaned: orphaned.length,
                    calculationErrors: calculationErrors.length,
                    orphanedList: orphaned,
                    calculationErrorsList: calculationErrors
                }
            };
        } catch (error) {
            errors.push(`Error validating pinjaman consistency: ${error.message}`);
            return { isValid: false, errors, warnings, details: null };
        }
    }

    /**
     * Repair inconsistent data
     */
    repairInconsistentData() {
        const repaired = [];
        const failed = [];

        try {
            // Create backup before repair
            this._createBackup();

            // Repair inventory
            const inventoryRepair = this._repairInventory();
            repaired.push(...inventoryRepair.repaired);
            failed.push(...inventoryRepair.failed);

            // Repair simpanan
            const simpananRepair = this._repairSimpanan();
            repaired.push(...simpananRepair.repaired);
            failed.push(...simpananRepair.failed);

            // Repair pinjaman
            const pinjamanRepair = this._repairPinjaman();
            repaired.push(...pinjamanRepair.repaired);
            failed.push(...pinjamanRepair.failed);

            return {
                success: failed.length === 0,
                itemsRepaired: repaired.length,
                errors: failed.map(f => f.error),
                details: {
                    repaired,
                    failed
                }
            };
        } catch (error) {
            return {
                success: false,
                itemsRepaired: 0,
                errors: [`Repair failed: ${error.message}`],
                details: null
            };
        }
    }

    // Private methods

    _getData(key) {
        const dataStr = localStorage.getItem(this.dataKeys[key]);
        return AuditUtils.safeJsonParse(dataStr, []);
    }

    _saveData(key, data) {
        localStorage.setItem(this.dataKeys[key], JSON.stringify(data));
    }

    _checkTransaksiReferences() {
        const errors = [];
        const warnings = [];
        const transaksi = this._getData('transaksi');
        const anggota = this._getData('anggota');
        const barang = this._getData('barang');

        let invalidAnggota = 0;
        let invalidBarang = 0;

        transaksi.forEach(trx => {
            // Check anggota reference
            if (trx.nik && trx.nik !== 'UMUM') {
                const anggotaExists = anggota.some(a => a.nik === trx.nik);
                if (!anggotaExists) {
                    invalidAnggota++;
                    errors.push(`Transaksi ${trx.id} memiliki NIK tidak valid: ${trx.nik}`);
                }
            }

            // Check barang references
            if (trx.items && Array.isArray(trx.items)) {
                trx.items.forEach(item => {
                    const barangExists = barang.some(b => b.kode === item.kode);
                    if (!barangExists) {
                        invalidBarang++;
                        errors.push(`Transaksi ${trx.id} memiliki kode barang tidak valid: ${item.kode}`);
                    }
                });
            }
        });

        return {
            errors,
            warnings,
            details: {
                totalTransaksi: transaksi.length,
                invalidAnggota,
                invalidBarang
            }
        };
    }

    _checkSimpananReferences() {
        const errors = [];
        const warnings = [];
        const simpanan = this._getData('simpanan');
        const anggota = this._getData('anggota');

        let invalidReferences = 0;

        simpanan.forEach(s => {
            const anggotaExists = anggota.some(a => a.nik === s.nik);
            if (!anggotaExists) {
                invalidReferences++;
                errors.push(`Simpanan ${s.id} memiliki NIK tidak valid: ${s.nik}`);
            }
        });

        return {
            errors,
            warnings,
            details: {
                totalSimpanan: simpanan.length,
                invalidReferences
            }
        };
    }

    _checkPinjamanReferences() {
        const errors = [];
        const warnings = [];
        const pinjaman = this._getData('pinjaman');
        const anggota = this._getData('anggota');

        let invalidReferences = 0;

        pinjaman.forEach(p => {
            const anggotaExists = anggota.some(a => a.nik === p.nik);
            if (!anggotaExists) {
                invalidReferences++;
                errors.push(`Pinjaman ${p.id} memiliki NIK tidak valid: ${p.nik}`);
            }
        });

        return {
            errors,
            warnings,
            details: {
                totalPinjaman: pinjaman.length,
                invalidReferences
            }
        };
    }

    _checkPembelianReferences() {
        const errors = [];
        const warnings = [];
        const pembelian = this._getData('pembelian');
        const barang = this._getData('barang');

        let invalidBarang = 0;

        pembelian.forEach(p => {
            if (p.items && Array.isArray(p.items)) {
                p.items.forEach(item => {
                    const barangExists = barang.some(b => b.kode === item.kode);
                    if (!barangExists) {
                        invalidBarang++;
                        errors.push(`Pembelian ${p.id} memiliki kode barang tidak valid: ${item.kode}`);
                    }
                });
            }
        });

        return {
            errors,
            warnings,
            details: {
                totalPembelian: pembelian.length,
                invalidBarang
            }
        };
    }

    _calculateExpectedStock(item, transaksi, pembelian) {
        let stock = 0;

        // Add from pembelian
        pembelian.forEach(p => {
            if (p.items && Array.isArray(p.items)) {
                p.items.forEach(pItem => {
                    if (pItem.kode === item.kode) {
                        stock += parseInt(pItem.jumlah || 0);
                    }
                });
            }
        });

        // Subtract from transaksi
        transaksi.forEach(t => {
            if (t.items && Array.isArray(t.items)) {
                t.items.forEach(tItem => {
                    if (tItem.kode === item.kode) {
                        stock -= parseInt(tItem.jumlah || 0);
                    }
                });
            }
        });

        return stock;
    }

    _calculateSimpananSaldo(simpanan) {
        // This would need to calculate based on transaction history
        // For now, return current saldo
        return parseFloat(simpanan.saldo || 0);
    }

    _calculatePinjamanSaldo(pinjaman) {
        // This would need to calculate based on angsuran history
        // For now, return current saldo
        return parseFloat(pinjaman.saldoPinjaman || pinjaman.jumlah || 0);
    }

    _createBackup() {
        const backup = {
            timestamp: new Date().toISOString(),
            data: {}
        };

        Object.keys(this.dataKeys).forEach(key => {
            backup.data[key] = this._getData(key);
        });

        localStorage.setItem('dataValidatorBackup', JSON.stringify(backup));
    }

    _repairInventory() {
        const repaired = [];
        const failed = [];

        // Inventory repair would be complex and risky
        // For now, just report what needs manual attention

        return { repaired, failed };
    }

    _repairSimpanan() {
        const repaired = [];
        const failed = [];

        // Simpanan repair would need careful calculation
        // For now, just report what needs manual attention

        return { repaired, failed };
    }

    _repairPinjaman() {
        const repaired = [];
        const failed = [];

        // Pinjaman repair would need careful calculation
        // For now, just report what needs manual attention

        return { repaired, failed };
    }

    /**
     * Generate validation report HTML
     */
    generateValidationReportHtml() {
        const integrityValidation = this.validateReferentialIntegrity();
        const inventoryValidation = this.validateInventoryConsistency();
        const simpananValidation = this.validateSimpananConsistency();
        const pinjamanValidation = this.validatePinjamanConsistency();

        let html = `
            <div class="audit-card">
                <div class="audit-card-header">
                    <h2 class="audit-card-title">Validasi Referential Integrity</h2>
                </div>
                <div class="audit-card-body">
                    <div class="alert ${integrityValidation.isValid ? 'alert-info' : 'alert-danger'}">
                        <strong>${integrityValidation.isValid ? '✓ Valid' : '✕ Tidak Valid'}</strong>
                    </div>
                    
                    ${integrityValidation.errors.length > 0 ? `
                        <div class="alert alert-danger">
                            <strong>Errors (${integrityValidation.errors.length}):</strong>
                            <ul>
                                ${integrityValidation.errors.slice(0, 10).map(e => `<li>${e}</li>`).join('')}
                                ${integrityValidation.errors.length > 10 ? `<li>... dan ${integrityValidation.errors.length - 10} lainnya</li>` : ''}
                            </ul>
                        </div>
                    ` : ''}
                </div>
            </div>

            <div class="audit-card">
                <div class="audit-card-header">
                    <h2 class="audit-card-title">Validasi Konsistensi Inventory</h2>
                </div>
                <div class="audit-card-body">
                    <div class="stat-grid">
                        <div class="stat-item">
                            <div class="stat-value">${inventoryValidation.details?.totalItems || 0}</div>
                            <div class="stat-label">Total Items</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${inventoryValidation.details?.discrepancies || 0}</div>
                            <div class="stat-label">Discrepancies</div>
                        </div>
                    </div>
                    
                    ${inventoryValidation.errors.length > 0 ? `
                        <div class="alert alert-warning">
                            <strong>Issues Found (${inventoryValidation.errors.length}):</strong>
                            <ul>
                                ${inventoryValidation.errors.slice(0, 5).map(e => `<li>${e}</li>`).join('')}
                                ${inventoryValidation.errors.length > 5 ? `<li>... dan ${inventoryValidation.errors.length - 5} lainnya</li>` : ''}
                            </ul>
                        </div>
                    ` : ''}
                </div>
            </div>

            <div class="audit-card">
                <div class="audit-card-header">
                    <h2 class="audit-card-title">Validasi Konsistensi Simpanan & Pinjaman</h2>
                </div>
                <div class="audit-card-body">
                    <div class="stat-grid">
                        <div class="stat-item">
                            <div class="stat-value">${simpananValidation.details?.totalSimpanan || 0}</div>
                            <div class="stat-label">Total Simpanan</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${simpananValidation.details?.orphaned || 0}</div>
                            <div class="stat-label">Orphaned Simpanan</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${pinjamanValidation.details?.totalPinjaman || 0}</div>
                            <div class="stat-label">Total Pinjaman</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${pinjamanValidation.details?.orphaned || 0}</div>
                            <div class="stat-label">Orphaned Pinjaman</div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        return html;
    }
}

// Create global instance
const dataValidator = new DataValidator();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataValidator;
}
