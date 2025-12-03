/**
 * BillingManager - Mengelola logika bisnis untuk pembuatan dan pengelolaan tagihan
 * Feature: tagihan-simpanan-wajib-kolektif
 */

class BillingManager {
  constructor(billingRepository, memberRepository) {
    this.billingRepository = billingRepository;
    this.memberRepository = memberRepository;
  }

  /**
   * Membuat tagihan simpanan wajib untuk semua anggota aktif
   * @param {string} period - Format: "YYYY-MM"
   * @returns {Object} { success: boolean, created: number, skipped: number, errors: Array }
   */
  createMonthlyBillings(period) {
    try {
      // Validasi format periode
      if (!this._isValidPeriodFormat(period)) {
        return {
          success: false,
          created: 0,
          skipped: 0,
          errors: ['Format periode tidak valid. Gunakan format YYYY-MM']
        };
      }

      const members = this.memberRepository.findAll();
      const activeMembers = members.filter(m => m.status === 'aktif');
      const inactiveCount = members.length - activeMembers.length;
      
      let created = 0;
      let skipped = inactiveCount; // Start with inactive members count
      const errors = [];

      for (const member of activeMembers) {
        // Cek apakah tagihan sudah ada untuk periode ini
        if (this.billingRepository.existsByMemberAndPeriod(member.id, period)) {
          skipped++;
          continue;
        }

        // Cek apakah member memiliki pengaturan simpanan wajib
        const amount = member.simpananWajibAmount || this._getDefaultSimpananWajibAmount();
        
        if (!amount || amount <= 0) {
          skipped++;
          errors.push(`Anggota ${member.nama} tidak memiliki nominal simpanan wajib`);
          continue;
        }

        // Buat tagihan
        const billing = {
          id: this._generateId(),
          memberId: member.id,
          memberName: member.nama,
          type: 'simpanan_wajib',
          period: period,
          amount: amount,
          status: 'belum_dibayar',
          createdAt: new Date().toISOString(),
          paidAt: null,
          paidBy: null,
          journalId: null,
          notes: null
        };

        this.billingRepository.save(billing);
        created++;
      }

      return {
        success: true,
        created,
        skipped,
        errors
      };
    } catch (error) {
      return {
        success: false,
        created: 0,
        skipped: 0,
        errors: [error.message]
      };
    }
  }

  /**
   * Membuat tagihan simpanan pokok untuk anggota baru
   * @param {string} memberId - ID anggota
   * @returns {Object} { success: boolean, billingId: string, error: string }
   */
  createInitialSavingBilling(memberId) {
    try {
      const member = this.memberRepository.findById(memberId);
      
      if (!member) {
        return {
          success: false,
          billingId: null,
          error: 'Anggota tidak ditemukan'
        };
      }

      // Cek apakah sudah ada tagihan simpanan pokok
      const existingBilling = this.billingRepository.findAll()
        .find(b => b.memberId === memberId && b.type === 'simpanan_pokok');
      
      if (existingBilling) {
        return {
          success: false,
          billingId: null,
          error: 'Tagihan simpanan pokok sudah ada untuk anggota ini'
        };
      }

      const billing = {
        id: this._generateId(),
        memberId: member.id,
        memberName: member.nama,
        type: 'simpanan_pokok',
        period: null,
        amount: 250000,
        status: 'belum_dibayar',
        createdAt: new Date().toISOString(),
        paidAt: null,
        paidBy: null,
        journalId: null,
        notes: 'Simpanan pokok anggota baru'
      };

      this.billingRepository.save(billing);

      return {
        success: true,
        billingId: billing.id,
        error: null
      };
    } catch (error) {
      return {
        success: false,
        billingId: null,
        error: error.message
      };
    }
  }

  /**
   * Mendapatkan daftar tagihan dengan filter
   * @param {Object} filters - { status, period, search }
   * @returns {Array} Array of billing objects
   */
  getBillings(filters = {}) {
    let billings = this.billingRepository.findAll();

    // Filter by status
    if (filters.status && filters.status !== 'semua') {
      billings = billings.filter(b => b.status === filters.status);
    }

    // Filter by period
    if (filters.period) {
      billings = billings.filter(b => b.period === filters.period);
    }

    // Search by member name
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      billings = billings.filter(b => 
        b.memberName.toLowerCase().includes(searchLower)
      );
    }

    // Sort by createdAt descending
    billings.sort((a, b) => {
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    return billings;
  }

  /**
   * Menghapus tagihan yang belum dibayar
   * @param {string} billingId - ID tagihan
   * @returns {Object} { success: boolean, message: string }
   */
  deleteBilling(billingId) {
    try {
      const billing = this.billingRepository.findById(billingId);

      if (!billing) {
        return {
          success: false,
          message: 'Tagihan tidak ditemukan'
        };
      }

      if (billing.status === 'dibayar') {
        return {
          success: false,
          message: 'Tagihan yang sudah dibayar tidak dapat dihapus'
        };
      }

      this.billingRepository.delete(billingId);

      return {
        success: true,
        message: 'Tagihan berhasil dihapus'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Mendapatkan riwayat pembayaran anggota
   * @param {string} memberId - ID anggota
   * @param {Object} filters - { startDate, endDate }
   * @returns {Object} { history: Array, total: number }
   */
  getMemberPaymentHistory(memberId, filters = {}) {
    let billings = this.billingRepository.findAll()
      .filter(b => b.memberId === memberId && b.status === 'dibayar');

    // Filter by date range
    if (filters.startDate || filters.endDate) {
      billings = billings.filter(b => {
        const paidDate = new Date(b.paidAt);
        
        if (filters.startDate && paidDate < new Date(filters.startDate)) {
          return false;
        }
        
        if (filters.endDate && paidDate > new Date(filters.endDate)) {
          return false;
        }
        
        return true;
      });
    }

    // Sort by period descending
    billings.sort((a, b) => {
      // Handle simpanan pokok (no period)
      if (!a.period) return 1;
      if (!b.period) return -1;
      return b.period.localeCompare(a.period);
    });

    // Calculate total
    const total = billings.reduce((sum, b) => sum + b.amount, 0);

    return {
      history: billings,
      total
    };
  }

  /**
   * Validasi format periode YYYY-MM
   * @private
   */
  _isValidPeriodFormat(period) {
    const regex = /^\d{4}-\d{2}$/;
    return regex.test(period);
  }

  /**
   * Generate unique ID
   * @private
   */
  _generateId() {
    return 'BIL-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Get default simpanan wajib amount from system settings
   * @private
   */
  _getDefaultSimpananWajibAmount() {
    try {
      const settings = JSON.parse(localStorage.getItem('systemSettings') || '{}');
      return settings.simpananWajibDefaultAmount || 0;
    } catch (error) {
      return 0;
    }
  }
}

// Export untuk digunakan di browser dan Node.js
export default BillingManager;
