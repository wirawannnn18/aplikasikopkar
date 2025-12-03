/**
 * Unit tests untuk PaymentProcessor
 * Feature: tagihan-simpanan-wajib-kolektif
 */

import PaymentProcessor from '../js/paymentProcessor.js';
import BillingRepository from '../js/billingRepository.js';
import { MockMemberRepository, MockJournalRepository } from './mocks/mockRepositories.js';

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

describe('PaymentProcessor', () => {
  let paymentProcessor;
  let billingRepository;
  let memberRepository;
  let journalRepository;

  beforeEach(() => {
    localStorage.clear();
    billingRepository = new BillingRepository();
    memberRepository = new MockMemberRepository();
    journalRepository = new MockJournalRepository();
    paymentProcessor = new PaymentProcessor(billingRepository, memberRepository, journalRepository);
  });

  describe('processCollectivePayment()', () => {
    beforeEach(() => {
      // Setup members
      memberRepository.addMember({
        id: 'MEM-001',
        nama: 'John Doe',
        simpananWajibBalance: 0
      });
      memberRepository.addMember({
        id: 'MEM-002',
        nama: 'Jane Smith',
        simpananWajibBalance: 0
      });

      // Setup unpaid billings
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

      billingRepository.save({
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
      });
    });

    test('should process collective payment successfully', () => {
      const result = paymentProcessor.processCollectivePayment(
        ['BIL-001', 'BIL-002'],
        '2024-12-20T10:00:00.000Z',
        'ADMIN-001'
      );

      expect(result.success).toBe(true);
      expect(result.totalAmount).toBe(125000);
      expect(result.count).toBe(2);
    });

    test('should update billing status to dibayar', () => {
      paymentProcessor.processCollectivePayment(
        ['BIL-001', 'BIL-002'],
        '2024-12-20T10:00:00.000Z',
        'ADMIN-001'
      );

      const billing1 = billingRepository.findById('BIL-001');
      const billing2 = billingRepository.findById('BIL-002');

      expect(billing1.status).toBe('dibayar');
      expect(billing2.status).toBe('dibayar');
    });

    test('should record payment date', () => {
      const paymentDate = '2024-12-20T10:00:00.000Z';
      
      paymentProcessor.processCollectivePayment(
        ['BIL-001'],
        paymentDate,
        'ADMIN-001'
      );

      const billing = billingRepository.findById('BIL-001');
      expect(billing.paidAt).toBe(paymentDate);
    });

    test('should record admin who processed payment', () => {
      paymentProcessor.processCollectivePayment(
        ['BIL-001'],
        '2024-12-20T10:00:00.000Z',
        'ADMIN-001'
      );

      const billing = billingRepository.findById('BIL-001');
      expect(billing.paidBy).toBe('ADMIN-001');
    });

    test('should update member balance', () => {
      paymentProcessor.processCollectivePayment(
        ['BIL-001', 'BIL-002'],
        '2024-12-20T10:00:00.000Z',
        'ADMIN-001'
      );

      const member1 = memberRepository.findById('MEM-001');
      const member2 = memberRepository.findById('MEM-002');

      expect(member1.simpananWajibBalance).toBe(50000);
      expect(member2.simpananWajibBalance).toBe(75000);
    });

    test('should create journal entry', () => {
      paymentProcessor.processCollectivePayment(
        ['BIL-001', 'BIL-002'],
        '2024-12-20T10:00:00.000Z',
        'ADMIN-001'
      );

      const journals = journalRepository.findAll();
      expect(journals).toHaveLength(1);
    });

    test('should create journal with correct amount', () => {
      paymentProcessor.processCollectivePayment(
        ['BIL-001', 'BIL-002'],
        '2024-12-20T10:00:00.000Z',
        'ADMIN-001'
      );

      const journal = journalRepository.findAll()[0];
      const debitEntry = journal.entries.find(e => e.account === 'Kas');
      const creditEntry = journal.entries.find(e => e.account === 'Simpanan Wajib');

      expect(debitEntry.debit).toBe(125000);
      expect(creditEntry.credit).toBe(125000);
    });

    test('should create journal with correct accounts', () => {
      paymentProcessor.processCollectivePayment(
        ['BIL-001', 'BIL-002'],
        '2024-12-20T10:00:00.000Z',
        'ADMIN-001'
      );

      const journal = journalRepository.findAll()[0];
      
      expect(journal.entries).toHaveLength(2);
      expect(journal.entries[0].account).toBe('Kas');
      expect(journal.entries[1].account).toBe('Simpanan Wajib');
    });

    test('should include member count and period in journal description', () => {
      paymentProcessor.processCollectivePayment(
        ['BIL-001', 'BIL-002'],
        '2024-12-20T10:00:00.000Z',
        'ADMIN-001'
      );

      const journal = journalRepository.findAll()[0];
      
      expect(journal.description).toContain('2 anggota');
      expect(journal.description).toContain('2024-12');
    });

    test('should set journal date to payment date', () => {
      const paymentDate = '2024-12-20T10:00:00.000Z';
      
      paymentProcessor.processCollectivePayment(
        ['BIL-001'],
        paymentDate,
        'ADMIN-001'
      );

      const journal = journalRepository.findAll()[0];
      expect(journal.date).toBe(paymentDate);
    });

    test('should return error if no billings selected', () => {
      const result = paymentProcessor.processCollectivePayment(
        [],
        '2024-12-20T10:00:00.000Z',
        'ADMIN-001'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Tidak ada tagihan yang dipilih');
    });

    test('should return error if billing not found', () => {
      const result = paymentProcessor.processCollectivePayment(
        ['NON-EXISTENT'],
        '2024-12-20T10:00:00.000Z',
        'ADMIN-001'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('tidak ditemukan');
    });

    test('should return error if billing already paid', () => {
      // Mark billing as paid
      billingRepository.update('BIL-001', {
        status: 'dibayar',
        paidAt: '2024-12-15T00:00:00.000Z',
        paidBy: 'ADMIN-002'
      });

      const result = paymentProcessor.processCollectivePayment(
        ['BIL-001'],
        '2024-12-20T10:00:00.000Z',
        'ADMIN-001'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('sudah dibayar');
    });

    test('should link journal ID to billings', () => {
      paymentProcessor.processCollectivePayment(
        ['BIL-001', 'BIL-002'],
        '2024-12-20T10:00:00.000Z',
        'ADMIN-001'
      );

      const billing1 = billingRepository.findById('BIL-001');
      const billing2 = billingRepository.findById('BIL-002');
      const journal = journalRepository.findAll()[0];

      expect(billing1.journalId).toBe(journal.id);
      expect(billing2.journalId).toBe(journal.id);
    });
  });

  describe('payInitialSaving()', () => {
    beforeEach(() => {
      // Setup member
      memberRepository.addMember({
        id: 'MEM-001',
        nama: 'John Doe',
        simpananPokokBalance: 0
      });

      // Setup simpanan pokok billing
      billingRepository.save({
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
        notes: 'Simpanan pokok anggota baru'
      });
    });

    test('should pay simpanan pokok successfully', () => {
      const result = paymentProcessor.payInitialSaving(
        'BIL-001',
        '2024-12-20T10:00:00.000Z',
        'ADMIN-001'
      );

      expect(result.success).toBe(true);
      expect(result.amount).toBe(250000);
    });

    test('should update billing status to dibayar', () => {
      paymentProcessor.payInitialSaving(
        'BIL-001',
        '2024-12-20T10:00:00.000Z',
        'ADMIN-001'
      );

      const billing = billingRepository.findById('BIL-001');
      expect(billing.status).toBe('dibayar');
    });

    test('should update member simpanan pokok balance', () => {
      paymentProcessor.payInitialSaving(
        'BIL-001',
        '2024-12-20T10:00:00.000Z',
        'ADMIN-001'
      );

      const member = memberRepository.findById('MEM-001');
      expect(member.simpananPokokBalance).toBe(250000);
    });

    test('should create journal with simpanan pokok account', () => {
      paymentProcessor.payInitialSaving(
        'BIL-001',
        '2024-12-20T10:00:00.000Z',
        'ADMIN-001'
      );

      const journal = journalRepository.findAll()[0];
      const creditEntry = journal.entries.find(e => e.credit > 0);

      expect(creditEntry.account).toBe('Simpanan Pokok');
    });

    test('should return error if billing not found', () => {
      const result = paymentProcessor.payInitialSaving(
        'NON-EXISTENT',
        '2024-12-20T10:00:00.000Z',
        'ADMIN-001'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('tidak ditemukan');
    });

    test('should return error if not simpanan pokok type', () => {
      // Create simpanan wajib billing
      billingRepository.save({
        id: 'BIL-002',
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

      const result = paymentProcessor.payInitialSaving(
        'BIL-002',
        '2024-12-20T10:00:00.000Z',
        'ADMIN-001'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('bukan simpanan pokok');
    });

    test('should return error if already paid', () => {
      billingRepository.update('BIL-001', {
        status: 'dibayar',
        paidAt: '2024-12-15T00:00:00.000Z',
        paidBy: 'ADMIN-002'
      });

      const result = paymentProcessor.payInitialSaving(
        'BIL-001',
        '2024-12-20T10:00:00.000Z',
        'ADMIN-001'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('sudah dibayar');
    });
  });

  describe('rollbackPayment()', () => {
    beforeEach(() => {
      // Setup billing
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

      // Mark as paid
      billingRepository.update('BIL-001', {
        status: 'dibayar',
        paidAt: '2024-12-20T10:00:00.000Z',
        paidBy: 'ADMIN-001',
        journalId: 'JRN-001'
      });
    });

    test('should rollback billing to unpaid status', () => {
      paymentProcessor.rollbackPayment(['BIL-001']);

      const billing = billingRepository.findById('BIL-001');
      expect(billing.status).toBe('belum_dibayar');
    });

    test('should clear payment date', () => {
      paymentProcessor.rollbackPayment(['BIL-001']);

      const billing = billingRepository.findById('BIL-001');
      expect(billing.paidAt).toBeNull();
    });

    test('should clear admin ID', () => {
      paymentProcessor.rollbackPayment(['BIL-001']);

      const billing = billingRepository.findById('BIL-001');
      expect(billing.paidBy).toBeNull();
    });

    test('should clear journal ID', () => {
      paymentProcessor.rollbackPayment(['BIL-001']);

      const billing = billingRepository.findById('BIL-001');
      expect(billing.journalId).toBeNull();
    });

    test('should handle multiple billings', () => {
      billingRepository.save({
        id: 'BIL-002',
        memberId: 'MEM-002',
        memberName: 'Jane Smith',
        type: 'simpanan_wajib',
        period: '2024-12',
        amount: 75000,
        status: 'dibayar',
        createdAt: new Date().toISOString(),
        paidAt: '2024-12-20T10:00:00.000Z',
        paidBy: 'ADMIN-001',
        journalId: 'JRN-001',
        notes: null
      });

      paymentProcessor.rollbackPayment(['BIL-001', 'BIL-002']);

      const billing1 = billingRepository.findById('BIL-001');
      const billing2 = billingRepository.findById('BIL-002');

      expect(billing1.status).toBe('belum_dibayar');
      expect(billing2.status).toBe('belum_dibayar');
    });

    test('should not throw error if billing not found', () => {
      expect(() => {
        paymentProcessor.rollbackPayment(['NON-EXISTENT']);
      }).not.toThrow();
    });
  });
});
