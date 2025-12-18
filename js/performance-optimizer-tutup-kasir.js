// Performance Optimizer for Tutup Kasir POS
// Implements caching, lazy loading, and performance enhancements

class TutupKasirPerformanceOptimizer {
    constructor() {
        this.cache = new Map();
        this.debounceTimers = new Map();
        this.performanceMetrics = {
            modalRenderTime: 0,
            calculationTime: 0,
            cacheHits: 0,
            cacheMisses: 0
        };
        
        this.init();
    }
    
    init() {
        // Initialize performance monitoring
        this.setupPerformanceMonitoring();
        
        // Setup caching strategies
        this.setupCaching();
        
        // Initialize lazy loading
        this.setupLazyLoading();
        
        // Setup debounced functions
        this.setupDebouncedFunctions();
        
        console.log('TutupKasirPerformanceOptimizer initialized');
    }
    
    // Performance monitoring setup
    setupPerformanceMonitoring() {
        // Monitor modal rendering performance
        this.originalShowTutupKasirModal = window.showTutupKasirModal;
        window.showTutupKasirModal = this.optimizedShowTutupKasirModal.bind(this);
        
        // Monitor calculation performance
        this.originalProsesTutupKasir = window.prosesTutupKasir;
        window.prosesTutupKasir = this.optimizedProsesTutupKasir.bind(this);
        
        // Monitor cart updates
        this.originalUpdateCartDisplayPOS = window.updateCartDisplayPOS;
        window.updateCartDisplayPOS = this.optimizedUpdateCartDisplayPOS.bind(this);
    }
    
    // Caching strategies
    setupCaching() {
        // Cache frequently accessed data
        this.cacheKeys = {
            PENJUALAN_DATA: 'penjualan_data',
            ANGGOTA_DATA: 'anggota_data',
            BARANG_DATA: 'barang_data',
            SHIFT_CALCULATIONS: 'shift_calculations',
            MODAL_HTML: 'modal_html'
        };
        
        // Setup cache invalidation on data changes
        this.setupCacheInvalidation();
    }
    
    setupCacheInvalidation() {
        // Override localStorage setItem to invalidate cache
        const originalSetItem = localStorage.setItem;
        localStorage.setItem = (key, value) => {
            originalSetItem.call(localStorage, key, value);
            
            // Invalidate relevant caches
            if (key === 'penjualan') {
                this.invalidateCache(this.cacheKeys.PENJUALAN_DATA);
                this.invalidateCache(this.cacheKeys.SHIFT_CALCULATIONS);
            } else if (key === 'anggota') {
                this.invalidateCache(this.cacheKeys.ANGGOTA_DATA);
            } else if (key === 'barang') {
                this.invalidateCache(this.cacheKeys.BARANG_DATA);
            }
        };
    }
    
    // Lazy loading setup
    setupLazyLoading() {
        // Lazy load heavy components
        this.lazyComponents = {
            modalContent: null,
            calculationEngine: null,
            reportGenerator: null
        };
    }
    
    // Debounced functions setup
    setupDebouncedFunctions() {
        // Debounce search functions
        this.debouncedSearchProducts = this.debounce(this.searchProductsOptimized.bind(this), 300);
        this.debouncedFilterMembers = this.debounce(this.filterMembersOptimized.bind(this), 200);
        this.debouncedCalculateChange = this.debounce(this.calculateChangeOptimized.bind(this), 100);
    }
    
    // Optimized modal rendering
    optimizedShowTutupKasirModal() {
        const startTime = performance.now();
        
        // Check cache first
        const cacheKey = this.cacheKeys.MODAL_HTML;
        let modalData = this.getFromCache(cacheKey);
        
        if (!modalData) {
            // Generate modal data
            modalData = this.generateModalData();
            this.setCache(cacheKey, modalData, 5 * 60 * 1000); // Cache for 5 minutes
        }
        
        // Show loading indicator
        this.showLoadingIndicator('Memuat data tutup kasir...');
        
        // Render modal with cached data
        setTimeout(() => {
            this.renderOptimizedModal(modalData);
            this.hideLoadingIndicator();
            
            const endTime = performance.now();
            this.performanceMetrics.modalRenderTime = endTime - startTime;
            
            console.log(`Modal rendered in ${this.performanceMetrics.modalRenderTime.toFixed(2)}ms`);
        }, 50); // Small delay to show loading indicator
    }
    
    generateModalData() {
        // Enhanced session validation with caching
        const bukaKas = sessionStorage.getItem('bukaKas');
        if (!bukaKas) {
            throw new Error('Belum ada kas yang dibuka');
        }
        
        let shiftData;
        try {
            shiftData = JSON.parse(bukaKas);
            if (!shiftData.kasir || !shiftData.modalAwal || !shiftData.waktuBuka) {
                throw new Error('Data buka kas tidak lengkap');
            }
        } catch (e) {
            sessionStorage.removeItem('bukaKas');
            sessionStorage.removeItem('shiftId');
            throw new Error('Data buka kas corrupt');
        }
        
        // Get cached or fresh data
        const penjualan = this.getCachedData(this.cacheKeys.PENJUALAN_DATA, () => 
            JSON.parse(localStorage.getItem('penjualan') || '[]')
        );
        
        // Calculate shift data with caching
        const shiftCalculations = this.getCachedData(
            `${this.cacheKeys.SHIFT_CALCULATIONS}_${shiftData.id}`,
            () => this.calculateShiftData(shiftData, penjualan)
        );
        
        return {
            shiftData,
            ...shiftCalculations
        };
    }
    
    calculateShiftData(shiftData, penjualan) {
        const waktuBuka = new Date(shiftData.waktuBuka);
        const sekarang = new Date();
        
        // Optimized filtering with early exit
        const penjualanShift = [];
        for (const p of penjualan) {
            const tanggalPenjualan = new Date(p.tanggal);
            if (tanggalPenjualan >= waktuBuka && tanggalPenjualan <= sekarang) {
                penjualanShift.push(p);
            }
        }
        
        // Optimized calculations using reduce with single pass
        const totals = penjualanShift.reduce((acc, p) => {
            acc.totalPenjualan += p.total;
            if (p.status === 'cash') {
                acc.totalCash += p.total;
            } else if (p.status === 'kredit') {
                acc.totalKredit += p.total;
            }
            return acc;
        }, { totalPenjualan: 0, totalCash: 0, totalKredit: 0 });
        
        return {
            penjualanShift,
            ...totals,
            kasSeharusnya: shiftData.modalAwal + totals.totalCash,
            jumlahTransaksi: penjualanShift.length
        };
    }
    
    renderOptimizedModal(modalData) {
        const { shiftData, totalPenjualan, totalCash, totalKredit, kasSeharusnya, jumlahTransaksi } = modalData;
        
        // Use template literals with optimized structure
        const modalHTML = this.buildModalHTML(shiftData, {
            totalPenjualan, totalCash, totalKredit, kasSeharusnya, jumlahTransaksi
        });
        
        // Remove existing modal efficiently
        const existingModal = document.getElementById('tutupKasirModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('tutupKasirModal'));
        modal.show();
        
        // Setup optimized event listeners
        this.setupOptimizedModalListeners(kasSeharusnya);
    }
    
    buildModalHTML(shiftData, calculations) {
        // Pre-calculate formatted values to avoid repeated formatting
        const formatted = {
            modalAwal: formatRupiah(shiftData.modalAwal),
            totalCash: formatRupiah(calculations.totalCash),
            totalKredit: formatRupiah(calculations.totalKredit),
            kasSeharusnya: formatRupiah(calculations.kasSeharusnya),
            waktuBuka: formatDateTime(shiftData.waktuBuka)
        };
        
        return `
            <div class="modal fade" id="tutupKasirModal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header bg-warning">
                            <h5 class="modal-title">
                                <i class="bi bi-calculator me-2"></i>Tutup Kasir
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            ${this.buildShiftInfoSection(shiftData, formatted)}
                            ${this.buildCalculationSection(formatted)}
                            ${this.buildFormSection()}
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Batal</button>
                            <button type="button" class="btn btn-warning" onclick="prosesTutupKasir()">
                                <i class="bi bi-printer me-1"></i>Tutup & Print Laporan
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    buildShiftInfoSection(shiftData, formatted) {
        return `
            <div class="row mb-4">
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-body">
                            <h6 class="text-muted">Informasi Shift</h6>
                            <p class="mb-1"><strong>Kasir:</strong> ${shiftData.kasir}</p>
                            <p class="mb-1"><strong>Waktu Buka:</strong> ${formatted.waktuBuka}</p>
                            <p class="mb-0"><strong>Modal Awal:</strong> ${formatted.modalAwal}</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-body">
                            <h6 class="text-muted">Ringkasan Penjualan</h6>
                            <p class="mb-1"><strong>Total Transaksi:</strong> <span id="totalTransaksiDisplay">-</span></p>
                            <p class="mb-1"><strong>Penjualan Cash:</strong> ${formatted.totalCash}</p>
                            <p class="mb-0"><strong>Penjualan Kredit:</strong> ${formatted.totalKredit}</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    buildCalculationSection(formatted) {
        return `
            <div class="row mb-4">
                <div class="col-md-12">
                    <div class="card bg-light">
                        <div class="card-body">
                            <h6 class="text-muted">Perhitungan Kas</h6>
                            <div class="row">
                                <div class="col-md-4">
                                    <p class="mb-1">Modal Awal:</p>
                                    <h5 class="text-primary">${formatted.modalAwal}</h5>
                                </div>
                                <div class="col-md-4">
                                    <p class="mb-1">Penjualan Cash:</p>
                                    <h5 class="text-success">${formatted.totalCash}</h5>
                                </div>
                                <div class="col-md-4">
                                    <p class="mb-1">Kas Seharusnya:</p>
                                    <h5 class="text-info">${formatted.kasSeharusnya}</h5>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    buildFormSection() {
        return `
            <form id="tutupKasirForm">
                <div class="mb-3">
                    <label class="form-label"><strong>Kas Aktual (Hitung Uang di Kasir)</strong></label>
                    <input type="number" class="form-control form-control-lg" id="kasAktual" 
                           placeholder="Masukkan jumlah uang yang ada di kasir" required>
                    <div class="progress mt-2" style="height: 3px; display: none;" id="calculationProgress">
                        <div class="progress-bar" role="progressbar" style="width: 0%"></div>
                    </div>
                </div>
                
                <div class="alert alert-info" id="selisihInfo" style="display: none;">
                    <h6 class="mb-2">Selisih Kas:</h6>
                    <div id="selisihDetail"></div>
                </div>
                
                <div class="mb-3" id="keteranganSection" style="display: none;">
                    <label class="form-label">Keterangan Selisih</label>
                    <textarea class="form-control" id="keteranganSelisih" rows="3" 
                              placeholder="Jelaskan penyebab selisih kas..."></textarea>
                </div>
            </form>
        `;
    }
    
    setupOptimizedModalListeners(kasSeharusnya) {
        const kasAktualInput = document.getElementById('kasAktual');
        
        // Use optimized input handler with debouncing
        kasAktualInput.addEventListener('input', (event) => {
            this.showCalculationProgress();
            this.debouncedCalculateSelisih(event.target.value, kasSeharusnya);
        });
        
        // Add keyboard shortcuts
        kasAktualInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                prosesTutupKasir();
            }
        });
    }
    
    showCalculationProgress() {
        const progress = document.getElementById('calculationProgress');
        if (progress) {
            progress.style.display = 'block';
            const bar = progress.querySelector('.progress-bar');
            bar.style.width = '30%';
        }
    }
    
    hideCalculationProgress() {
        const progress = document.getElementById('calculationProgress');
        if (progress) {
            const bar = progress.querySelector('.progress-bar');
            bar.style.width = '100%';
            setTimeout(() => {
                progress.style.display = 'none';
                bar.style.width = '0%';
            }, 200);
        }
    }
    
    debouncedCalculateSelisih = this.debounce((kasAktualValue, kasSeharusnya) => {
        const kasAktual = parseFloat(kasAktualValue) || 0;
        const selisih = kasAktual - kasSeharusnya;
        
        const selisihInfo = document.getElementById('selisihInfo');
        const selisihDetail = document.getElementById('selisihDetail');
        const keteranganSection = document.getElementById('keteranganSection');
        
        if (kasAktual > 0) {
            selisihInfo.style.display = 'block';
            
            if (selisih === 0) {
                selisihInfo.className = 'alert alert-success';
                selisihDetail.innerHTML = '<strong>Kas Sesuai!</strong> Tidak ada selisih.';
                keteranganSection.style.display = 'none';
            } else if (selisih > 0) {
                selisihInfo.className = 'alert alert-warning';
                selisihDetail.innerHTML = `<strong>Kas Lebih:</strong> ${formatRupiah(selisih)}`;
                keteranganSection.style.display = 'block';
            } else {
                selisihInfo.className = 'alert alert-danger';
                selisihDetail.innerHTML = `<strong>Kas Kurang:</strong> ${formatRupiah(Math.abs(selisih))}`;
                keteranganSection.style.display = 'block';
            }
        } else {
            selisihInfo.style.display = 'none';
            keteranganSection.style.display = 'none';
        }
        
        this.hideCalculationProgress();
    }, 300);
    
    // Optimized process tutup kasir
    optimizedProsesTutupKasir() {
        const startTime = performance.now();
        
        // Show processing indicator
        this.showProcessingIndicator('Memproses tutup kasir...');
        
        // Validate input
        const kasAktual = parseFloat(document.getElementById('kasAktual').value);
        const keteranganSelisih = document.getElementById('keteranganSelisih').value;
        
        if (!kasAktual || kasAktual < 0) {
            this.hideProcessingIndicator();
            showAlert('Masukkan kas aktual yang valid', 'error');
            return;
        }
        
        // Process in chunks to avoid blocking UI
        setTimeout(() => {
            try {
                this.processChunkedTutupKasir(kasAktual, keteranganSelisih);
                
                const endTime = performance.now();
                this.performanceMetrics.calculationTime = endTime - startTime;
                
                console.log(`Tutup kasir processed in ${this.performanceMetrics.calculationTime.toFixed(2)}ms`);
            } catch (error) {
                this.hideProcessingIndicator();
                showAlert('Terjadi kesalahan: ' + error.message, 'error');
            }
        }, 100);
    }
    
    processChunkedTutupKasir(kasAktual, keteranganSelisih) {
        // Get cached data
        const bukaKas = JSON.parse(sessionStorage.getItem('bukaKas'));
        const modalData = this.getFromCache(this.cacheKeys.MODAL_HTML);
        
        // Use cached calculations if available
        let shiftCalculations;
        if (modalData) {
            shiftCalculations = modalData;
        } else {
            const penjualan = this.getCachedData(this.cacheKeys.PENJUALAN_DATA, () => 
                JSON.parse(localStorage.getItem('penjualan') || '[]')
            );
            shiftCalculations = this.calculateShiftData(bukaKas, penjualan);
        }
        
        const selisih = kasAktual - shiftCalculations.kasSeharusnya;
        const sekarang = new Date();
        
        // Create tutup kasir record
        const tutupKasData = {
            id: generateId(),
            shiftId: bukaKas.id,
            kasir: bukaKas.kasir,
            kasirId: bukaKas.kasirId,
            waktuBuka: bukaKas.waktuBuka,
            waktuTutup: sekarang.toISOString(),
            modalAwal: bukaKas.modalAwal,
            totalPenjualan: shiftCalculations.totalPenjualan,
            totalCash: shiftCalculations.totalCash,
            totalKredit: shiftCalculations.totalKredit,
            kasSeharusnya: shiftCalculations.kasSeharusnya,
            kasAktual: kasAktual,
            selisih: selisih,
            keteranganSelisih: keteranganSelisih,
            jumlahTransaksi: shiftCalculations.jumlahTransaksi,
            tanggalTutup: sekarang.toISOString().split('T')[0]
        };
        
        // Process in next tick to avoid blocking
        setTimeout(() => {
            this.finalizeTutupKasir(tutupKasData, selisih, bukaKas.kasir, sekarang);
        }, 50);
    }
    
    finalizeTutupKasir(tutupKasData, selisih, kasir, sekarang) {
        // Save to localStorage
        const riwayatTutupKas = JSON.parse(localStorage.getItem('riwayatTutupKas') || '[]');
        riwayatTutupKas.push(tutupKasData);
        localStorage.setItem('riwayatTutupKas', JSON.stringify(riwayatTutupKas));
        
        // Create journal entry for selisih if any
        if (selisih !== 0) {
            const keterangan = `Selisih Kas Tutup Kasir - ${kasir} - ${formatDate(sekarang)}`;
            
            if (selisih > 0) {
                addJurnal(keterangan, [
                    { akun: '1001', debit: Math.abs(selisih), kredit: 0 },
                    { akun: '4002', debit: 0, kredit: Math.abs(selisih) }
                ]);
            } else {
                addJurnal(keterangan, [
                    { akun: '5002', debit: Math.abs(selisih), kredit: 0 },
                    { akun: '1001', debit: 0, kredit: Math.abs(selisih) }
                ]);
            }
        }
        
        // Clear session and cache
        sessionStorage.removeItem('bukaKas');
        sessionStorage.removeItem('shiftId');
        this.invalidateCache(this.cacheKeys.MODAL_HTML);
        this.invalidateCache(this.cacheKeys.SHIFT_CALCULATIONS);
        
        // Hide modal and processing indicator
        bootstrap.Modal.getInstance(document.getElementById('tutupKasirModal')).hide();
        this.hideProcessingIndicator();
        
        // Print laporan
        printLaporanTutupKasir(tutupKasData);
        
        // Show success message
        showAlert('Kas berhasil ditutup dan laporan telah dicetak!', 'success');
        
        // Return to dashboard
        setTimeout(() => {
            exitPOSFullscreen();
        }, 2000);
    }
    
    // Optimized cart display update
    optimizedUpdateCartDisplayPOS() {
        if (!window.cart) return;
        
        const cartItems = document.getElementById('cartItems');
        const cartCount = document.getElementById('cartCount');
        const totalAmount = document.getElementById('totalAmount');
        
        if (!cartItems || !cartCount || !totalAmount) return;
        
        // Use document fragment for better performance
        const fragment = document.createDocumentFragment();
        
        if (cart.length === 0) {
            const emptyDiv = document.createElement('div');
            emptyDiv.className = 'empty-cart';
            emptyDiv.innerHTML = `
                <i class="bi bi-cart-x"></i>
                <h6>Keranjang Kosong</h6>
                <p>Pilih produk untuk memulai transaksi</p>
            `;
            fragment.appendChild(emptyDiv);
        } else {
            // Batch DOM updates
            cart.forEach(item => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'cart-item';
                itemDiv.innerHTML = this.buildCartItemHTML(item);
                fragment.appendChild(itemDiv);
            });
        }
        
        // Single DOM update
        cartItems.innerHTML = '';
        cartItems.appendChild(fragment);
        
        // Update totals
        const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
        const total = cart.reduce((sum, item) => sum + (item.hargaJual * item.qty), 0);
        
        cartCount.textContent = totalItems;
        totalAmount.textContent = formatRupiah(total);
        
        // Update change calculation if needed
        if (typeof calculateChangePOS === 'function') {
            this.debouncedCalculateChange();
        }
    }
    
    buildCartItemHTML(item) {
        return `
            <div class="cart-item-info">
                <div class="cart-item-name">${item.nama}</div>
                <div class="cart-item-price">${formatRupiah(item.hargaJual)} x ${item.qty}</div>
            </div>
            <div class="cart-item-controls">
                <button class="qty-btn" onclick="updateQtyPOS('${item.id}', -1)">
                    <i class="bi bi-dash"></i>
                </button>
                <div class="qty-display">${item.qty}</div>
                <button class="qty-btn" onclick="updateQtyPOS('${item.id}', 1)">
                    <i class="bi bi-plus"></i>
                </button>
                <button class="qty-btn" onclick="removeFromCartPOS('${item.id}')" style="background: #dc3545; color: white; margin-left: 8px;">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        `;
    }
    
    // Optimized search functions
    searchProductsOptimized(query) {
        const barang = this.getCachedData(this.cacheKeys.BARANG_DATA, () => 
            JSON.parse(localStorage.getItem('barang') || '[]')
        );
        
        if (!query) {
            this.renderProducts(barang);
            return;
        }
        
        const lowerQuery = query.toLowerCase();
        const filteredProducts = barang.filter(b => 
            b.nama.toLowerCase().includes(lowerQuery) ||
            (b.barcode && b.barcode.includes(query))
        );
        
        this.renderProducts(filteredProducts);
    }
    
    filterMembersOptimized(query) {
        const options = document.querySelectorAll('.member-option');
        const lowerQuery = query.toLowerCase();
        
        // Use requestAnimationFrame for smooth filtering
        requestAnimationFrame(() => {
            options.forEach(option => {
                const text = option.textContent.toLowerCase();
                option.style.display = text.includes(lowerQuery) ? 'block' : 'none';
            });
        });
    }
    
    calculateChangeOptimized() {
        if (selectedPaymentMethod !== 'cash') return;
        
        const total = cart.reduce((sum, item) => sum + (item.hargaJual * item.qty), 0);
        const cash = parseFloat(document.getElementById('cashInput')?.value) || 0;
        const change = cash - total;
        
        const changeDisplay = document.getElementById('changeDisplay');
        if (!changeDisplay) return;
        
        if (change < 0) {
            changeDisplay.textContent = 'Uang kurang: ' + formatRupiah(Math.abs(change));
            changeDisplay.style.background = 'linear-gradient(135deg, #dc3545, #c82333)';
        } else {
            changeDisplay.textContent = 'Kembalian: ' + formatRupiah(change);
            changeDisplay.style.background = 'linear-gradient(135deg, #52b788, #74c69d)';
        }
    }
    
    renderProducts(products) {
        const productGrid = document.getElementById('productGrid');
        const noProducts = document.getElementById('noProducts');
        
        if (!productGrid || !noProducts) return;
        
        if (products.length === 0) {
            productGrid.style.display = 'none';
            noProducts.style.display = 'block';
            return;
        }
        
        productGrid.style.display = 'grid';
        noProducts.style.display = 'none';
        
        // Use document fragment for better performance
        const fragment = document.createDocumentFragment();
        
        products.forEach(product => {
            const productDiv = document.createElement('div');
            productDiv.className = 'product-card';
            productDiv.onclick = () => addToCartPOS(product.id);
            productDiv.innerHTML = `
                <div class="product-image">
                    <i class="bi bi-box"></i>
                </div>
                <div class="product-name">${product.nama}</div>
                <div class="product-price">${formatRupiah(product.hargaJual)}</div>
                <div class="product-stock">Stok: ${product.stok}</div>
            `;
            fragment.appendChild(productDiv);
        });
        
        productGrid.innerHTML = '';
        productGrid.appendChild(fragment);
    }
    
    // Loading and progress indicators
    showLoadingIndicator(message = 'Memuat...') {
        const indicator = document.createElement('div');
        indicator.id = 'loadingIndicator';
        indicator.className = 'loading-indicator';
        indicator.innerHTML = `
            <div class="loading-content">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <div class="mt-2">${message}</div>
            </div>
        `;
        
        // Add styles
        indicator.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            color: white;
        `;
        
        document.body.appendChild(indicator);
    }
    
    hideLoadingIndicator() {
        const indicator = document.getElementById('loadingIndicator');
        if (indicator) {
            indicator.remove();
        }
    }
    
    showProcessingIndicator(message = 'Memproses...') {
        this.showLoadingIndicator(message);
    }
    
    hideProcessingIndicator() {
        this.hideLoadingIndicator();
    }
    
    // Cache management
    setCache(key, value, ttl = 10 * 60 * 1000) { // Default 10 minutes
        const expiry = Date.now() + ttl;
        this.cache.set(key, { value, expiry });
        this.performanceMetrics.cacheMisses++;
    }
    
    getFromCache(key) {
        const cached = this.cache.get(key);
        if (!cached) {
            this.performanceMetrics.cacheMisses++;
            return null;
        }
        
        if (Date.now() > cached.expiry) {
            this.cache.delete(key);
            this.performanceMetrics.cacheMisses++;
            return null;
        }
        
        this.performanceMetrics.cacheHits++;
        return cached.value;
    }
    
    getCachedData(key, dataProvider) {
        let data = this.getFromCache(key);
        if (!data) {
            data = dataProvider();
            this.setCache(key, data);
        }
        return data;
    }
    
    invalidateCache(key) {
        this.cache.delete(key);
    }
    
    clearCache() {
        this.cache.clear();
    }
    
    // Utility functions
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    // Performance metrics
    getPerformanceMetrics() {
        return {
            ...this.performanceMetrics,
            cacheSize: this.cache.size,
            cacheHitRate: this.performanceMetrics.cacheHits / 
                (this.performanceMetrics.cacheHits + this.performanceMetrics.cacheMisses) * 100
        };
    }
    
    logPerformanceMetrics() {
        const metrics = this.getPerformanceMetrics();
        console.table(metrics);
    }
}

// Initialize performance optimizer when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    if (!window.tutupKasirPerformanceOptimizer) {
        window.tutupKasirPerformanceOptimizer = new TutupKasirPerformanceOptimizer();
    }
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TutupKasirPerformanceOptimizer;
}