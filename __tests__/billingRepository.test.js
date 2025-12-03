/**
 * Unit tests untuk BillingRepository
 * Feature: tagihan-simpanan-wajib-kolektif
 */

import BillingRepository from '../js/billingRepository.js';

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

describe('BillingRepository', () => {
  let repository;

  beforeEach(() => {
    localStorage.clear();
    repository = new BillingRepository();
  });

  describe('save()', () => {
    test('should save a new billing', () => {
      const billing = {
        id: 'BIL-001',
        memberId: 'MEM-001',
        memberName: 'John Doe',
        type: 'simpanan_wajib',
        period: '2024-12',
        amount: 50000,
        status: 'belum_dibayar',
        createdAt: new Date().toISOString(),
        paidAt: null,
        paidBy: null,
        journalId: null,
        notes: null
      };

      const id = repository.save(billing);
      expect(id).toBe('BIL-001');

      const saved = repository.findById('BIL-001');
      expect(saved).toEqual(billing);
    });

    test('should save multiple billings', () => {
      const billing1 = {
        id: 'BIL-001',
        memberId: 'MEM-001',
        memberName: 'John Doe',
        type: 'simpanan_wajib',
        period: '2024-12',
        amount: 50000,
        status: 'belum_dibayar',
        createdAt: new Date().toISOString(),
        paidAt: null,
        paidBy: null,
        journalId: null,
        notes: null
      };

      const billing2 = {
        id: 'BIL-002',
        memberId: 'MEM-002',
        memberName: 'Jane Smith',
        type: 'simpanan_pokok',
        period: null,
        amount: 250000,
        status: 'belum_dibayar',
        createdAt: new Date().toISOString(),
        paidAt: null,
        paidBy: null,
        journalId: null,
        notes: null
      };

      repository.save(billing1);
      repository.save(billing2);

      const all = repository.findAll();
      expect(all).toHaveLength(2);
    });
  });

  describe('findById()', () => {
    test('should find billing by id', () => {
      const billing = {
        id: 'BIL-001',
        memberId: 'MEM-001',
        memberName: 'John Doe',
        type: 'simpanan_wajib',
        period: '2024-12',
        amount: 50000,
        status: 'belum_dibayar',
        createdAt: new Date().toISOString(),
        paidAt: null,
        paidBy: null,
        journalId: null,
        notes: null
      };

      repository.save(billing);
      const found = repository.findById('BIL-001');
      expect(found).toEqual(billing);
    });

    test('should return null if billing not found', () => {
      const found = repository.findById('NON-EXISTENT');
      expect(found).toBeNull();
    });
  });

  describe('findAll()', () => {
    test('should return empty array when no billings', () => {
      const all = repository.findAll();
      expect(all).toEqual([]);
    });

    test('should return all billings', () => {
      const billing1 = {
        id: 'BIL-001',
        memberId: 'MEM-001',
        memberName: 'John Doe',
        type: 'simpanan_wajib',
        period: '2024-12',
        amount: 50000,
        status: 'belum_dibayar',
        createdAt: new Date().toISOString(),
        paidAt: null,
        paidBy: null,
        journalId: null,
        notes: null
      };

      const billing2 = {
        id: 'BIL-002',
        memberId: 'MEM-002',
        memberName: 'Jane Smith',
        type: 'simpanan_wajib',
        period: '2024-12',
        amount: 75000,
        status: 'belum_dibayar',
        createdAt: new Date().toISOString(),
        paidAt: null,
        paidBy: null,
        journalId: null,
        notes: null
      };

      repository.save(billing1);
      repository.save(billing2);

      const all = repository.findAll();
      expect(all).toHaveLength(2);
      expect(all).toContainEqual(billing1);
      expect(all).toContainEqual(billing2);
    });
  });

  describe('update()', () => {
    test('should update billing', () => {
      const billing = {
        id: 'BIL-001',
        memberId: 'MEM-001',
        memberName: 'John Doe',
        type: 'simpanan_wajib',
        period: '2024-12',
        amount: 50000,
        status: 'belum_dibayar',
        createdAt: new Date().toISOString(),
        paidAt: null,
        paidBy: null,
        journalId: null,
        notes: null
      };

      repository.save(billing);

      const updated = repository.update('BIL-001', {
        status: 'dibayar',
        paidAt: new Date().toISOString(),
        paidBy: 'ADMIN-001'
      });

      expect(updated).toBe(true);

      const found = repository.findById('BIL-001');
      expect(found.status).toBe('dibayar');
      expect(found.paidAt).not.toBeNull();
      expect(found.paidBy).toBe('ADMIN-001');
    });

    test('should return false if billing not found', () => {
      const updated = repository.update('NON-EXISTENT', { status: 'dibayar' });
      expect(updated).toBe(false);
    });
  });

  describe('delete()', () => {
    test('should delete billing', () => {
      const billing = {
        id: 'BIL-001',
        memberId: 'MEM-001',
        memberName: 'John Doe',
        type: 'simpanan_wajib',
        period: '2024-12',
        amount: 50000,
        status: 'belum_dibayar',
        createdAt: new Date().toISOString(),
        paidAt: null,
        paidBy: null,
        journalId: null,
        notes: null
      };

      repository.save(billing);
      expect(repository.findAll()).toHaveLength(1);

      const deleted = repository.delete('BIL-001');
      expect(deleted).toBe(true);
      expect(repository.findAll()).toHaveLength(0);
    });

    test('should return false if billing not found', () => {
      const deleted = repository.delete('NON-EXISTENT');
      expect(deleted).toBe(false);
    });
  });

  describe('existsByMemberAndPeriod()', () => {
    test('should return true if billing exists', () => {
      const billing = {
        id: 'BIL-001',
        memberId: 'MEM-001',
        memberName: 'John Doe',
        type: 'simpanan_wajib',
        period: '2024-12',
        amount: 50000,
        status: 'belum_dibayar',
        createdAt: new Date().toISOString(),
        paidAt: null,
        paidBy: null,
        journalId: null,
        notes: null
      };

      repository.save(billing);

      const exists = repository.existsByMemberAndPeriod('MEM-001', '2024-12');
      expect(exists).toBe(true);
    });

    test('should return false if billing does not exist', () => {
      const exists = repository.existsByMemberAndPeriod('MEM-001', '2024-12');
      expect(exists).toBe(false);
    });

    test('should not match simpanan pokok billings', () => {
      const billing = {
        id: 'BIL-001',
        memberId: 'MEM-001',
        memberName: 'John Doe',
        type: 'simpanan_pokok',
        period: null,
        amount: 250000,
        status: 'belum_dibayar',
        createdAt: new Date().toISOString(),
        paidAt: null,
        paidBy: null,
        journalId: null,
        notes: null
      };

      repository.save(billing);

      const exists = repository.existsByMemberAndPeriod('MEM-001', '2024-12');
      expect(exists).toBe(false);
    });
  });

  describe('findByMemberId()', () => {
    test('should find all billings for a member', () => {
      const billing1 = {
        id: 'BIL-001',
        memberId: 'MEM-001',
        memberName: 'John Doe',
        type: 'simpanan_wajib',
        period: '2024-12',
        amount: 50000,
        status: 'belum_dibayar',
        createdAt: new Date().toISOString(),
        paidAt: null,
        paidBy: null,
        journalId: null,
        notes: null
      };

      const billing2 = {
        id: 'BIL-002',
        memberId: 'MEM-001',
        memberName: 'John Doe',
        type: 'simpanan_pokok',
        period: null,
        amount: 250000,
        status: 'belum_dibayar',
        createdAt: new Date().toISOString(),
        paidAt: null,
        paidBy: null,
        journalId: null,
        notes: null
      };

      const billing3 = {
        id: 'BIL-003',
        memberId: 'MEM-002',
        memberName: 'Jane Smith',
        type: 'simpanan_wajib',
        period: '2024-12',
        amount: 75000,
        status: 'belum_dibayar',
        createdAt: new Date().toISOString(),
        paidAt: null,
        paidBy: null,
        journalId: null,
        notes: null
      };

      repository.save(billing1);
      repository.save(billing2);
      repository.save(billing3);

      const memberBillings = repository.findByMemberId('MEM-001');
      expect(memberBillings).toHaveLength(2);
      expect(memberBillings).toContainEqual(billing1);
      expect(memberBillings).toContainEqual(billing2);
    });
  });

  describe('findByPeriod()', () => {
    test('should find all billings for a period', () => {
      const billing1 = {
        id: 'BIL-001',
        memberId: 'MEM-001',
        memberName: 'John Doe',
        type: 'simpanan_wajib',
        period: '2024-12',
        amount: 50000,
        status: 'belum_dibayar',
        createdAt: new Date().toISOString(),
        paidAt: null,
        paidBy: null,
        journalId: null,
        notes: null
      };

      const billing2 = {
        id: 'BIL-002',
        memberId: 'MEM-002',
        memberName: 'Jane Smith',
        type: 'simpanan_wajib',
        period: '2024-12',
        amount: 75000,
        status: 'belum_dibayar',
        createdAt: new Date().toISOString(),
        paidAt: null,
        paidBy: null,
        journalId: null,
        notes: null
      };

      const billing3 = {
        id: 'BIL-003',
        memberId: 'MEM-003',
        memberName: 'Bob Johnson',
        type: 'simpanan_wajib',
        period: '2024-11',
        amount: 60000,
        status: 'belum_dibayar',
        createdAt: new Date().toISOString(),
        paidAt: null,
        paidBy: null,
        journalId: null,
        notes: null
      };

      repository.save(billing1);
      repository.save(billing2);
      repository.save(billing3);

      const periodBillings = repository.findByPeriod('2024-12');
      expect(periodBillings).toHaveLength(2);
      expect(periodBillings).toContainEqual(billing1);
      expect(periodBillings).toContainEqual(billing2);
    });
  });

  describe('findByStatus()', () => {
    test('should find all billings with specific status', () => {
      const billing1 = {
        id: 'BIL-001',
        memberId: 'MEM-001',
        memberName: 'John Doe',
        type: 'simpanan_wajib',
        period: '2024-12',
        amount: 50000,
        status: 'belum_dibayar',
        createdAt: new Date().toISOString(),
        paidAt: null,
        paidBy: null,
        journalId: null,
        notes: null
      };

      const billing2 = {
        id: 'BIL-002',
        memberId: 'MEM-002',
        memberName: 'Jane Smith',
        type: 'simpanan_wajib',
        period: '2024-12',
        amount: 75000,
        status: 'dibayar',
        createdAt: new Date().toISOString(),
        paidAt: new Date().toISOString(),
        paidBy: 'ADMIN-001',
        journalId: 'JRN-001',
        notes: null
      };

      repository.save(billing1);
      repository.save(billing2);

      const unpaidBillings = repository.findByStatus('belum_dibayar');
      expect(unpaidBillings).toHaveLength(1);
      expect(unpaidBillings[0]).toEqual(billing1);

      const paidBillings = repository.findByStatus('dibayar');
      expect(paidBillings).toHaveLength(1);
      expect(paidBillings[0]).toEqual(billing2);
    });
  });

  describe('getStats()', () => {
    test('should return storage statistics', () => {
      const billing = {
        id: 'BIL-001',
        memberId: 'MEM-001',
        memberName: 'John Doe',
        type: 'simpanan_wajib',
        period: '2024-12',
        amount: 50000,
        status: 'belum_dibayar',
        createdAt: new Date().toISOString(),
        paidAt: null,
        paidBy: null,
        journalId: null,
        notes: null
      };

      repository.save(billing);

      const stats = repository.getStats();
      expect(stats.count).toBe(1);
      expect(stats.size).toBeGreaterThan(0);
    });
  });

  describe('clear()', () => {
    test('should clear all billings', () => {
      const billing = {
        id: 'BIL-001',
        memberId: 'MEM-001',
        memberName: 'John Doe',
        type: 'simpanan_wajib',
        period: '2024-12',
        amount: 50000,
        status: 'belum_dibayar',
        createdAt: new Date().toISOString(),
        paidAt: null,
        paidBy: null,
        journalId: null,
        notes: null
      };

      repository.save(billing);
      expect(repository.findAll()).toHaveLength(1);

      repository.clear();
      expect(repository.findAll()).toHaveLength(0);
    });
  });
});
