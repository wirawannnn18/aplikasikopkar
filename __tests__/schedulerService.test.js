/**
 * Unit tests untuk SchedulerService
 * Feature: tagihan-simpanan-wajib-kolektif
 */

import SchedulerService from '../js/schedulerService.js';
import BillingManager from '../js/billingManager.js';
import BillingRepository from '../js/billingRepository.js';
import { MockMemberRepository } from './mocks/mockRepositories.js';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString();
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
})();

global.localStorage = localStorageMock;

describe('SchedulerService', () => {
  let schedulerService;
  let billingManager;
  let billingRepository;
  let memberRepository;

  beforeEach(() => {
    localStorage.clear();
    billingRepository = new BillingRepository();
    memberRepository = new MockMemberRepository();
    billingManager = new BillingManager(billingRepository, memberRepository);
    schedulerService = new SchedulerService(billingManager);
  });

  describe('shouldCreateBillings()', () => {
    test('should return true on 20th of month', () => {
      const date = new Date('2024-12-20');
      const result = schedulerService.shouldCreateBillings(date);
      expect(result).toBe(true);
    });

    test('should return false on other dates', () => {
      const dates = [
        new Date('2024-12-01'),
        new Date('2024-12-15'),
        new Date('2024-12-19'),
        new Date('2024-12-21'),
        new Date('2024-12-31')
      ];

      dates.forEach(date => {
        const result = schedulerService.shouldCreateBillings(date);
        expect(result).toBe(false);
      });
    });

    test('should return false if already executed today', () => {
      const date = new Date('2024-12-20');
      
      // First check - should return true
      expect(schedulerService.shouldCreateBillings(date)).toBe(true);
      
      // Save execution date
      localStorage.setItem('lastSchedulerExecution', date.toISOString());
      
      // Second check - should return false
      expect(schedulerService.shouldCreateBillings(date)).toBe(false);
    });

    test('should return true if executed on different day', () => {
      const yesterday = new Date('2024-12-20');
      const today = new Date('2024-01-20'); // Next month
      
      // Save yesterday's execution
      localStorage.setItem('lastSchedulerExecution', yesterday.toISOString());
      
      // Check today - should return true
      expect(schedulerService.shouldCreateBillings(today)).toBe(true);
    });

    test('should work across different months', () => {
      const dates = [
        new Date('2024-01-20'),
        new Date('2024-02-20'),
        new Date('2024-03-20'),
        new Date('2024-12-20')
      ];

      dates.forEach(date => {
        const result = schedulerService.shouldCreateBillings(date);
        expect(result).toBe(true);
      });
    });
  });

  describe('getCurrentPeriod()', () => {
    test('should return correct period format YYYY-MM', () => {
      const date = new Date('2024-12-20');
      const period = schedulerService.getCurrentPeriod(date);
      expect(period).toBe('2024-12');
    });

    test('should pad month with zero', () => {
      const dates = [
        { date: new Date('2024-01-20'), expected: '2024-01' },
        { date: new Date('2024-02-20'), expected: '2024-02' },
        { date: new Date('2024-09-20'), expected: '2024-09' }
      ];

      dates.forEach(({ date, expected }) => {
        const period = schedulerService.getCurrentPeriod(date);
        expect(period).toBe(expected);
      });
    });

    test('should handle different years', () => {
      const dates = [
        { date: new Date('2023-12-20'), expected: '2023-12' },
        { date: new Date('2024-12-20'), expected: '2024-12' },
        { date: new Date('2025-12-20'), expected: '2025-12' }
      ];

      dates.forEach(({ date, expected }) => {
        const period = schedulerService.getCurrentPeriod(date);
        expect(period).toBe(expected);
      });
    });

    test('should use current date if no date provided', () => {
      const period = schedulerService.getCurrentPeriod();
      expect(period).toMatch(/^\d{4}-\d{2}$/);
    });
  });

  describe('runScheduledBillingCreation()', () => {
    beforeEach(() => {
      // Setup members
      memberRepository.addMember({
        id: 'MEM-001',
        nama: 'John Doe',
        status: 'aktif',
        simpananWajibAmount: 50000
      });
      memberRepository.addMember({
        id: 'MEM-002',
        nama: 'Jane Smith',
        status: 'aktif',
        simpananWajibAmount: 75000
      });
    });

    test('should create billings on 20th', () => {
      // Mock current date to 20th
      const originalDate = Date;
      global.Date = class extends originalDate {
        constructor(...args) {
          if (args.length === 0) {
            return new originalDate('2024-12-20T10:00:00.000Z');
          }
          return new originalDate(...args);
        }
        static now() {
          return new originalDate('2024-12-20T10:00:00.000Z').getTime();
        }
      };

      const result = schedulerService.runScheduledBillingCreation();

      expect(result.success).toBe(true);
      expect(result.created).toBe(2);
      expect(result.period).toBe('2024-12');

      // Restore Date
      global.Date = originalDate;
    });

    test('should not run on other dates', () => {
      // Mock current date to 15th
      const originalDate = Date;
      global.Date = class extends originalDate {
        constructor(...args) {
          if (args.length === 0) {
            return new originalDate('2024-12-15T10:00:00.000Z');
          }
          return new originalDate(...args);
        }
        static now() {
          return new originalDate('2024-12-15T10:00:00.000Z').getTime();
        }
      };

      const result = schedulerService.runScheduledBillingCreation();

      expect(result.success).toBe(false);
      expect(result.message).toContain('tidak perlu dijalankan');

      // Restore Date
      global.Date = originalDate;
    });

    test('should save last execution date', () => {
      const originalDate = Date;
      global.Date = class extends originalDate {
        constructor(...args) {
          if (args.length === 0) {
            return new originalDate('2024-12-20T10:00:00.000Z');
          }
          return new originalDate(...args);
        }
        static now() {
          return new originalDate('2024-12-20T10:00:00.000Z').getTime();
        }
      };

      schedulerService.runScheduledBillingCreation();

      const lastExecution = localStorage.getItem('lastSchedulerExecution');
      expect(lastExecution).toBeDefined();
      expect(lastExecution).not.toBeNull();

      global.Date = originalDate;
    });

    test('should log execution', () => {
      const originalDate = Date;
      global.Date = class extends originalDate {
        constructor(...args) {
          if (args.length === 0) {
            return new originalDate('2024-12-20T10:00:00.000Z');
          }
          return new originalDate(...args);
        }
        static now() {
          return new originalDate('2024-12-20T10:00:00.000Z').getTime();
        }
      };

      schedulerService.runScheduledBillingCreation();

      const logs = schedulerService.getSchedulerLogs();
      expect(logs.length).toBeGreaterThan(0);

      global.Date = originalDate;
    });

    test('should return created count', () => {
      const originalDate = Date;
      global.Date = class extends originalDate {
        constructor(...args) {
          if (args.length === 0) {
            return new originalDate('2024-12-20T10:00:00.000Z');
          }
          return new originalDate(...args);
        }
        static now() {
          return new originalDate('2024-12-20T10:00:00.000Z').getTime();
        }
      };

      const result = schedulerService.runScheduledBillingCreation();

      expect(result.created).toBe(2);
      expect(result.skipped).toBe(0);

      global.Date = originalDate;
    });
  });

  describe('logSchedulerExecution()', () => {
    test('should save execution log', () => {
      const result = {
        success: true,
        created: 5,
        skipped: 2,
        period: '2024-12',
        errors: [],
        duration: 150
      };

      schedulerService.logSchedulerExecution(result);

      const logs = schedulerService.getSchedulerLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].created).toBe(5);
      expect(logs[0].skipped).toBe(2);
    });

    test('should include all execution details', () => {
      const result = {
        success: true,
        created: 5,
        skipped: 2,
        period: '2024-12',
        errors: ['Error 1'],
        duration: 150
      };

      schedulerService.logSchedulerExecution(result);

      const logs = schedulerService.getSchedulerLogs();
      const log = logs[0];

      expect(log.executedAt).toBeDefined();
      expect(log.period).toBe('2024-12');
      expect(log.created).toBe(5);
      expect(log.skipped).toBe(2);
      expect(log.errors).toEqual(['Error 1']);
      expect(log.duration).toBe(150);
      expect(log.success).toBe(true);
    });

    test('should keep only last 100 logs', () => {
      // Create 105 logs
      for (let i = 0; i < 105; i++) {
        schedulerService.logSchedulerExecution({
          success: true,
          created: i,
          skipped: 0,
          period: '2024-12',
          errors: [],
          duration: 100
        });
      }

      const logs = schedulerService.getSchedulerLogs(200); // Request more than 100
      expect(logs.length).toBeLessThanOrEqual(100);
    });

    test('should handle errors gracefully', () => {
      const result = {
        success: false,
        created: 0,
        skipped: 0,
        period: '2024-12',
        errors: ['Database error', 'Network error'],
        duration: 50
      };

      expect(() => {
        schedulerService.logSchedulerExecution(result);
      }).not.toThrow();

      const logs = schedulerService.getSchedulerLogs();
      expect(logs[0].success).toBe(false);
      expect(logs[0].errors).toHaveLength(2);
    });
  });

  describe('getSchedulerLogs()', () => {
    beforeEach(() => {
      // Create some logs
      for (let i = 0; i < 5; i++) {
        schedulerService.logSchedulerExecution({
          success: true,
          created: i,
          skipped: 0,
          period: '2024-12',
          errors: [],
          duration: 100
        });
      }
    });

    test('should return logs in reverse order (newest first)', () => {
      const logs = schedulerService.getSchedulerLogs();
      
      // Newest should have highest created count
      expect(logs[0].created).toBe(4);
      expect(logs[logs.length - 1].created).toBe(0);
    });

    test('should limit number of logs returned', () => {
      const logs = schedulerService.getSchedulerLogs(3);
      expect(logs).toHaveLength(3);
    });

    test('should return empty array if no logs', () => {
      localStorage.clear();
      const logs = schedulerService.getSchedulerLogs();
      expect(logs).toEqual([]);
    });

    test('should default to 10 logs', () => {
      // Create 15 logs
      for (let i = 5; i < 20; i++) {
        schedulerService.logSchedulerExecution({
          success: true,
          created: i,
          skipped: 0,
          period: '2024-12',
          errors: [],
          duration: 100
        });
      }

      const logs = schedulerService.getSchedulerLogs();
      expect(logs).toHaveLength(10);
    });
  });
});
