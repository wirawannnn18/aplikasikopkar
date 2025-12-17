/**
 * AllItemsTransformation - Transformasi untuk SEMUA item dari master barang
 * 
 * File ini memungkinkan transformasi antar SEMUA item di master barang,
 * tidak terbatas pada item dengan multiple units saja.
 */

(function() {
    'use strict';
    
    console.log('🔄 ALL ITEMS TRANSFORMATION: Loading...');
    
    class AllItemsTransformation {
        constructor() {
            this.initialized = false;
        }

        /**
         * Initialize all items transformation
         */
        async initialize() {
            try {
                console.log('🔄 Initializing all items transformation...');
                
                // Override dropdown population
                this.overrideDropdownPopulation();
                
                // Override transformation execution
                this.overrideTransformationExecution();
                
                // Setup event listeners
                this.setupEventListeners();
                
                this.initialized = true;
                console.log('✅ All items transformation initialized successfully!');
                
                return true;
            } catch (error) {
                console.error('❌ All items transformation initialization failed:', error);
                return false;
            }
        }

        /**
         * Override dropdown population to show ALL items
         */
        overrideDropdownPopulation() {
            const self = this;
            
            window.populateAllItemsDropdowns = function() {
                console.log('🔄 Populating dropdowns with ALL master barang items...');
                
                const sourceSelect = document.getElementById('sourceItem');
                const targetSelect = document.getElementById('targetItem');
                
                if (!sourceSelect || !targetSelect) {
                    console.warn('Dropdown elements not found');
                    return false;
                }
                
                try {
                    // Get ALL items from master_barang
                    const masterBarang = JSON.parse(localStorage.getItem('master_barang') || '[]');
                    
                    if (masterBarang.length === 0) {
                        console.warn('⚠️ No master_barang data found');
                        return false;
                    }
                    
                    console.log(`📦 Loading ${masterBarang.length} items from master_barang`);
                    
                    // Clear existing options
                    sourceSelect.innerHTML = '<option value="">Pilih Item Sumber (Semua Barang)...</option>';
                    targetSelect.innerHTML = '<option value="">Pilih Item Target (Semua Barang)...</option>';
                    
                    let sourceCount = 0;
                    let targetCount = 0;
                    
                    // Add ALL items to both dropdowns
                    masterBarang.forEach(item => {
                        // Skip inactive items
                        if (item.status === 'nonaktif') return;
                        
                        const nama = String(item.nama || 'Unknown');
                        const satuan = String(item.satuan_nama || 'pcs');
                        const stok = Number(item.stok || 0);
                        const kode = String(item.kode || item.id);
                        const kategori = String(item.kategori_nama || 'Umum');
                        
                        // SOURCE dropdown - only items with stock > 0
                        if (stok > 0) {
                            const sourceOption = new Option(
                                `${nama} (${kategori}) - Stok: ${stok} ${satuan}`, 
                                kode
                            );
                            sourceOption.dataset.id = String(item.id || '');
                            sourceOption.dataset.kode = kode;
                            sourceOption.dataset.nama = nama;
                            sourceOption.dataset.satuan = satuan;
                            sourceOption.dataset.stok = stok.toString();
                            sourceOption.dataset.kategori = kategori;
                            sourceOption.dataset.hargaBeli = String(item.harga_beli || 0);
                            sourceOption.dataset.hargaJual = St