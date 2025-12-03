/**
 * Mock repositories untuk testing
 * Feature: tagihan-simpanan-wajib-kolektif
 */

export class MockMemberRepository {
  constructor() {
    this.members = [];
  }

  findAll() {
    return this.members;
  }

  findById(id) {
    return this.members.find(m => m.id === id) || null;
  }

  save(member) {
    this.members.push(member);
    return member.id;
  }

  update(id, updates) {
    const index = this.members.findIndex(m => m.id === id);
    if (index === -1) return false;
    
    this.members[index] = {
      ...this.members[index],
      ...updates
    };
    return true;
  }

  clear() {
    this.members = [];
  }

  // Helper untuk testing
  addMember(member) {
    const defaultMember = {
      id: 'MEM-' + Date.now(),
      nama: 'Test Member',
      status: 'aktif',
      simpananWajibAmount: 50000,
      simpananPokokBalance: 0,
      simpananWajibBalance: 0,
      ...member
    };
    this.members.push(defaultMember);
    return defaultMember;
  }
}

export class MockJournalRepository {
  constructor() {
    this.journals = [];
  }

  findAll() {
    return this.journals;
  }

  findById(id) {
    return this.journals.find(j => j.id === id) || null;
  }

  save(journal) {
    this.journals.push(journal);
    return journal.id;
  }

  clear() {
    this.journals = [];
  }
}

export default {
  MockMemberRepository,
  MockJournalRepository
};
