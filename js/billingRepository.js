/**
 * BillingRepository - Mengelola akses data tagihan ke localStorage
 * Feature: tagihan-simpanan-wajib-kolektif
 */

class BillingRepository {
  constructor() {
    this.STORAGE_KEY = 'billings';
  }

  /**
   * Menyimpan tagihan baru
   * @param {Object} billing - Billing object
   * @returns {string} Billing ID
   */
  save(billing) {
    try {
      const billings = this._getAllBillings();
      billings.push(billing);
      this._saveBillings(billings);
      return billing.id;
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        throw new Error('Ruang penyimpanan penuh. Silakan hapus data lama.');
      }
      throw error;
    }
  }

  /**
   * Mendapatkan tagihan berdasarkan ID
   * @param {string} id - Billing ID
   * @returns {Object|null}
   */
  findById(id) {
    const billings = this._getAllBillings();
    return billings.find(b => b.id === id) || null;
  }

  /**
   * Mendapatkan semua tagihan
   * @returns {Array}
   */
  findAll() {
    return this._getAllBillings();
  }

  /**
   * Update tagihan
   * @param {string} id - Billing ID
   * @param {Object} updates - Fields to update
   * @returns {boolean}
   */
  update(id, updates) {
    try {
      const billings = this._getAllBillings();
      const index = billings.findIndex(b => b.id === id);
      
      if (index === -1) {
        return false;
      }

      billings[index] = {
        ...billings[index],
        ...updates
      };

      this._saveBillings(billings);
      return true;
    } catch (error) {
      console.error('Failed to update billing:', error);
      return false;
    }
  }

  /**
   * Hapus tagihan
   * @param {string} id - Billing ID
   * @returns {boolean}
   */
  delete(id) {
    try {
      const billings = this._getAllBillings();
      const filtered = billings.filter(b => b.id !== id);
      
      if (filtered.length === billings.length) {
        return false; // Not found
      }

      this._saveBillings(filtered);
      return true;
    } catch (error) {
      console.error('Failed to delete billing:', error);
      return false;
    }
  }

  /**
   * Cek apakah tagihan sudah ada untuk periode tertentu
   * @param {string} memberId - Member ID
   * @param {string} period - Format: "YYYY-MM"
   * @returns {boolean}
   */
  existsByMemberAndPeriod(memberId, period) {
    const billings = this._getAllBillings();
    return billings.some(b => 
      b.memberId === memberId && 
      b.period === period &&
      b.type === 'simpanan_wajib'
    );
  }

  /**
   * Mendapatkan tagihan berdasarkan member ID
   * @param {string} memberId - Member ID
   * @returns {Array}
   */
  findByMemberId(memberId) {
    const billings = this._getAllBillings();
    return billings.filter(b => b.memberId === memberId);
  }

  /**
   * Mendapatkan tagihan berdasarkan periode
   * @param {string} period - Format: "YYYY-MM"
   * @returns {Array}
   */
  findByPeriod(period) {
    const billings = this._getAllBillings();
    return billings.filter(b => b.period === period);
  }

  /**
   * Mendapatkan tagihan berdasarkan status
   * @param {string} status - "belum_dibayar" | "dibayar"
   * @returns {Array}
   */
  findByStatus(status) {
    const billings = this._getAllBillings();
    return billings.filter(b => b.status === status);
  }

  /**
   * Get all billings from localStorage
   * @private
   */
  _getAllBillings() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (!data) {
        return [];
      }
      
      const billings = JSON.parse(data);
      
      // Validate data structure
      if (!Array.isArray(billings)) {
        console.error('Invalid billings data structure');
        return [];
      }
      
      return billings;
    } catch (error) {
      console.error('Failed to load billings:', error);
      return [];
    }
  }

  /**
   * Save billings to localStorage
   * @private
   */
  _saveBillings(billings) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(billings));
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        throw new Error('Ruang penyimpanan penuh');
      }
      throw error;
    }
  }

  /**
   * Clear all billings (for testing purposes)
   */
  clear() {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  /**
   * Get storage statistics
   * @returns {Object} { count: number, size: number }
   */
  getStats() {
    const billings = this._getAllBillings();
    const data = localStorage.getItem(this.STORAGE_KEY) || '';
    
    return {
      count: billings.length,
      size: new Blob([data]).size
    };
  }
}

// Browser compatibility - assign to window object
window.BillingRepository = BillingRepository;
