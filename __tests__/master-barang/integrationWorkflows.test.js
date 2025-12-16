/**
 * Integration Tests for Master Barang System Workflows
 * 
 * Tests complete CRUD workflows, import/export workflows, 
 * bulk operations workflows, and audit logging workflows
 * 
 * Task 13.1: Write integration tests for system workflows
 * Requirements: All requirements
 */

import { jest } from '@jest/globals';

// Mock localStorage
const mockLocalStorage = {
  data: {},
  getItem: jest.fn((key) => mockLocalStorage.data[key] || null),
  setItem: jest.fn((key, value) => {
    mockLocalStorage.data[key] = value;
  }),
  removeItem: jest.fn((key) => {
    delete mockLocalStorage.data[key];
  }),
  clear: jest.fn(() => {
    mockLocalStorage.data = {};
  })
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

// Mock DOM elements
const mockDOM = {
  getElementById: jest.fn(),
  createElement: jest.fn(),
  querySelector: jest.fn(),
  querySelectorAll: jest.fn()
};

Object.defineProperty(global, 'document', {
  value: mockDOM
});

// Mock file reading
global.FileReader = class {
  constructor() {
    this.onload = null;
    this.onerror = null;
  }
  
  readAsText(file) {
    setTimeout(() => {
      if (this.onload) {
        this.onload({
          target: {
            result: 'kode,nama,kategori,satuan,harga_beli,harga_jual,stok\nBRG001,Barang Test,Kategori A,PCS,1000,1500,10'
          }
        });
      }
    }, 10);
  }
};

// Import system components
import { MasterBarangSystem } from '../../js/master-barang/MasterBarangSystem.js';
import { BarangManager } from '../../js/master-barang/BarangManager.js';
import { KategoriManager } from '../../js/master-barang/KategoriManager.js';
import { SatuanManager } from '../../js/master-barang/SatuanManager.js';
import { ImportManager } from '../../js/master-barang/ImportManager.js';
import { ExportManager } from '../../js/master-barang/ExportManager.js';
import { BulkOperationsManager } from '../../js/master-barang/BulkOperationsManager.js';
import { AuditLogger } from '../../js/master-barang/AuditLogger.js';

describe('Master Barang System - Integration Workflows', () => {
  let system;
  let barangManager;
  let kategoriManager;
  let satuanManager;
  let importManager;
  let exportManager;
  let bulkOperationsManager;
  let auditLogger;

  beforeEach(() => {
    // Clear localStorage
    mockLocalStorage.clear();
    jest.clearAllMocks();
    
    // Initialize system components
    system = new MasterBarangSystem();
    barangManager = new BarangManager();
    kategoriManager = new KategoriManager();
    satuanManager = new SatuanManager();
    importManager = new ImportManager();
    exportManager = new ExportManager();
    bulkOperationsManager = new BulkOperationsManager();
    auditLogger = new AuditLogger();
    
    // Setup initial data
    setupInitialData();
  });

  function setupInitialData() {
    // Setup initial categories
    const categories = [
      { id: 'cat1', nama: 'ELEKTRONIK', status: 'aktif' },
      { id: 'cat2', nama: 'MAKANAN', status: 'aktif' },
      { id: 'cat3', nama: 'MINUMAN', status: 'aktif' }
    ];
    
    // Setup initial units
    const units = [
      { id: 'unit1', nama: 'PCS', status: 'aktif' },
      { id: 'unit2', nama: 'KG', status: 'aktif' },
      { id: 'unit3', nama: 'LITER', status: 'aktif' }
    ];
    
    // Setup initial barang
    const barang = [
      {
        id: 'brg1',
        kode: 'BRG001',
        nama: 'Laptop Gaming',
        kategori_id: 'cat1',
        kategori_nama: 'ELEKTRONIK',
        satuan_id: 'unit1',
        satuan_nama: 'PCS',
        harga_beli: 5000000,
        harga_jual: 6000000,
        stok: 5,
        stok_minimum: 2,
        status: 'aktif'
      },
      {
        id: 'brg2',
        kode: 'BRG002',
        nama: 'Beras Premium',
        kategori_id: 'cat2',
        kategori_nama: 'MAKANAN',
        satuan_id: 'unit2',
        satuan_nama: 'KG',
        harga_beli: 12000,
        harga_jual: 15000,
        stok: 100,
        stok_minimum: 20,
        status: 'aktif'
      }
    ];
    
    localStorage.setItem('master_barang_categories', JSON.stringify(categories));
    localStorage.setItem('master_barang_units', JSON.stringify(units));
    localStorage.setItem('master_barang_items', JSON.stringify(barang));
  }

  describe('Complete CRUD Workflows', () => {
    test('should complete full CRUD workflow for barang', async () => {
      // CREATE: Add new barang
      const newBarang = {
        kode: 'BRG003',
        nama: 'Air Mineral',
        kategori_id: 'cat3',
        satuan_id: 'unit3',
        harga_beli: 3000,
        harga_jual: 4000,
        stok: 50,
        stok_minimum: 10
      };
      
      const createResult = await barangManager.create(newBarang);
      expect(createResult.success).toBe(true);
      expect(createResult.data.kode).toBe('BRG003');
      
      // Verify audit log for create
      const auditLogs = auditLogger.getLogs();
      const createLog = auditLogs.find(log => 
        log.action === 'create' && log.record_id === createResult.data.id
      );
      expect(createLog).toBeDefined();
      expect(createLog.new_data.kode).toBe('BRG003');
      
      // READ: Get the created barang
      const readResult = barangManager.getById(createResult.data.id);
      expect(readResult).toBeDefined();
      expect(readResult.kode).toBe('BRG003');
      expect(readResult.nama).toBe('Air Mineral');
      
      // UPDATE: Modify the barang
      const updateData = {
        ...readResult,
        nama: 'Air Mineral Premium',
        harga_jual: 4500,
        stok: 75
      };
      
      const updateResult = await barangManager.update(updateData.id, updateData);
      expect(updateResult.success).toBe(true);
      expect(updateResult.data.nama).toBe('Air Mineral Premium');
      expect(updateResult.data.harga_jual).toBe(4500);
      
      // Verify audit log for update
      const updateLog = auditLogs.find(log => 
        log.action === 'update' && log.record_id === updateData.id
      );
      expect(updateLog).toBeDefined();
      expect(updateLog.old_data.nama).toBe('Air Mineral');
      expect(updateLog.new_data.nama).toBe('Air Mineral Premium');
      
      // DELETE: Remove the barang
      const deleteResult = await barangManager.delete(updateData.id);
      expect(deleteResult.success).toBe(true);
      
      // Verify audit log for delete
      const deleteLog = auditLogs.find(log => 
        log.action === 'delete' && log.record_id === updateData.id
      );
      expect(deleteLog).toBeDefined();
      expect(deleteLog.old_data.nama).toBe('Air Mineral Premium');
      
      // Verify barang is deleted
      const deletedBarang = barangManager.getById(updateData.id);
      expect(deletedBarang).toBeNull();
    });

    test('should complete category management workflow', async () => {
      // CREATE: Add new category
      const newCategory = {
        nama: 'PAKAIAN',
        deskripsi: 'Kategori untuk produk pakaian'
      };
      
      const createResult = await kategoriManager.create(newCategory);
      expect(createResult.success).toBe(true);
      expect(createResult.data.nama).toBe('PAKAIAN');
      
      // UPDATE: Modify category
      const updateData = {
        ...createResult.data,
        deskripsi: 'Kategori untuk semua jenis pakaian dan aksesoris'
      };
      
      const updateResult = await kategoriManager.update(updateData.id, updateData);
      expect(updateResult.success).toBe(true);
      expect(updateResult.data.deskripsi).toBe('Kategori untuk semua jenis pakaian dan aksesoris');
      
      // DELETE: Try to delete category (should succeed as no barang uses it)
      const deleteResult = await kategoriManager.delete(updateData.id);
      expect(deleteResult.success).toBe(true);
      
      // Verify category is deleted
      const deletedCategory = kategoriManager.getById(updateData.id);
      expect(deletedCategory).toBeNull();
    });

    test('should prevent category deletion when used by barang', async () => {
      // Try to delete category that is used by existing barang
      const deleteResult = await kategoriManager.delete('cat1'); // ELEKTRONIK category
      expect(deleteResult.success).toBe(false);
      expect(deleteResult.error).toContain('digunakan oleh');
      
      // Verify category still exists
      const category = kategoriManager.getById('cat1');
      expect(category).toBeDefined();
      expect(category.nama).toBe('ELEKTRONIK');
    });
  });

  describe('Import/Export Workflows', () => {
    test('should complete full import workflow', async () => {
      // Prepare import data
      const importData = [
        {
          kode: 'IMP001',
          nama: 'Imported Item 1',
          kategori: 'ELEKTRONIK',
          satuan: 'PCS',
          harga_beli: 100000,
          harga_jual: 120000,
          stok: 10
        },
        {
          kode: 'IMP002',
          nama: 'Imported Item 2',
          kategori: 'NEW_CATEGORY', // New category
          satuan: 'UNIT', // New unit
          harga_beli: 50000,
          harga_jual: 60000,
          stok: 20
        }
      ];
      
      // Mock file object
      const mockFile = {
        name: 'import_test.csv',
        type: 'text/csv',
        size: 1000
      };
      
      // Process import
      const importResult = await importManager.processImport(importData, mockFile);
      expect(importResult.success).toBe(true);
      expect(importResult.imported_count).toBe(2);
      expect(importResult.new_categories.length).toBe(1);
      expect(importResult.new_units.length).toBe(1);
      
      // Verify imported items exist
      const allBarang = barangManager.getAll();
      const importedItem1 = allBarang.find(item => item.kode === 'IMP001');
      const importedItem2 = allBarang.find(item => item.kode === 'IMP002');
      
      expect(importedItem1).toBeDefined();
      expect(importedItem1.nama).toBe('Imported Item 1');
      expect(importedItem2).toBeDefined();
      expect(importedItem2.nama).toBe('Imported Item 2');
      
      // Verify new category and unit were created
      const allCategories = kategoriManager.getAll();
      const newCategory = allCategories.find(cat => cat.nama === 'NEW_CATEGORY');
      expect(newCategory).toBeDefined();
      
      const allUnits = satuanManager.getAll();
      const newUnit = allUnits.find(unit => unit.nama === 'UNIT');
      expect(newUnit).toBeDefined();
      
      // Verify audit log for import
      const auditLogs = auditLogger.getLogs();
      const importLog = auditLogs.find(log => log.action === 'import');
      expect(importLog).toBeDefined();
      expect(importLog.additional_info.file_name).toBe('import_test.csv');
      expect(importLog.additional_info.imported_count).toBe(2);
    });

    test('should complete full export workflow', async () => {
      // Export all data
      const exportResult = await exportManager.exportData({
        format: 'csv',
        filters: {}
      });
      
      expect(exportResult.success).toBe(true);
      expect(exportResult.data).toBeDefined();
      expect(exportResult.filename).toContain('master_barang_export');
      expect(exportResult.filename).toContain('.csv');
      
      // Verify exported data contains expected items
      const exportedData = exportResult.data;
      expect(exportedData.length).toBeGreaterThan(0);
      
      const exportedItem = exportedData.find(item => item.kode === 'BRG001');
      expect(exportedItem).toBeDefined();
      expect(exportedItem.nama).toBe('Laptop Gaming');
      
      // Verify audit log for export
      const auditLogs = auditLogger.getLogs();
      const exportLog = auditLogs.find(log => log.action === 'export');
      expect(exportLog).toBeDefined();
      expect(exportLog.additional_info.format).toBe('csv');
      expect(exportLog.additional_info.exported_count).toBe(exportedData.length);
    });

    test('should export with filters applied', async () => {
      // Export only ELEKTRONIK category
      const exportResult = await exportManager.exportData({
        format: 'csv',
        filters: {
          kategori_id: 'cat1'
        }
      });
      
      expect(exportResult.success).toBe(true);
      
      // Verify only ELEKTRONIK items are exported
      const exportedData = exportResult.data;
      exportedData.forEach(item => {
        expect(item.kategori_nama).toBe('ELEKTRONIK');
      });
      
      // Should contain BRG001 but not BRG002
      const elektronikItem = exportedData.find(item => item.kode === 'BRG001');
      const makananItem = exportedData.find(item => item.kode === 'BRG002');
      
      expect(elektronikItem).toBeDefined();
      expect(makananItem).toBeUndefined();
    });
  });

  describe('Bulk Operations Workflows', () => {
    test('should complete bulk delete workflow', async () => {
      // Get initial barang count
      const initialBarang = barangManager.getAll();
      const initialCount = initialBarang.length;
      
      // Select items for bulk delete
      const itemsToDelete = ['brg1', 'brg2'];
      
      // Perform bulk delete
      const bulkDeleteResult = await bulkOperationsManager.bulkDelete(itemsToDelete);
      expect(bulkDeleteResult.success).toBe(true);
      expect(bulkDeleteResult.deleted_count).toBe(2);
      
      // Verify items are deleted
      const remainingBarang = barangManager.getAll();
      expect(remainingBarang.length).toBe(initialCount - 2);
      
      const deletedItem1 = barangManager.getById('brg1');
      const deletedItem2 = barangManager.getById('brg2');
      expect(deletedItem1).toBeNull();
      expect(deletedItem2).toBeNull();
      
      // Verify audit log for bulk delete
      const auditLogs = auditLogger.getLogs();
      const bulkDeleteLog = auditLogs.find(log => log.action === 'bulk_operation');
      expect(bulkDeleteLog).toBeDefined();
      expect(bulkDeleteLog.additional_info.operation_type).toBe('bulk_delete');
      expect(bulkDeleteLog.additional_info.affected_count).toBe(2);
    });

    test('should complete bulk update workflow', async () => {
      // Select items for bulk update
      const itemsToUpdate = ['brg1', 'brg2'];
      const updateData = {
        kategori_id: 'cat3',
        kategori_nama: 'MINUMAN'
      };
      
      // Perform bulk update
      const bulkUpdateResult = await bulkOperationsManager.bulkUpdate(itemsToUpdate, updateData);
      expect(bulkUpdateResult.success).toBe(true);
      expect(bulkUpdateResult.updated_count).toBe(2);
      
      // Verify items are updated
      const updatedItem1 = barangManager.getById('brg1');
      const updatedItem2 = barangManager.getById('brg2');
      
      expect(updatedItem1.kategori_id).toBe('cat3');
      expect(updatedItem1.kategori_nama).toBe('MINUMAN');
      expect(updatedItem2.kategori_id).toBe('cat3');
      expect(updatedItem2.kategori_nama).toBe('MINUMAN');
      
      // Verify audit log for bulk update
      const auditLogs = auditLogger.getLogs();
      const bulkUpdateLog = auditLogs.find(log => 
        log.action === 'bulk_operation' && 
        log.additional_info.operation_type === 'bulk_update'
      );
      expect(bulkUpdateLog).toBeDefined();
      expect(bulkUpdateLog.additional_info.affected_count).toBe(2);
    });

    test('should handle bulk operation errors gracefully', async () => {
      // Try to bulk delete non-existent items
      const nonExistentItems = ['invalid1', 'invalid2'];
      
      const bulkDeleteResult = await bulkOperationsManager.bulkDelete(nonExistentItems);
      expect(bulkDeleteResult.success).toBe(false);
      expect(bulkDeleteResult.error).toContain('tidak ditemukan');
      
      // Try to bulk update with invalid data
      const invalidUpdateData = {
        kategori_id: 'invalid_category'
      };
      
      const bulkUpdateResult = await bulkOperationsManager.bulkUpdate(['brg1'], invalidUpdateData);
      expect(bulkUpdateResult.success).toBe(false);
      expect(bulkUpdateResult.error).toContain('tidak valid');
    });
  });

  describe('Audit Logging Workflows', () => {
    test('should maintain complete audit trail for all operations', async () => {
      // Clear existing logs
      auditLogger.clearLogs();
      
      // Perform various operations
      const newBarang = {
        kode: 'AUDIT001',
        nama: 'Audit Test Item',
        kategori_id: 'cat1',
        satuan_id: 'unit1',
        harga_beli: 1000,
        harga_jual: 1200,
        stok: 5
      };
      
      // CREATE operation
      const createResult = await barangManager.create(newBarang);
      
      // UPDATE operation
      const updateResult = await barangManager.update(createResult.data.id, {
        ...createResult.data,
        nama: 'Audit Test Item Updated'
      });
      
      // IMPORT operation
      const importData = [{
        kode: 'AUDIT002',
        nama: 'Imported Audit Item',
        kategori: 'ELEKTRONIK',
        satuan: 'PCS',
        harga_beli: 2000,
        harga_jual: 2400,
        stok: 3
      }];
      
      await importManager.processImport(importData, { name: 'audit_test.csv' });
      
      // EXPORT operation
      await exportManager.exportData({ format: 'csv', filters: {} });
      
      // BULK operation
      await bulkOperationsManager.bulkUpdate([createResult.data.id], {
        stok: 10
      });
      
      // DELETE operation
      await barangManager.delete(createResult.data.id);
      
      // Verify all operations are logged
      const auditLogs = auditLogger.getLogs();
      
      const createLog = auditLogs.find(log => log.action === 'create');
      const updateLog = auditLogs.find(log => log.action === 'update');
      const importLog = auditLogs.find(log => log.action === 'import');
      const exportLog = auditLogs.find(log => log.action === 'export');
      const bulkLog = auditLogs.find(log => log.action === 'bulk_operation');
      const deleteLog = auditLogs.find(log => log.action === 'delete');
      
      expect(createLog).toBeDefined();
      expect(updateLog).toBeDefined();
      expect(importLog).toBeDefined();
      expect(exportLog).toBeDefined();
      expect(bulkLog).toBeDefined();
      expect(deleteLog).toBeDefined();
      
      // Verify log details
      expect(createLog.new_data.kode).toBe('AUDIT001');
      expect(updateLog.old_data.nama).toBe('Audit Test Item');
      expect(updateLog.new_data.nama).toBe('Audit Test Item Updated');
      expect(importLog.additional_info.file_name).toBe('audit_test.csv');
      expect(exportLog.additional_info.format).toBe('csv');
      expect(bulkLog.additional_info.operation_type).toBe('bulk_update');
      expect(deleteLog.old_data.nama).toBe('Audit Test Item Updated');
    });

    test('should export audit logs successfully', async () => {
      // Generate some audit data
      await barangManager.create({
        kode: 'EXPORT_AUDIT',
        nama: 'Export Audit Test',
        kategori_id: 'cat1',
        satuan_id: 'unit1',
        harga_beli: 1000,
        harga_jual: 1200,
        stok: 5
      });
      
      // Export audit logs
      const auditExportResult = await auditLogger.exportLogs({
        format: 'csv',
        date_from: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        date_to: new Date()
      });
      
      expect(auditExportResult.success).toBe(true);
      expect(auditExportResult.data).toBeDefined();
      expect(auditExportResult.filename).toContain('audit_log_export');
      
      // Verify exported audit data
      const exportedLogs = auditExportResult.data;
      expect(exportedLogs.length).toBeGreaterThan(0);
      
      const createLog = exportedLogs.find(log => 
        log.action === 'create' && 
        log.new_data && 
        JSON.parse(log.new_data).kode === 'EXPORT_AUDIT'
      );
      expect(createLog).toBeDefined();
    });
  });

  describe('Cross-Component Integration', () => {
    test('should maintain data consistency across all components', async () => {
      // Create a new category
      const newCategory = await kategoriManager.create({
        nama: 'INTEGRATION_TEST',
        deskripsi: 'Category for integration testing'
      });
      
      // Create a new unit
      const newUnit = await satuanManager.create({
        nama: 'INTEG',
        deskripsi: 'Unit for integration testing'
      });
      
      // Create barang using the new category and unit
      const newBarang = await barangManager.create({
        kode: 'INTEG001',
        nama: 'Integration Test Item',
        kategori_id: newCategory.data.id,
        satuan_id: newUnit.data.id,
        harga_beli: 1000,
        harga_jual: 1200,
        stok: 10
      });
      
      // Verify relationships are maintained
      const barang = barangManager.getById(newBarang.data.id);
      expect(barang.kategori_nama).toBe('INTEGRATION_TEST');
      expect(barang.satuan_nama).toBe('INTEG');
      
      // Try to delete category (should fail)
      const deleteCategoryResult = await kategoriManager.delete(newCategory.data.id);
      expect(deleteCategoryResult.success).toBe(false);
      
      // Try to delete unit (should fail)
      const deleteUnitResult = await satuanManager.delete(newUnit.data.id);
      expect(deleteUnitResult.success).toBe(false);
      
      // Delete barang first
      await barangManager.delete(newBarang.data.id);
      
      // Now category and unit deletion should succeed
      const deleteCategoryResult2 = await kategoriManager.delete(newCategory.data.id);
      const deleteUnitResult2 = await satuanManager.delete(newUnit.data.id);
      
      expect(deleteCategoryResult2.success).toBe(true);
      expect(deleteUnitResult2.success).toBe(true);
    });

    test('should handle concurrent operations correctly', async () => {
      // Simulate concurrent operations
      const promises = [];
      
      // Multiple create operations
      for (let i = 1; i <= 5; i++) {
        promises.push(
          barangManager.create({
            kode: `CONCURRENT${i}`,
            nama: `Concurrent Item ${i}`,
            kategori_id: 'cat1',
            satuan_id: 'unit1',
            harga_beli: 1000 * i,
            harga_jual: 1200 * i,
            stok: 10 + i
          })
        );
      }
      
      // Wait for all operations to complete
      const results = await Promise.all(promises);
      
      // Verify all operations succeeded
      results.forEach((result, index) => {
        expect(result.success).toBe(true);
        expect(result.data.kode).toBe(`CONCURRENT${index + 1}`);
      });
      
      // Verify all items exist
      const allBarang = barangManager.getAll();
      for (let i = 1; i <= 5; i++) {
        const item = allBarang.find(b => b.kode === `CONCURRENT${i}`);
        expect(item).toBeDefined();
      }
      
      // Verify audit logs for all operations
      const auditLogs = auditLogger.getLogs();
      const concurrentLogs = auditLogs.filter(log => 
        log.action === 'create' && 
        log.new_data.kode && 
        log.new_data.kode.startsWith('CONCURRENT')
      );
      expect(concurrentLogs.length).toBe(5);
    });
  });

  describe('Error Recovery and Resilience', () => {
    test('should recover from storage errors gracefully', async () => {
      // Mock localStorage error
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = jest.fn(() => {
        throw new Error('Storage quota exceeded');
      });
      
      // Try to create barang (should handle error)
      const createResult = await barangManager.create({
        kode: 'ERROR_TEST',
        nama: 'Error Test Item',
        kategori_id: 'cat1',
        satuan_id: 'unit1',
        harga_beli: 1000,
        harga_jual: 1200,
        stok: 5
      });
      
      expect(createResult.success).toBe(false);
      expect(createResult.error).toContain('Storage');
      
      // Restore localStorage
      localStorage.setItem = originalSetItem;
      
      // Verify system still works after error
      const createResult2 = await barangManager.create({
        kode: 'RECOVERY_TEST',
        nama: 'Recovery Test Item',
        kategori_id: 'cat1',
        satuan_id: 'unit1',
        harga_beli: 1000,
        harga_jual: 1200,
        stok: 5
      });
      
      expect(createResult2.success).toBe(true);
    });

    test('should handle invalid data gracefully', async () => {
      // Try to create barang with invalid data
      const invalidBarang = {
        kode: '', // Empty code
        nama: '', // Empty name
        kategori_id: 'invalid_category',
        satuan_id: 'invalid_unit',
        harga_beli: -1000, // Negative price
        harga_jual: 'invalid', // Invalid price format
        stok: -5 // Negative stock
      };
      
      const createResult = await barangManager.create(invalidBarang);
      expect(createResult.success).toBe(false);
      expect(createResult.errors).toBeDefined();
      expect(createResult.errors.length).toBeGreaterThan(0);
      
      // Verify system state is not corrupted
      const allBarang = barangManager.getAll();
      const invalidItem = allBarang.find(item => item.kode === '');
      expect(invalidItem).toBeUndefined();
    });
  });
});