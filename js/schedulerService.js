/**
 * SchedulerService - Mengelola penjadwalan pembuatan tagihan otomatis
 * Feature: tagihan-simpanan-wajib-kolektif
 */

class SchedulerService {
  constructor(billingManager) {
    this.billingManager = billingManager;
    this.STORAGE_KEY = 'schedulerLogs';
    this.LAST_EXECUTION_KEY = 'lastSchedulerExecution';
  }

  /**
   * Memeriksa apakah perlu membuat tagihan hari ini
   * @param {Date} date - Date to check (default: today)
   * @returns {boolean}
   */
  shouldCreateBillings(date = new Date()) {
    // Check if today is the 20th
    const dayOfMonth = date.getDate();
    if (dayOfMonth !== 20) {
      return false;
    }

    // Check if already executed today
    const lastExecution = this._getLastExecutionDate();
    if (lastExecution) {
      const lastDate = new Date(lastExecution);
      const today = new Date(date);
      
      // Compare dates (ignore time)
      if (
        lastDate.getFullYear() === today.getFullYear() &&
        lastDate.getMonth() === today.getMonth() &&
        lastDate.getDate() === today.getDate()
      ) {
        return false; // Already executed today
      }
    }

    return true;
  }

  /**
   * Mendapatkan periode tagihan saat ini
   * @param {Date} date - Date to get period from (default: today)
   * @returns {string} Format: "YYYY-MM"
   */
  getCurrentPeriod(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  /**
   * Menjalankan proses pembuatan tagihan otomatis
   * @returns {Object} { success: boolean, created: number, skipped: number, period: string }
   */
  runScheduledBillingCreation() {
    const startTime = Date.now();
    
    try {
      // Check if should run
      if (!this.shouldCreateBillings()) {
        return {
          success: false,
          created: 0,
          skipped: 0,
          period: null,
          message: 'Scheduler tidak perlu dijalankan hari ini'
        };
      }

      const period = this.getCurrentPeriod();
      
      // Create billings
      const result = this.billingManager.createMonthlyBillings(period);

      // Log execution
      const duration = Date.now() - startTime;
      this.logSchedulerExecution({
        ...result,
        period,
        duration
      });

      // Save last execution date
      this._saveLastExecutionDate();

      return {
        success: result.success,
        created: result.created,
        skipped: result.skipped,
        period,
        message: `Berhasil membuat ${result.created} tagihan untuk periode ${period}`
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.logSchedulerExecution({
        success: false,
        created: 0,
        skipped: 0,
        period: this.getCurrentPeriod(),
        errors: [error.message],
        duration
      });

      return {
        success: false,
        created: 0,
        skipped: 0,
        period: null,
        message: 'Gagal menjalankan scheduler: ' + error.message
      };
    }
  }

  /**
   * Menyimpan log eksekusi scheduler
   * @param {Object} result - Hasil eksekusi
   * @returns {void}
   */
  logSchedulerExecution(result) {
    try {
      const logs = this._getSchedulerLogs();
      
      const logEntry = {
        id: 'LOG-' + Date.now(),
        executedAt: new Date().toISOString(),
        period: result.period,
        created: result.created,
        skipped: result.skipped,
        errors: result.errors || [],
        duration: result.duration,
        success: result.success
      };

      logs.push(logEntry);

      // Keep only last 100 logs
      if (logs.length > 100) {
        logs.splice(0, logs.length - 100);
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(logs));
    } catch (error) {
      console.error('Failed to log scheduler execution:', error);
    }
  }

  /**
   * Mendapatkan riwayat log scheduler
   * @param {number} limit - Maximum number of logs to return
   * @returns {Array}
   */
  getSchedulerLogs(limit = 10) {
    const logs = this._getSchedulerLogs();
    return logs.slice(-limit).reverse();
  }

  /**
   * Get scheduler logs from localStorage
   * @private
   */
  _getSchedulerLogs() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Get last execution date
   * @private
   */
  _getLastExecutionDate() {
    try {
      return localStorage.getItem(this.LAST_EXECUTION_KEY);
    } catch (error) {
      return null;
    }
  }

  /**
   * Save last execution date
   * @private
   */
  _saveLastExecutionDate() {
    try {
      localStorage.setItem(this.LAST_EXECUTION_KEY, new Date().toISOString());
    } catch (error) {
      console.error('Failed to save last execution date:', error);
    }
  }
}

// Export untuk digunakan di browser dan Node.js
export default SchedulerService;
