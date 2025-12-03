/**
 * Accounting Validator
 * Validates accounting integration and balance
 */

class AccountingValidator {
    constructor() {
        this.coaKey = 'coa';
        this.journalKey = 'journalEntries';
        this.transactionKeys = {
            pos: 'transaksi',
            simpanan: 'simpanan',
            pinjaman: 'pinjaman',
            pembelian: 'pembelian'
        };
    }

    /**
     * Validate journal entry balance (debit = kredit)
     */
    validateJournalBalance(journal) {
        const errors = [];
        const warnings = [];

        if (!journal || !journal.entries || journal.entries.length === 0) {
            errors.push('Journal entry tidak memiliki entries');
            return { isValid: false, errors, warnings, details: null };
        }

        let totalDebit = 0;
        let totalKredit = 0;

        journal.entries.forEach(entry => {
            totalDebit += parseFloat(entry.debit || 0);
            totalKredit += parseFloat(entry.kredit || 0);
        });

        const difference = Math.abs(totalDebit - totalKredit);
        const isBalanced = difference < 0.01; // Allow for floating point errors

        if (!isBalanced) {
            errors.push(`Journal tidak seimbang. Debit: ${totalDebit}, Kredit: ${totalKredit}, Selisih: ${difference}`);
        }

        return {
            isValid: isBalanced,
            errors,
            warnings,
            details: {
                journalId: journal.id,
                totalDebit,
                totalKredit,
                difference,
                entriesCount: journal.entries.length
            }
        };
    }

    /**
     * Validate accounting equation (Assets = Liabilities + Equity)
     */
    validateAccountingEquation() {
        const errors = [];
        const warnings = [];

        try {
            const coa = this._getCOA();
            
            // Calculate totals by type
            const totals = {
                aset: 0,
                kewajiban: 0,
                modal: 0,
                pendapatan: 0,
                beban: 0
            };

            coa.forEach(account => {
                const saldo = parseFloat(account.saldo || 0);
                const tipe = account.tipe.toLowerCase();
                
                if (totals.hasOwnProperty(tipe)) {
                    totals[tipe] += saldo;
                }
            });

            // Calculate net income (Pendapatan - Beban)
            const netIncome = totals.pendapatan - totals.beban;
            
            // Accounting equation: Assets = Liabilities + Equity + Net Income
            const leftSide = totals.aset;
            const rightSide = totals.kewajiban + totals.modal + netIncome;
            
            const difference = Math.abs(leftSide - rightSide);
            const isBalanced = difference < 0.01;

            if (!isBalanced) {
                errors.push(`Persamaan akuntansi tidak seimbang. Aset: ${leftSide}, Kewajiban + Modal + Laba: ${rightSide}, Selisih: ${difference}`);
            }

            // Check for negative balances where they shouldn't be
            if (totals.aset < 0) {
                warnings.push('Total aset negatif');
            }
            if (totals.kewajiban < 0) {
                warnings.push('Total kewajiban negatif');
            }

            return {
                isValid: isBalanced,
                errors,
                warnings,
                details: {
                    aset: totals.aset,
                    kewajiban: totals.kewajiban,
                    modal: totals.modal,
                    pendapatan: totals.pendapatan,
                    beban: totals.beban,
                    netIncome,
                    leftSide,
                    rightSide,
                    difference
                }
            };
        } catch (error) {
            errors.push(`Error validating accounting equation: ${error.message}`);
            return { isValid: false, errors, warnings, details: null };
        }
    }

    /**
     * Check if transaction has corresponding journal entry
     */
    checkTransactionIntegration(transaction, transactionType) {
        const journals = this._getJournals();
        const hasJournal = journals.some(j => 
            j.metadata && 
            j.metadata.transactionId === transaction.id &&
            j.metadata.transactionType === transactionType
        );

        const result = {
            hasJournal,
            journalId: null,
            isBalanced: false,
            missingAccounts: []
        };

        if (hasJournal) {
            const journal = journals.find(j => 
                j.metadata && j.metadata.transactionId === transaction.id
            );
            result.journalId = journal.id;
            
            const validation = this.validateJournalBalance(journal);
            result.isBalanced = validation.isValid;
        }

        return result;
    }

    /**
     * Audit all transactions for journal integration
     */
    auditAllTransactions() {
        const report = {
            pos: this._auditPOSTransactions(),
            simpanan: this._auditSimpananTransactions(),
            pinjaman: this._auditPinjamanTransactions(),
            pembelian: this._auditPembelianTransactions()
        };

        // Calculate summary
        let totalTransactions = 0;
        let transactionsWithJournal = 0;
        let transactionsWithoutJournal = 0;
        let unbalancedJournals = 0;

        Object.values(report).forEach(moduleReport => {
            totalTransactions += moduleReport.total;
            transactionsWithJournal += moduleReport.withJournal;
            transactionsWithoutJournal += moduleReport.withoutJournal;
            unbalancedJournals += moduleReport.unbalanced;
        });

        return {
            summary: {
                totalTransactions,
                transactionsWithJournal,
                transactionsWithoutJournal,
                unbalancedJournals,
                integrationRate: totalTransactions > 0 
                    ? AuditUtils.calculatePercentage(transactionsWithJournal, totalTransactions)
                    : 0
            },
            details: report
        };
    }

    /**
     * Repair unbalanced journals
     */
    repairUnbalancedJournals() {
        const journals = this._getJournals();
        const repaired = [];
        const failed = [];

        journals.forEach(journal => {
            const validation = this.validateJournalBalance(journal);
            
            if (!validation.isValid) {
                // Attempt automatic repair
                const repairResult = this._attemptJournalRepair(journal, validation.details);
                
                if (repairResult.success) {
                    repaired.push({
                        journalId: journal.id,
                        originalDifference: validation.details.difference,
                        repairMethod: repairResult.method
                    });
                } else {
                    failed.push({
                        journalId: journal.id,
                        difference: validation.details.difference,
                        reason: repairResult.reason
                    });
                }
            }
        });

        return {
            success: failed.length === 0,
            itemsRepaired: repaired.length,
            errors: failed.map(f => `Journal ${f.journalId}: ${f.reason}`),
            details: {
                repaired,
                failed
            }
        };
    }

    // Private methods

    _getCOA() {
        const coaStr = localStorage.getItem(this.coaKey);
        return AuditUtils.safeJsonParse(coaStr, []);
    }

    _getJournals() {
        const journalsStr = localStorage.getItem(this.journalKey);
        return AuditUtils.safeJsonParse(journalsStr, []);
    }

    _auditPOSTransactions() {
        const transactions = this._getTransactions('pos');
        let withJournal = 0;
        let withoutJournal = 0;
        let unbalanced = 0;
        const missing = [];

        transactions.forEach(trx => {
            const check = this.checkTransactionIntegration(trx, 'POS');
            
            if (check.hasJournal) {
                withJournal++;
                if (!check.isBalanced) {
                    unbalanced++;
                }
            } else {
                withoutJournal++;
                missing.push(trx.id);
            }
        });

        return {
            total: transactions.length,
            withJournal,
            withoutJournal,
            unbalanced,
            missing
        };
    }

    _auditSimpananTransactions() {
        const transactions = this._getTransactions('simpanan');
        let withJournal = 0;
        let withoutJournal = 0;
        let unbalanced = 0;
        const missing = [];

        transactions.forEach(trx => {
            const check = this.checkTransactionIntegration(trx, 'SIMPANAN');
            
            if (check.hasJournal) {
                withJournal++;
                if (!check.isBalanced) {
                    unbalanced++;
                }
            } else {
                withoutJournal++;
                missing.push(trx.id);
            }
        });

        return {
            total: transactions.length,
            withJournal,
            withoutJournal,
            unbalanced,
            missing
        };
    }

    _auditPinjamanTransactions() {
        const transactions = this._getTransactions('pinjaman');
        let withJournal = 0;
        let withoutJournal = 0;
        let unbalanced = 0;
        const missing = [];

        transactions.forEach(trx => {
            const check = this.checkTransactionIntegration(trx, 'PINJAMAN');
            
            if (check.hasJournal) {
                withJournal++;
                if (!check.isBalanced) {
                    unbalanced++;
                }
            } else {
                withoutJournal++;
                missing.push(trx.id);
            }
        });

        return {
            total: transactions.length,
            withJournal,
            withoutJournal,
            unbalanced,
            missing
        };
    }

    _auditPembelianTransactions() {
        const transactions = this._getTransactions('pembelian');
        let withJournal = 0;
        let withoutJournal = 0;
        let unbalanced = 0;
        const missing = [];

        transactions.forEach(trx => {
            const check = this.checkTransactionIntegration(trx, 'PEMBELIAN');
            
            if (check.hasJournal) {
                withJournal++;
                if (!check.isBalanced) {
                    unbalanced++;
                }
            } else {
                withoutJournal++;
                missing.push(trx.id);
            }
        });

        return {
            total: transactions.length,
            withJournal,
            withoutJournal,
            unbalanced,
            missing
        };
    }

    _getTransactions(type) {
        const key = this.transactionKeys[type];
        if (!key) return [];
        
        const dataStr = localStorage.getItem(key);
        return AuditUtils.safeJsonParse(dataStr, []);
    }

    _attemptJournalRepair(journal, details) {
        // For now, we'll just log that manual repair is needed
        // Automatic repair is complex and risky
        return {
            success: false,
            method: null,
            reason: 'Manual repair required - automatic repair not implemented for safety'
        };
    }

    /**
     * Generate validation report HTML
     */
    generateValidationReportHtml() {
        const equationValidation = this.validateAccountingEquation();
        const transactionAudit = this.auditAllTransactions();

        let html = `
            <div class="audit-card">
                <div class="audit-card-header">
                    <h2 class="audit-card-title">Validasi Persamaan Akuntansi</h2>
                </div>
                <div class="audit-card-body">
                    <div class="alert ${equationValidation.isValid ? 'alert-info' : 'alert-danger'}">
                        <strong>${equationValidation.isValid ? '✓ Valid' : '✕ Tidak Valid'}</strong>
                    </div>
                    
                    ${equationValidation.details ? `
                        <div class="stat-grid">
                            <div class="stat-item">
                                <div class="stat-value">${AuditUtils.formatCurrency(equationValidation.details.aset)}</div>
                                <div class="stat-label">Total Aset</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-value">${AuditUtils.formatCurrency(equationValidation.details.kewajiban)}</div>
                                <div class="stat-label">Total Kewajiban</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-value">${AuditUtils.formatCurrency(equationValidation.details.modal)}</div>
                                <div class="stat-label">Total Modal</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-value">${AuditUtils.formatCurrency(equationValidation.details.netIncome)}</div>
                                <div class="stat-label">Laba Bersih</div>
                            </div>
                        </div>
                    ` : ''}
                    
                    ${equationValidation.errors.length > 0 ? `
                        <div class="alert alert-danger">
                            <strong>Errors:</strong>
                            <ul>
                                ${equationValidation.errors.map(e => `<li>${e}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                    
                    ${equationValidation.warnings.length > 0 ? `
                        <div class="alert alert-warning">
                            <strong>Warnings:</strong>
                            <ul>
                                ${equationValidation.warnings.map(w => `<li>${w}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                </div>
            </div>

            <div class="audit-card">
                <div class="audit-card-header">
                    <h2 class="audit-card-title">Integrasi Transaksi ke Jurnal</h2>
                </div>
                <div class="audit-card-body">
                    <div class="stat-grid">
                        <div class="stat-item">
                            <div class="stat-value">${transactionAudit.summary.totalTransactions}</div>
                            <div class="stat-label">Total Transaksi</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${transactionAudit.summary.transactionsWithJournal}</div>
                            <div class="stat-label">Dengan Jurnal</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${transactionAudit.summary.transactionsWithoutJournal}</div>
                            <div class="stat-label">Tanpa Jurnal</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${transactionAudit.summary.integrationRate.toFixed(1)}%</div>
                            <div class="stat-label">Integration Rate</div>
                        </div>
                    </div>

                    <h3>Detail per Modul</h3>
                    <table class="audit-table">
                        <thead>
                            <tr>
                                <th>Modul</th>
                                <th>Total</th>
                                <th>Dengan Jurnal</th>
                                <th>Tanpa Jurnal</th>
                                <th>Tidak Seimbang</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>POS</td>
                                <td>${transactionAudit.details.pos.total}</td>
                                <td>${transactionAudit.details.pos.withJournal}</td>
                                <td>${transactionAudit.details.pos.withoutJournal}</td>
                                <td>${transactionAudit.details.pos.unbalanced}</td>
                            </tr>
                            <tr>
                                <td>Simpanan</td>
                                <td>${transactionAudit.details.simpanan.total}</td>
                                <td>${transactionAudit.details.simpanan.withJournal}</td>
                                <td>${transactionAudit.details.simpanan.withoutJournal}</td>
                                <td>${transactionAudit.details.simpanan.unbalanced}</td>
                            </tr>
                            <tr>
                                <td>Pinjaman</td>
                                <td>${transactionAudit.details.pinjaman.total}</td>
                                <td>${transactionAudit.details.pinjaman.withJournal}</td>
                                <td>${transactionAudit.details.pinjaman.withoutJournal}</td>
                                <td>${transactionAudit.details.pinjaman.unbalanced}</td>
                            </tr>
                            <tr>
                                <td>Pembelian</td>
                                <td>${transactionAudit.details.pembelian.total}</td>
                                <td>${transactionAudit.details.pembelian.withJournal}</td>
                                <td>${transactionAudit.details.pembelian.withoutJournal}</td>
                                <td>${transactionAudit.details.pembelian.unbalanced}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        return html;
    }
}

// Create global instance
const accountingValidator = new AccountingValidator();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AccountingValidator;
}
