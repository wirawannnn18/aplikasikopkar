/**
 * MasterBarangIntegration - Integrasi langsung dengan Master Barang
 * 
 * Script ini mengganti semua data dummy dengan data real dari master_barang
 * dan memastikan transformasi barang terhubung langsung dengan stok real.
 */

(function() {
    'use strict';
    
    console.log('🔄 MASTER BARANG INTEGRATION: Starting...');
    
    class MasterBarangIntegration {
        constructor() {
            this.masterBarangData = [];
            this.transformableItems = [];
            this.conversionRules = new Map();
            this.initialized = false;
        }

        /**
         * Initialize integration with master barang
         */
        async initialize() {
            try {
                console.log('🔄 Initializing Master Barang Integration...');
                
                // Load master barang data
                this.loadMasterBarangData();
                
                // Create transformable items with conversion variants
                this.createTransformableItems();
                
                // Setup conversion rules
                this.setupConversionRules();
                
                // Override all dropdown and stock functions
                this.overrideSystemFunctions();
                
                // Initialize UI
                this.initializeUI();
                
                this.initialized = true;
                console.log('✅ Master Barang Integration completed successfully!');
                
                return true;
            } catch (error) {
                console.error('❌ Master Barang Integration failed:', error);
                return false;
            }
        }

        /**
         * Load master barang data from localStorage
         */
        loadMasterBarangData() {
            try {
                // Load from master_barang (real data)
                this.masterBarangData = JSON.parse(localStorage.getItem('master_barang') || '[]');
                
                console.log(`📦 Loaded ${this.masterBarangData.length} master barang items`);
                
                if (this.masterBarangData.length === 0) {
                    console.warn('⚠️ No master barang data found, creating sample data...');
                    this.createSampleData();
                }
                
            } catch (error) {
                console.error('❌ Error loading master barang data:', error);
                this.createSampleData();
            }
        }

        /**
         * Create transformable items with conversion variants
         */
        createTransformableItems() {
            console.log('🔄 Creating transformable items...');
            
            this.transformableItems = [];
            
            this.masterBarangData.forEach(item => {
                // Skip inactive items
                if (item.status === 'nonaktif') return;
                
                const baseItem = {
                    id: item.id,
                    kode: item.kode,
                    nama: item.nama,
                    kategori: item.kategori_nama || 'Umum',
                    satuan: item.satuan_nama || 'pcs',
                    stok: parseInt(item.stok) || 0,
                    hargaBeli: parseInt(item.harga_beli) || 0,
                    hargaJual: parseInt(item.harga_jual) || 0,
                    baseProduct: this.getBaseProduct(item),
                    isOriginal: true
                };
                
                this.transformableItems.push(baseItem);
                
                // Add conversion variants
                this.addConversionVariants(baseItem);
            });
            
            console.log(`✅ Created ${this.transformableItems.length} transformable items`);
        }

        /**
         * Get base product for grouping transformable items
         */
        getBaseProduct(item) {
            const kategori = (item.kategori_nama || 'Umum').replace(/\s+/g, '_').toUpperCase();
            const nama = item.nama.split(' ')[0].replace(/\s+/g, '_').toUpperCase();
            return `${kategori}_${nama}`;
        }

        /**
         * Add conversion variants for common units
         */
        addConversionVariants(baseItem) {
            const satuan = baseItem.satuan.toLowerCase();
            
            const conversionMap = {
                'kg': [
                    { unit: 'gram', ratio: 1000, name: 'Gram' },
                    { unit: 'ons', ratio: 10, name: 'Ons' }
                ],
                'kilogram': [
                    { unit: 'gram', ratio: 1000, name: 'Gram' },
                    { unit: 'ons', ratio: 10, name