/**
 * Unit tests untuk BillingManager
 * Feature: tagihan-simpanan-wajib-kolektif
 */

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

describe('BillingManager', () => {
  let billingManager;
  let billingRepository;
  let memberRepository;

  beforeEach(() => {
    localStorage.clear();
    billingRepository = new BillingRepository();
    memberRepository = new MockMemberRepository();
    billingManager = new BillingManager(billingRepository, memberRepository);
  });

  describe('createMonthlyBillings()', () => {
    test('should create billings for all active members', () => {
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

      const result = billingManager.createMonthlyBillings('2024-12');

      expect(result.success).toBe(true);
      expect(result.created).toBe(2);
      expect(result.skipped).toBe(0);

      const billings = billingRepository.findAll();
      expect(billings).toHaveLength(2);
    });

    test('should skip inactive members', () => {
      memberRepository.addMember({
        id: 'MEM-001',
        nama: 'John Doe',
        status: 'aktif',
        simpananWajibAmount: 50000
      });
      memberRepository.addMember({
        id: 'MEM-002',
        nama: 'Jane Smith',
        status: 'tidak aktif',
        simpananWajibAmount: 75000
      });

      const result = billingManager.createMonthlyBillings('2024-12');

      expect(result.success).toBe(true);
      expect(result.created).toBe(1);
      expect(result.skipped).toBe(1);
    });

    test('should not create duplicate billings for same period', () => {
      memberRepository.addMember({
        id: 'MEM-001',
        nama: 'John Doe',
        status: 'aktif',
        simpananWajibAmount: 50000
      });

      // First creation
      const result1 = billingManager.createMonthlyBillings('2024-12');
      expect(result1.created).toBe(1);

      // Second creation - should skip
      const result2 = billingManager.createMonthlyBillings('2024-12');
      expect(result2.created).toBe(0);
      expect(result2.skipped).toBe(1);

      // Should only have 1 billing
      const billings = billingRepository.findAll();
      expect(billings).toHaveLength(1);
    });

    test('should use correct period format', () => {
      memberRepository.addMember({
        id: 'MEM-001',
        nama: 'John Doe',
        status: 'aktif',
        simpananWajibAmount: 50000
      });

      billingManager.createMonthlyBillings('2024-12');

      const billings = billingRepository.findAll();
      expect(billings[0].period).toBe('2024-12');
    });

    test('should set status to belum_dibayar', () => {
      memberRepository.addMember({
        id: 'MEM-001',
        nama: 'John Doe',
        status: 'aktif',
        simpananWajibAmount: 50000
      });

      billingManager.createMonthlyBillings('2024-12');

      const billings = billingRepository.findAll();
      expect(billings[0].status).toBe('belum_dibayar');
    });

    test('should use member simpananWajibAmount', () => {
      memberRepository.addMember({
        id: 'MEM-001',
        nama: 'John Doe',
        status: 'aktif',
        simpananWajibAmount: 50000
      });

      billingManager.createMonthlyBillings('2024-12');

      const billings = billingRepository.findAll();
      expect(billings[0].amount).toBe(50000);
    });

    test('should reject invalid period format', () => {
      memberRepository.addMember({
        id: 'MEM-001',
        nama: 'John Doe',
        status: 'aktif',
        simpananWajibAmount: 50000
      });

      const result = billingManager.createMonthlyBillings('2024/12');

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Format periode tidak valid. Gunakan format YYYY-MM');
    });

    test('should skip members without simpananWajibAmount', () => {
      memberRepository.addMember({
        id: 'MEM-001',
        nama: 'John Doe',
        status: 'aktif',
        simpananWajibAmount: 0
      });

      const result = billingManager.createMonthlyBillings('2024-12');

      expect(result.created).toBe(0);
      expect(result.skipped).toBe(1);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should use default amount from system settings if member amount not set', () => {
      // Set system settings
      localStorage.setItem('systemSettings', JSON.stringify({
        simpananWajibDefaultAmount: 100000
      }));

      memberRepository.addMember({
        id: 'MEM-001',
        nama: 'John Doe',
        status: 'aktif',
        simpananWajibAmount: null
      });

      const result = billingManager.createMonthlyBillings('2024-12');

      expect(result.created).toBe(1);
      const billings = billingRepository.findAll();
      expect(billings[0].amount).toBe(100000);
    });
  });

  describe('createInitialSavingBilling()', () => {
    test('should create simpanan pokok billing with 250000', () => {
      memberRepository.addMember({
        id: 'MEM-001',
        nama: 'John Doe',
        status: 'aktif'
      });

      const result = billingManager.createInitialSavingBilling('MEM-001');

      expect(result.success).toBe(true);
      expect(result.billingId).toBeDefined();

      const billing = billingRepository.findById(result.billingId);
      expect(billing.amount).toBe(250000);
      expect(billing.type).toBe('simpanan_pokok');
      expect(billing.status).toBe('belum_dibayar');
    });

    test('should return error if member not found', () => {
      const result = billingManager.createInitialSavingBilling('NON-EXISTENT');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Anggota tidak ditemukan');
    });

    test('should not create duplicate simpanan pokok billing', () => {
      memberRepository.addMember({
        id: 'MEM-001',
        nama: 'John Doe',
        status: 'aktif'
      });

      // First creation
      const result1 = billingManager.createInitialSavingBilling('MEM-001');
      expect(result1.success).toBe(true);

      // Second creation - should fail
      const result2 = billingManager.createInitialSavingBilling('MEM-001');
      expect(result2.success).toBe(false);
      expect(result2.error).toContain('sudah ada');
    });
  });

  describe('getBillings()', () => {
    beforeEach(() => {
      // Setup test data
      memberRepository.addMember({ id: 'MEM-001', nama: 'John Doe', status: 'aktif' });
      memberRepository.addMember({ id: 'MEM-002', nama: 'Jane Smith', status: 'aktif' });

      billingRepository.save({
        id: 'BIL-001',
        memberId: 'MEM-001',
        memberName: 'John Doe',
        type: 'simpanan_wajib',
        period: '2024-12',
        amount: 50000,
        status: 'belum_dibayar',
        createdAt: '2024-12-01T00:00:00.000Z',
        paidAt: null,
        paidBy: null,
        journalId: null,
        notes: null
      });

      billingRepository.save({
        id: 'BIL-002',
        memberId: 'MEM-002',
        memberName: 'Jane Smith',
        type: 'simpanan_wajib',
        period: '2024-12',
        amount: 75000,
        status: 'dibayar',
        createdAt: '2024-12-02T00:00:00.000Z',
        paidAt: '2024-12-10T00:00:00.000Z',
        paidBy: 'ADMIN-001',
        journalId: 'JRN-001',
        notes: null
      });

      billingRepository.save({
        id: 'BIL-003',
        memberId: 'MEM-001',
        memberName: 'John Doe',
        type: 'simpanan_wajib',
        period: '2024-11',
        amount: 50000,
        status: 'dibayar',
        createdAt: '2024-11-01T00:00:00.000Z',
        paidAt: '2024-11-10T00:00:00.000Z',
        paidBy: 'ADMIN-001',
        journalId: 'JRN-002',
        notes: null
      });
    });

    test('should return all billings without filters', () => {
      const billings = billingManager.getBillings();
      expect(billings).toHaveLength(3);
    });

    test('should filter by status', () => {
      const unpaid = billingManager.getBillings({ status: 'belum_dibayar' });
      expect(unpaid).toHaveLength(1);
      expect(unpaid[0].status).toBe('belum_dibayar');

      const paid = billingManager.getBillings({ status: 'dibayar' });
      expect(paid).toHaveLength(2);
      paid.forEach(b => expect(b.status).toBe('dibayar'));
    });

    test('should filter by period', () => {
      const dec2024 = billingManager.getBillings({ period: '2024-12' });
      expect(dec2024).toHaveLength(2);
      dec2024.forEach(b => expect(b.period).toBe('2024-12'));
    });

    test('should search by member name', () => {
      const johnBillings = billingManager.getBillings({ search: 'John' });
      expect(johnBillings).toHaveLength(2);
      johnBillings.forEach(b => expect(b.memberName).toContain('John'));
    });

    test('should search case-insensitively', () => {
      const results = billingManager.getBillings({ search: 'john' });
      expect(results).toHaveLength(2);
    });

    test('should sort by createdAt descending', () => {
      const billings = billingManager.getBillings();
      
      // Should be sorted newest first
      expect(new Date(billings[0].createdAt).getTime())
        .toBeGreaterThanOrEqual(new Date(billings[1].createdAt).getTime());
      expect(new Date(billings[1].createdAt).getTime())
        .toBeGreaterThanOrEqual(new Date(billings[2].createdAt).getTime());
    });

    test('should combine multiple filters', () => {
      const results = billingManager.getBillings({
        status: 'dibayar',
        period: '2024-12'
      });
      
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('BIL-002');
    });
  });

  describe('deleteBilling()', () => {
    test('should delete unpaid billing', () => {
      billingRepository.save({
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
      });

      const result = billingManager.deleteBilling('BIL-001');

      expect(result.success).toBe(true);
      expect(result.message).toContain('berhasil');

      const billing = billingRepository.findById('BIL-001');
      expect(billing).toBeNull();
    });

    test('should not delete paid billing', () => {
      billingRepository.save({
        id: 'BIL-001',
        memberId: 'MEM-001',
        memberName: 'John Doe',
        type: 'simpanan_wajib',
        period: '2024-12',
        amount: 50000,
        status: 'dibayar',
        createdAt: new Date().toISOString(),
        paidAt: new Date().toISOString(),
        paidBy: 'ADMIN-001',
        journalId: 'JRN-001',
        notes: null
      });

      const result = billingManager.deleteBilling('BIL-001');

      expect(result.success).toBe(false);
      expect(result.message).toContain('sudah dibayar tidak dapat dihapus');

      // Billing should still exist
      const billing = billingRepository.findById('BIL-001');
      expect(billing).not.toBeNull();
    });

    test('should return error if billing not found', () => {
      const result = billingManager.deleteBilling('NON-EXISTENT');

      expect(result.success).toBe(false);
      expect(result.message).toContain('tidak ditemukan');
    });
  });

  describe('getMemberPaymentHistory()', () => {
    beforeEach(() => {
      // Setup paid billings for member
      billingRepository.save({
        id: 'BIL-001',
        memberId: 'MEM-001',
        memberName: 'John Doe',
        type: 'simpanan_wajib',
        period: '2024-12',
        amount: 50000,
        status: 'dibayar',
        createdAt: '2024-12-01T00:00:00.000Z',
        paidAt: '2024-12-10T00:00:00.000Z',
        paidBy: 'ADMIN-001',
        journalId: 'JRN-001',
        notes: null
      });

      billingRepository.save({
        id: 'BIL-002',
        memberId: 'MEM-001',
        memberName: 'John Doe',
        type: 'simpanan_wajib',
        period: '2024-11',
        amount: 50000,
        status: 'dibayar',
        createdAt: '2024-11-01T00:00:00.000Z',
        paidAt: '2024-11-10T00:00:00.000Z',
        paidBy: 'ADMIN-001',
        journalId: 'JRN-002',
        notes: null
      });

      billingRepository.save({
        id: 'BIL-003',
        memberId: 'MEM-001',
        memberName: 'John Doe',
        type: 'simpanan_wajib',
        period: '2024-10',
        amount: 50000,
        status: 'belum_dibayar',
        createdAt: '2024-10-01T00:00:00.000Z',
        paidAt: null,
        paidBy: null,
        journalId: null,
        notes: null
      });
    });

    test('should return only paid billings', () => {
      const result = billingManager.getMemberPaymentHistory('MEM-001');

      expect(result.history).toHaveLength(2);
      result.history.forEach(b => expect(b.status).toBe('dibayar'));
    });

    test('should calculate total correctly', () => {
      const result = billingManager.getMemberPaymentHistory('MEM-001');

      expect(result.total).toBe(100000); // 50000 + 50000
    });

    test('should sort by period descending', () => {
      const result = billingManager.getMemberPaymentHistory('MEM-001');

      expect(result.history[0].period).toBe('2024-12');
      expect(result.history[1].period).toBe('2024-11');
    });

    test('should filter by date range', () => {
      const result = billingManager.getMemberPaymentHistory('MEM-001', {
        startDate: '2024-12-01',
        endDate: '2024-12-31'
      });

      expect(result.history).toHaveLength(1);
      expect(result.history[0].period).toBe('2024-12');
    });

    test('should return empty history for member with no payments', () => {
      const result = billingManager.getMemberPaymentHistory('MEM-999');

      expect(result.history).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });
});
