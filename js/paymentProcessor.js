/**
 * PaymentProcessor - Menangani proses pembayaran kolektif dan integrasi dengan jurnal
 * Feature: tagihan-simpanan-wajib-kolektif
 */

class PaymentProcessor {
  constructor(billingRepository, memberRepository, journalRepository) {
    this.billingRepository = billingRepository;
    this.memberRepository = memberRepository;
    this.journalRepository = journalRepository;
  }

  /**
   * Memproses pembayaran kolektif
   * @param {Array} billingIds - Array of billing IDs
   * @param {string} paymentDate - ISO date string
   * @param {string} adminId - ID admin yang memproses
   * @returns {Object} { success: boolean, totalAmount: number, count: number, error: string }
   */
  processCollectivePayment(billingIds, paymentDate, adminId) {
    try {
      // Validasi input
      if (!billingIds || billingIds.length === 0) {
        return {
          success: false,
          totalAmount: 0,
          count: 0,
          error: 'Tidak ada tagihan yang dipilih'
        };
      }

      // Get all billings
      const billings = billingIds.map(id => this.billingRepository.findById(id))
        .filter(b => b !== null);

      if (billings.length === 0) {
        return {
          success: false,
          totalAmount: 0,
          count: 0,
          error: 'Tagihan tidak ditemukan'
        };
      }

      // Validasi semua tagihan belum dibayar
      const paidBillings = billings.filter(b => b.status === 'dibayar');
      if (paidBillings.length > 0) {
        return {
          success: false,
          totalAmount: 0,
          count: 0,
          error: 'Beberapa tagihan sudah dibayar'
        };
      }

      // Calculate total
      const totalAmount = billings.reduce((sum, b) => sum + b.amount, 0);

      // Group by period for journal description
      const periods = [...new Set(billings.map(b => b.period).filter(p => p))];
      const periodText = periods.length > 0 ? periods.join(', ') : 'Simpanan Pokok';

      try {
        // Create journal entry
        const journalId = this._createJournalEntry({
          amount: totalAmount,
          description: `Pembayaran simpanan wajib kolektif - ${billings.length} anggota - Periode: ${periodText}`,
          date: paymentDate,
          type: 'simpanan_wajib'
        });

        // Update all billings
        for (const billing of billings) {
          this.billingRepository.update(billing.id, {
            status: 'dibayar',
            paidAt: paymentDate,
            paidBy: adminId,
            journalId: journalId
          });

          // Update member balance
          this._updateMemberBalance(billing.memberId, billing.amount, billing.type);
        }

        return {
          success: true,
          totalAmount,
          count: billings.length,
          error: null
        };
      } catch (error) {
        // Rollback on error
        this.rollbackPayment(billingIds);
        throw error;
      }
    } catch (error) {
      return {
        success: false,
        totalAmount: 0,
        count: 0,
        error: 'Pembayaran gagal. Silakan coba lagi. ' + error.message
      };
    }
  }

  /**
   * Membayar simpanan pokok individual
   * @param {string} billingId - ID tagihan simpanan pokok
   * @param {string} paymentDate - ISO date string
   * @param {string} adminId - ID admin yang memproses
   * @returns {Object} { success: boolean, amount: number, error: string }
   */
  payInitialSaving(billingId, paymentDate, adminId) {
    try {
      const billing = this.billingRepository.findById(billingId);

      if (!billing) {
        return {
          success: false,
          amount: 0,
          error: 'Tagihan tidak ditemukan'
        };
      }

      if (billing.type !== 'simpanan_pokok') {
        return {
          success: false,
          amount: 0,
          error: 'Tagihan bukan simpanan pokok'
        };
      }

      if (billing.status === 'dibayar') {
        return {
          success: false,
          amount: 0,
          error: 'Tagihan sudah dibayar'
        };
      }

      try {
        // Create journal entry
        const journalId = this._createJournalEntry({
          amount: billing.amount,
          description: `Pembayaran simpanan pokok - ${billing.memberName}`,
          date: paymentDate,
          type: 'simpanan_pokok'
        });

        // Update billing
        this.billingRepository.update(billingId, {
          status: 'dibayar',
          paidAt: paymentDate,
          paidBy: adminId,
          journalId: journalId
        });

        // Update member balance
        this._updateMemberBalance(billing.memberId, billing.amount, 'simpanan_pokok');

        return {
          success: true,
          amount: billing.amount,
          error: null
        };
      } catch (error) {
        // Rollback on error
        this.rollbackPayment([billingId]);
        throw error;
      }
    } catch (error) {
      return {
        success: false,
        amount: 0,
        error: 'Pembayaran gagal. Silakan coba lagi. ' + error.message
      };
    }
  }

  /**
   * Rollback pembayaran jika terjadi error
   * @param {Array} billingIds - Array of billing IDs to rollback
   * @returns {void}
   */
  rollbackPayment(billingIds) {
    try {
      for (const billingId of billingIds) {
        const billing = this.billingRepository.findById(billingId);
        if (billing) {
          // Restore to unpaid status
          this.billingRepository.update(billingId, {
            status: 'belum_dibayar',
            paidAt: null,
            paidBy: null,
            journalId: null
          });

          // Note: Member balance rollback would need to be handled separately
          // if we had already updated it before the error occurred
        }
      }
    } catch (error) {
      console.error('Rollback error:', error);
    }
  }

  /**
   * Create journal entry for payment
   * @private
   */
  _createJournalEntry({ amount, description, date, type }) {
    const journalId = 'JRN-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);

    // Determine accounts based on type
    const creditAccount = type === 'simpanan_pokok' ? 'Simpanan Pokok' : 'Simpanan Wajib';

    const journal = {
      id: journalId,
      date: date,
      description: description,
      entries: [
        {
          account: 'Kas',
          debit: amount,
          credit: 0
        },
        {
          account: creditAccount,
          debit: 0,
          credit: amount
        }
      ],
      createdAt: new Date().toISOString()
    };

    this.journalRepository.save(journal);
    return journalId;
  }

  /**
   * Update member balance
   * @private
   */
  _updateMemberBalance(memberId, amount, type) {
    const member = this.memberRepository.findById(memberId);
    if (!member) {
      throw new Error('Anggota tidak ditemukan');
    }

    const balanceField = type === 'simpanan_pokok' ? 'simpananPokokBalance' : 'simpananWajibBalance';
    const currentBalance = member[balanceField] || 0;

    this.memberRepository.update(memberId, {
      [balanceField]: currentBalance + amount
    });
  }
}

// Export untuk digunakan di browser dan Node.js
export default PaymentProcessor;
