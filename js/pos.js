// Point of Sales Module - Fixed Version

let cart = [];
let modalKasir = 0;
let shiftKasir = null;
let tutupKasData = null;
let selectedPaymentMethod = 'cash';

function renderPOS() {
    // Check if kasir sudah buka kas
    const bukaKas = sessionStorage.getItem('bukaKas');
    if (!bukaKas) {
        showBukaKasModal();
        return;
    }
    
    // Hide the main layout and show fullscreen POS
    document.getElementById('sidebar').style.display = 'none';
    document.querySelector('.navbar').style.display = 'none';
    
    // Set body to fullscreen mode
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.overflow = 'hidden';
    document.body.style.height = '100vh';
    document.body.style.width = '100vw';
    
    const content = document.getElementById('mainContent');
    content.style.padding = '0';
    content.style.margin = '0';
    content.style.height = '100vh';
    content.style.width = '100vw';
    content.style.position = 'fixed';
    content.style.top = '0';
    content.style.left = '0';
    content.style.zIndex = '9999';
    
    const barang = JSON.parse(localStorage.getItem('barang') || '[]');
    const anggota = JSON.parse(localStorage.getItem('anggota') || '[]');
    
    // Create fullscreen POS interface
    content.innerHTML = `
        <style>
            /* FORCE FULLSCREEN POS STYLES */
            * {
                box-sizing: border-box;
            }
            
            html, body {
                margin: 0 !important;
                padding: 0 !important;
                overflow: hidden !important;
                height: 100vh !important;
                width: 100vw !important;
            }
            
            #mainContent {
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                width: 100vw !important;
                height: 100vh !important;
                z-index: 99999 !important;
                margin: 0 !important;
                padding: 0 !important;
            }
            
            .pos-container {
                background: linear-gradient(135deg, #f8f9fa 0%, #e9f5f0 100%);
                height: 100vh !important;
                width: 100vw !important;
                padding: 0 !important;
                margin: 0 !important;
                display: flex !important;
                flex-direction: column !important;
                position: relative !important;
                overflow: hidden !important;
            }

            .pos-header {
                background: linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%);
                color: white;
                padding: 15px 20px;
                border-radius: 0;
                margin-bottom: 0;
                box-shadow: 0 2px 10px rgba(45, 106, 79, 0.3);
                flex-shrink: 0;
                position: relative;
                z-index: 1000;
            }

            /* Enhanced Tutup Kasir Button Styling */
            .tutup-kasir-btn-enhanced:hover {
                background: linear-gradient(135deg, #ffb300 0%, #ff8f00 100%) !important;
                transform: translateY(-2px) !important;
                box-shadow: 0 4px 12px rgba(255, 193, 7, 0.4) !important;
                border-color: #fff !important;
                color: #000 !important;
            }

            .tutup-kasir-btn-enhanced:focus {
                outline: 3px solid rgba(255, 193, 7, 0.5) !important;
                outline-offset: 2px !important;
                box-shadow: 0 0 0 0.25rem rgba(255, 193, 7, 0.25) !important;
            }

            .tutup-kasir-btn-enhanced:active {
                transform: translateY(0) !important;
                box-shadow: 0 2px 4px rgba(255, 193, 7, 0.3) !important;
            }

            .pos-search-section {
                background: white !important;
                border-radius: 0 !important;
                padding: 20px !important;
                box-shadow: 0 2px 10px rgba(45, 106, 79, 0.1) !important;
                margin-bottom: 0 !important;
                height: calc(100vh - 80px) !important;
                min-height: calc(100vh - 80px) !important;
                overflow-y: auto !important;
                flex: 1 !important;
            }

            .pos-search-input {
                border: 3px solid #e9f5f0;
                border-radius: 12px;
                padding: 15px 20px;
                font-size: 1.1rem;
                transition: all 0.3s ease;
            }

            .pos-search-input:focus {
                border-color: #52b788;
                box-shadow: 0 0 0 0.25rem rgba(82, 183, 136, 0.25);
                transform: translateY(-2px);
            }

            .product-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                gap: 15px;
                margin-top: 20px;
            }

            .product-card {
                background: white;
                border-radius: 12px;
                padding: 15px;
                text-align: center;
                cursor: pointer;
                transition: all 0.3s ease;
                border: 2px solid transparent;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            }

            .product-card:hover {
                transform: translateY(-5px);
                border-color: #52b788;
                box-shadow: 0 8px 25px rgba(82, 183, 136, 0.2);
            }

            .product-image {
                width: 60px;
                height: 60px;
                background: linear-gradient(135deg, #52b788, #74c69d);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 10px;
                color: white;
                font-size: 1.5rem;
            }

            .product-name {
                font-weight: 600;
                color: #2d6a4f;
                margin-bottom: 5px;
                font-size: 0.9rem;
            }

            .product-price {
                color: #52b788;
                font-weight: bold;
                font-size: 1rem;
            }

            .product-stock {
                color: #6c757d;
                font-size: 0.8rem;
            }

            .cart-section {
                background: white !important;
                border-radius: 0 !important;
                padding: 20px !important;
                height: calc(100vh - 80px) !important;
                min-height: calc(100vh - 80px) !important;
                position: relative !important;
                display: flex !important;
                flex-direction: column !important;
                overflow-y: auto !important;
            }

            .cart-header {
                display: flex;
                align-items: center;
                margin-bottom: 20px;
                padding-bottom: 15px;
                border-bottom: 2px solid #e9f5f0;
            }

            .cart-icon {
                background: linear-gradient(135deg, #52b788, #74c69d);
                color: white;
                width: 40px;
                height: 40px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-right: 10px;
            }

            .member-select {
                background: #f8f9fa;
                border: 2px solid #e9f5f0;
                border-radius: 10px;
                padding: 12px;
                margin-bottom: 20px;
            }

            .member-dropdown {
                position: relative;
            }

            .member-input {
                border: 2px solid #e9f5f0;
                border-radius: 8px;
                padding: 10px 15px;
                width: 100%;
            }

            .member-dropdown-list {
                position: absolute;
                top: 100%;
                left: 0;
                right: 0;
                background: white;
                border: 2px solid #e9f5f0;
                border-radius: 8px;
                max-height: 200px;
                overflow-y: auto;
                z-index: 1000;
                display: none;
            }

            .member-option {
                padding: 10px 15px;
                cursor: pointer;
                border-bottom: 1px solid #f8f9fa;
                transition: background-color 0.2s;
            }

            .member-option:hover {
                background-color: #e9f5f0;
            }

            .cart-items {
                flex: 1;
                overflow-y: auto;
                margin-bottom: 20px;
                min-height: 200px;
            }

            .cart-item {
                display: flex;
                align-items: center;
                padding: 12px 0;
                border-bottom: 1px solid #f8f9fa;
            }

            .cart-item-info {
                flex: 1;
            }

            .cart-item-name {
                font-weight: 600;
                color: #2d6a4f;
                font-size: 0.9rem;
            }

            .cart-item-price {
                color: #52b788;
                font-size: 0.8rem;
            }

            .cart-item-controls {
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .qty-btn {
                width: 30px;
                height: 30px;
                border: none;
                border-radius: 50%;
                background: #e9f5f0;
                color: #2d6a4f;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: all 0.2s;
            }

            .qty-btn:hover {
                background: #52b788;
                color: white;
            }

            .qty-display {
                min-width: 30px;
                text-align: center;
                font-weight: 600;
            }

            .cart-total {
                background: linear-gradient(135deg, #e9f5f0, #f8f9fa);
                padding: 20px;
                border-radius: 12px;
                margin-bottom: 20px;
            }

            .total-amount {
                font-size: 1.8rem;
                font-weight: bold;
                color: #2d6a4f;
                text-align: center;
            }

            .payment-section {
                margin-bottom: 20px;
            }

            .payment-method {
                display: flex;
                gap: 10px;
                margin-bottom: 15px;
            }

            .payment-btn {
                flex: 1;
                padding: 12px;
                border: 2px solid #e9f5f0;
                background: white;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.2s;
                text-align: center;
            }

            .payment-btn.active {
                border-color: #52b788;
                background: #e9f5f0;
                color: #2d6a4f;
            }

            .cash-input-section {
                background: #f8f9fa;
                padding: 15px;
                border-radius: 10px;
                margin-bottom: 15px;
            }

            .cash-input {
                border: 2px solid #e9f5f0;
                border-radius: 8px;
                padding: 12px;
                width: 100%;
                font-size: 1.1rem;
                text-align: right;
            }

            .quick-cash {
                display: flex;
                gap: 8px;
                margin-top: 10px;
            }

            .quick-cash-btn {
                flex: 1;
                padding: 8px;
                border: 1px solid #dee2e6;
                background: white;
                border-radius: 6px;
                cursor: pointer;
                font-size: 0.8rem;
            }

            .quick-cash-btn:hover {
                background: #e9f5f0;
            }

            .change-display {
                background: linear-gradient(135deg, #52b788, #74c69d);
                color: white;
                padding: 12px;
                border-radius: 8px;
                text-align: center;
                font-weight: bold;
                font-size: 1.1rem;
            }

            .action-buttons {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }

            .btn-pay {
                background: linear-gradient(135deg, #52b788, #74c69d);
                border: none;
                color: white;
                padding: 15px;
                border-radius: 10px;
                font-weight: 600;
                font-size: 1.1rem;
                transition: all 0.3s;
                cursor: pointer;
            }

            .btn-pay:hover {
                background: linear-gradient(135deg, #2d6a4f, #52b788);
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(82, 183, 136, 0.3);
            }

            .btn-clear {
                background: #dc3545;
                border: none;
                color: white;
                padding: 12px;
                border-radius: 8px;
                font-weight: 600;
                cursor: pointer;
            }

            .btn-clear:hover {
                background: #c82333;
            }

            .empty-cart {
                text-align: center;
                padding: 40px 20px;
                color: #6c757d;
            }

            .empty-cart i {
                font-size: 3rem;
                margin-bottom: 15px;
                opacity: 0.5;
            }

            .no-products {
                text-align: center;
                padding: 60px 20px;
                color: #6c757d;
            }

            .no-products i {
                font-size: 4rem;
                margin-bottom: 20px;
                opacity: 0.3;
            }

            .main-content {
                flex: 1 !important;
                display: flex !important;
                height: calc(100vh - 80px) !important;
                min-height: calc(100vh - 80px) !important;
                width: 100% !important;
                position: relative !important;
                overflow: hidden !important;
            }

            .products-section {
                flex: 1 !important;
                display: flex !important;
                flex-direction: column !important;
                min-width: 0 !important;
                height: calc(100vh - 80px) !important;
                overflow: hidden !important;
            }

            .cart-column {
                width: 400px;
                flex-shrink: 0;
                background: white;
                border-left: 3px solid #e9f5f0;
                box-shadow: -2px 0 10px rgba(45, 106, 79, 0.1);
            }

            /* Responsive Design */
            @media (max-width: 1200px) {
                .cart-column {
                    width: 350px;
                }
            }

            @media (max-width: 992px) {
                .main-content {
                    flex-direction: column;
                }

                .cart-column {
                    width: 100%;
                    height: 40vh;
                    border-left: none;
                    border-top: 3px solid #e9f5f0;
                }

                .products-section {
                    height: 60vh;
                }

                .product-grid {
                    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
                    gap: 10px;
                }
            }

            @media (max-width: 768px) {
                .total-amount {
                    font-size: 1.5rem;
                }
                
                /* Mobile responsive for header buttons */
                .pos-header .d-flex {
                    flex-direction: column;
                    align-items: flex-start !important;
                }
                
                .pos-header .text-end {
                    text-align: left !important;
                    width: 100%;
                    margin-top: 10px;
                }
                
                .tutup-kasir-btn-enhanced {
                    width: 100%;
                    margin-bottom: 8px !important;
                    margin-right: 0 !important;
                }
                
                .pos-header .d-flex.gap-2 {
                    flex-direction: column;
                    gap: 8px !important;
                    width: 100%;
                }
            }
            
            @media (max-width: 576px) {
                .pos-header {
                    padding: 10px 15px;
                }
                
                .tutup-kasir-btn-enhanced {
                    font-size: 0.9rem;
                    padding: 8px 12px;
                }
            }

            /* Enhanced product grid for fullscreen */
            @media (min-width: 1400px) {
                .product-grid {
                    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
                    gap: 15px;
                }
            }

            /* Animation */
            .fade-in {
                animation: fadeIn 0.5s ease;
            }

            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
            }

            /* CRITICAL FIX - Force cart visibility */
            .cart-column {
                display: block !important;
                width: 400px !important;
                min-width: 400px !important;
                max-width: 400px !important;
                flex-shrink: 0 !important;
                background: white !important;
                border-left: 3px solid #52b788 !important;
                box-shadow: -2px 0 10px rgba(45, 106, 79, 0.1) !important;
                position: relative !important;
                z-index: 1 !important;
            }
            
            .cart-section {
                display: flex !important;
                flex-direction: column !important;
                height: 100% !important;
                min-height: 100vh !important;
                padding: 20px !important;
                visibility: visible !important;
                opacity: 1 !important;
            }
            
            .main-content {
                display: flex !important;
                flex-direction: row !important;
                width: 100% !important;
                height: calc(100vh - 80px) !important;
            }
            
            .products-section {
                flex: 1 !important;
                min-width: 0 !important;
                overflow: hidden !important;
            }
        </style>
        
        <div class="pos-container">
            <!-- Header -->
            <div class="pos-header fade-in">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <h2 class="mb-1"><i class="bi bi-shop me-2"></i>Point of Sales</h2>
                        <p class="mb-0 opacity-75">Sistem Kasir Koperasi Karyawan</p>
                    </div>
                    <div class="text-end">
                        <div class="d-flex gap-2 align-items-center flex-wrap">
                            <small class="opacity-75 d-none d-md-block">F1: Search | ESC: Exit | F10: Tutup Kasir</small>
                            <button class="btn btn-warning btn-sm me-2 tutup-kasir-btn-enhanced" 
                                    onclick="showTutupKasirModal()" 
                                    title="Tutup Kasir (F10)"
                                    style="background: linear-gradient(135deg, #ffc107 0%, #ffb300 100%) !important; 
                                           border: 2px solid #fff !important; 
                                           color: #000 !important; 
                                           font-weight: 600 !important; 
                                           box-shadow: 0 2px 8px rgba(255, 193, 7, 0.3) !important; 
                                           position: relative !important; 
                                           z-index: 1001 !important;">
                                <i class="bi bi-calculator me-1"></i>Tutup Kasir
                            </button>
                            <button class="btn btn-outline-light btn-sm" onclick="exitPOSFullscreen()">
                                <i class="bi bi-arrow-left me-1"></i>Kembali ke Menu
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="main-content">
                <!-- Product Search & Display -->
                <div class="products-section">
                    <!-- Search Section -->
                    <div class="pos-search-section fade-in">
                        <h5 class="mb-3"><i class="bi bi-search me-2"></i>Cari Produk</h5>
                        <input type="text" class="pos-search-input" id="productSearch" 
                               placeholder="Ketik nama produk atau scan barcode..." 
                               onkeyup="searchProducts(event)">
                        
                        <!-- Product Grid -->
                        <div class="product-grid" id="productGrid">
                            <!-- Products will be loaded here -->
                        </div>
                        
                        <!-- No Products Message -->
                        <div class="no-products" id="noProducts" style="display: none;">
                            <i class="bi bi-box-seam"></i>
                            <h5>Tidak ada produk ditemukan</h5>
                            <p>Coba kata kunci lain atau scan barcode produk</p>
                        </div>
                    </div>
                </div>

                <!-- Cart Section -->
                <div class="cart-column" style="display: block !important; width: 400px !important; min-width: 400px !important; background: white !important; border-left: 3px solid #52b788 !important; flex-shrink: 0 !important;">
                    <div class="cart-section fade-in" style="display: flex !important; flex-direction: column !important; height: 100% !important; padding: 20px !important;">
                        <!-- Cart Header -->
                        <div class="cart-header">
                            <div class="cart-icon">
                                <i class="bi bi-cart3"></i>
                            </div>
                            <div>
                                <h5 class="mb-0">Keranjang Belanja</h5>
                                <small class="text-muted">Total <span id="cartCount">0</span> item</small>
                            </div>
                        </div>

                        <!-- Member Selection -->
                        <div class="member-select">
                            <label class="form-label mb-2"><i class="bi bi-person me-1"></i>Pilih Anggota</label>
                            <div class="member-dropdown">
                                <input type="text" class="member-input" id="memberSearch" 
                                       placeholder="Ketik nama atau NIK anggota..." 
                                       onfocus="showMemberDropdown()" 
                                       onkeyup="filterMembers(event)">
                                <div class="member-dropdown-list" id="memberDropdown">
                                    <!-- Member options will be loaded here -->
                                </div>
                                <input type="hidden" id="selectedMember">
                            </div>
                        </div>

                        <!-- Cart Items -->
                        <div class="cart-items" id="cartItems">
                            <div class="empty-cart">
                                <i class="bi bi-cart-x"></i>
                                <h6>Keranjang Kosong</h6>
                                <p>Pilih produk untuk memulai transaksi</p>
                            </div>
                        </div>

                        <!-- Cart Total -->
                        <div class="cart-total">
                            <div class="total-amount" id="totalAmount">Rp 0</div>
                        </div>

                        <!-- Payment Method -->
                        <div class="payment-section">
                            <label class="form-label mb-2"><i class="bi bi-credit-card me-1"></i>Metode Pembayaran</label>
                            <div class="payment-method">
                                <div class="payment-btn active" onclick="selectPaymentMethod('cash')">
                                    <i class="bi bi-cash me-1"></i>Cash
                                </div>
                                <div class="payment-btn" onclick="selectPaymentMethod('credit')">
                                    <i class="bi bi-credit-card me-1"></i>Kredit
                                </div>
                            </div>

                            <!-- Cash Payment Section -->
                            <div class="cash-input-section" id="cashSection">
                                <label class="form-label mb-2">Uang Bayar</label>
                                <input type="number" class="cash-input" id="cashInput" 
                                       placeholder="0" onkeyup="calculateChange()">
                                <div class="quick-cash">
                                    <button class="quick-cash-btn" onclick="setExactAmount()">Pas</button>
                                    <button class="quick-cash-btn" onclick="addAmount(50000)">50K</button>
                                    <button class="quick-cash-btn" onclick="addAmount(100000)">100K</button>
                                    <button class="quick-cash-btn" onclick="addAmount(200000)">200K</button>
                                </div>
                                <div class="change-display mt-3" id="changeDisplay">
                                    Kembalian: Rp 0
                                </div>
                            </div>
                        </div>

                        <!-- Action Buttons -->
                        <div class="action-buttons">
                            <button class="btn-pay" onclick="processPayment()">
                                <i class="bi bi-check-circle me-2"></i>Bayar Sekarang
                            </button>
                            <button class="btn-clear" onclick="clearCart()">
                                <i class="bi bi-trash me-2"></i>Kosongkan Keranjang
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Initialize POS
    initializePOSFullscreen();
}

// Exit POS fullscreen and return to normal menu
function exitPOSFullscreen() {
    // Restore normal layout
    document.getElementById('sidebar').style.display = '';
    document.querySelector('.navbar').style.display = '';
    
    // Reset body styles to normal
    document.body.style.margin = '';
    document.body.style.padding = '';
    document.body.style.overflow = '';
    document.body.style.height = '';
    document.body.style.width = '';
    
    const content = document.getElementById('mainContent');
    content.style.padding = '';
    content.style.margin = '';
    content.style.height = '';
    content.style.width = '';
    content.style.position = '';
    content.style.top = '';
    content.style.left = '';
    content.style.zIndex = '';
    
    // Navigate back to dashboard
    navigateTo('dashboard');
}

// Initialize POS fullscreen functionality
function initializePOSFullscreen() {
    loadProductsPOS();
    loadMembersPOS();
    updateCartDisplayPOS();
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', function(event) {
        // ESC to exit POS
        if (event.key === 'Escape') {
            event.preventDefault();
            exitPOSFullscreen();
        }
        
        // F1 to focus search input
        if (event.key === 'F1') {
            event.preventDefault();
            document.getElementById('productSearch').focus();
        }
        
        // F12 to clear cart
        if (event.key === 'F12') {
            event.preventDefault();
            clearCartPOS();
        }
        
        // F10 to open tutup kasir modal
        if (event.key === 'F10') {
            event.preventDefault();
            showTutupKasirModal();
        }
        
        // Ctrl + Shift + T for tutup kasir (alternative)
        if (event.ctrlKey && event.shiftKey && event.key === 'T') {
            event.preventDefault();
            showTutupKasirModal();
        }
    });
    
    // Hide dropdown when clicking outside
    document.addEventListener('click', function(event) {
        const dropdown = document.getElementById('memberDropdown');
        const input = document.getElementById('memberSearch');
        
        if (dropdown && input && !dropdown.contains(event.target) && !input.contains(event.target)) {
            dropdown.style.display = 'none';
        }
    });
    
    // Initialize tutup kasir enhancements
    setTimeout(initTutupKasirEnhancements, 500);
    
    // Initialize keyboard accessibility manager
    setTimeout(() => {
        if (!window.tutupKasirAccessibilityManager) {
            // Load the accessibility module if not already loaded
            const script = document.createElement('script');
            script.src = 'js/keyboard-accessibility-tutup-kasir.js';
            script.onload = () => {
                window.tutupKasirAccessibilityManager = new TutupKasirAccessibilityManager();
            };
            document.head.appendChild(script);
        }
        
        // Dispatch custom event to notify accessibility manager
        document.dispatchEvent(new CustomEvent('posRendered'));
    }, 1000);
}

// Load products for POS
function loadProductsPOS(searchQuery = '') {
    const barang = JSON.parse(localStorage.getItem('barang') || '[]');
    const productGrid = document.getElementById('productGrid');
    const noProducts = document.getElementById('noProducts');
    
    let filteredProducts = barang;
    if (searchQuery) {
        filteredProducts = barang.filter(b => 
            b.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (b.barcode && b.barcode.includes(searchQuery))
        );
    }

    if (filteredProducts.length === 0) {
        productGrid.style.display = 'none';
        noProducts.style.display = 'block';
        return;
    }

    productGrid.style.display = 'grid';
    noProducts.style.display = 'none';

    productGrid.innerHTML = filteredProducts.map(product => `
        <div class="product-card" onclick="addToCartPOS('${product.id}')">
            <div class="product-image">
                <i class="bi bi-box"></i>
            </div>
            <div class="product-name">${product.nama}</div>
            <div class="product-price">${formatRupiah(product.hargaJual)}</div>
            <div class="product-stock">Stok: ${product.stok}</div>
        </div>
    `).join('');
}

// Load members for POS
function loadMembersPOS() {
    const anggota = JSON.parse(localStorage.getItem('anggota') || '[]');
    const memberDropdown = document.getElementById('memberDropdown');
    
    // Add "Umum" option and active members
    const members = [
        { id: '', nama: 'Umum (Cash)', nik: '' },
        ...anggota.filter(a => a.statusKeanggotaan === 'Aktif')
    ];
    
    memberDropdown.innerHTML = members.map(member => `
        <div class="member-option" onclick="selectMemberPOS('${member.id}', '${member.nama}', '${member.nik || ''}')">
            <strong>${member.nama}</strong>
            ${member.nik ? `<br><small class="text-muted">NIK: ${member.nik}</small>` : ''}
        </div>
    `).join('');
}

// Search products
function searchProducts(event) {
    const query = event.target.value.trim();
    
    if (event.key === 'Enter' && query) {
        // Try barcode exact match
        const barang = JSON.parse(localStorage.getItem('barang') || '[]');
        const product = barang.find(b => b.barcode === query);
        if (product) {
            addToCartPOS(product.id);
            event.target.value = '';
            loadProductsPOS();
            return;
        }
    }
    
    loadProductsPOS(query);
}

// Show member dropdown
function showMemberDropdown() {
    document.getElementById('memberDropdown').style.display = 'block';
}

// Filter members
function filterMembers(event) {
    const query = event.target.value.toLowerCase();
    const options = document.querySelectorAll('.member-option');
    
    options.forEach(option => {
        const text = option.textContent.toLowerCase();
        option.style.display = text.includes(query) ? 'block' : 'none';
    });
}

// Select member
function selectMemberPOS(id, nama, nik) {
    document.getElementById('memberSearch').value = nama;
    document.getElementById('selectedMember').value = id;
    document.getElementById('memberDropdown').style.display = 'none';
}

// Add to cart
function addToCartPOS(productId) {
    const barang = JSON.parse(localStorage.getItem('barang') || '[]');
    const product = barang.find(b => b.id === productId);
    
    if (!product || product.stok <= 0) {
        showAlert('Produk tidak tersedia atau stok habis', 'error');
        return;
    }

    const existingItem = cart.find(item => item.id === productId);
    if (existingItem) {
        if (existingItem.qty < product.stok) {
            existingItem.qty++;
        } else {
            showAlert('Stok tidak mencukupi', 'error');
            return;
        }
    } else {
        cart.push({
            id: product.id,
            nama: product.nama,
            hargaJual: product.hargaJual,
            qty: 1,
            stok: product.stok
        });
    }

    updateCartDisplayPOS();
}

// Update cart display
function updateCartDisplayPOS() {
    const cartItems = document.getElementById('cartItems');
    const cartCount = document.getElementById('cartCount');
    const totalAmount = document.getElementById('totalAmount');

    if (cart.length === 0) {
        cartItems.innerHTML = `
            <div class="empty-cart">
                <i class="bi bi-cart-x"></i>
                <h6>Keranjang Kosong</h6>
                <p>Pilih produk untuk memulai transaksi</p>
            </div>
        `;
        cartCount.textContent = '0';
        totalAmount.textContent = 'Rp 0';
        return;
    }

    cartItems.innerHTML = cart.map(item => `
        <div class="cart-item">
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
        </div>
    `).join('');

    const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
    const total = cart.reduce((sum, item) => sum + (item.hargaJual * item.qty), 0);

    cartCount.textContent = totalItems;
    totalAmount.textContent = formatRupiah(total);

    calculateChangePOS();
}

// Update quantity
function updateQtyPOS(productId, change) {
    const item = cart.find(item => item.id === productId);
    if (!item) return;

    const newQty = item.qty + change;
    if (newQty <= 0) {
        removeFromCartPOS(productId);
        return;
    }

    if (newQty > item.stok) {
        showAlert('Stok tidak mencukupi', 'error');
        return;
    }

    item.qty = newQty;
    updateCartDisplayPOS();
}

// Remove from cart
function removeFromCartPOS(productId) {
    cart = cart.filter(item => item.id !== productId);
    updateCartDisplayPOS();
}

// Clear cart
function clearCartPOS() {
    if (cart.length === 0) return;
    
    if (confirm('Yakin ingin mengosongkan keranjang?')) {
        cart = [];
        updateCartDisplayPOS();
    }
}

// Select payment method
function selectPaymentMethod(method) {
    selectedPaymentMethod = method;
    
    // Update UI
    document.querySelectorAll('.payment-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    event.target.classList.add('active');
    
    const cashSection = document.getElementById('cashSection');
    if (cashSection) {
        cashSection.style.display = method === 'cash' ? 'block' : 'none';
    }
}

// Set exact amount
function setExactAmount() {
    const total = cart.reduce((sum, item) => sum + (item.hargaJual * item.qty), 0);
    document.getElementById('cashInput').value = total;
    calculateChangePOS();
}

// Add amount
function addAmount(amount) {
    const currentAmount = parseFloat(document.getElementById('cashInput').value) || 0;
    document.getElementById('cashInput').value = currentAmount + amount;
    calculateChangePOS();
}

// Calculate change
function calculateChangePOS() {
    if (selectedPaymentMethod !== 'cash') return;

    const total = cart.reduce((sum, item) => sum + (item.hargaJual * item.qty), 0);
    const cash = parseFloat(document.getElementById('cashInput').value) || 0;
    const change = cash - total;

    const changeDisplay = document.getElementById('changeDisplay');
    
    if (change < 0) {
        changeDisplay.textContent = 'Uang kurang: ' + formatRupiah(Math.abs(change));
        changeDisplay.style.background = 'linear-gradient(135deg, #dc3545, #c82333)';
    } else {
        changeDisplay.textContent = 'Kembalian: ' + formatRupiah(change);
        changeDisplay.style.background = 'linear-gradient(135deg, #52b788, #74c69d)';
    }
}

// Process payment (integrate with existing POS logic)
function processPayment() {
    if (cart.length === 0) {
        showAlert('Keranjang kosong', 'error');
        return;
    }

    const total = cart.reduce((sum, item) => sum + (item.hargaJual * item.qty), 0);
    const anggotaId = document.getElementById('selectedMember').value;

    if (selectedPaymentMethod === 'cash') {
        const cash = parseFloat(document.getElementById('cashInput').value) || 0;
        if (cash < total) {
            showAlert('Uang bayar kurang dari total belanja', 'error');
            return;
        }
        
        // Process cash payment
        processCashPayment(total, cash, anggotaId);
    } else {
        // Process credit payment
        processCreditPayment(total, anggotaId);
    }
}

// Process cash payment
function processCashPayment(total, cash, anggotaId) {
    const change = cash - total;
    
    // Save transaction
    const transaksi = {
        id: generateId(),
        tanggal: new Date().toISOString(),
        items: cart.map(item => ({
            barangId: item.id,
            nama: item.nama,
            qty: item.qty,
            harga: item.hargaJual,
            subtotal: item.qty * item.hargaJual
        })),
        total: total,
        bayar: cash,
        kembalian: change,
        anggotaId: anggotaId || null,
        status: 'cash',
        kasir: currentUser?.nama || 'Kasir'
    };
    
    // Update stock
    updateStockAfterSale();
    
    // Save to localStorage
    const penjualan = JSON.parse(localStorage.getItem('penjualan') || '[]');
    penjualan.push(transaksi);
    localStorage.setItem('penjualan', JSON.stringify(penjualan));
    
    // Show success message
    showAlert(`Pembayaran berhasil! Kembalian: ${formatRupiah(change)}`, 'success');
    
    // Print receipt
    printStrukPOS(transaksi);
    
    // Clear cart
    cart = [];
    updateCartDisplayPOS();
    document.getElementById('cashInput').value = '';
    calculateChangePOS();
}

// Process credit payment
function processCreditPayment(total, anggotaId) {
    if (!anggotaId) {
        showAlert('Pilih anggota untuk pembayaran kredit', 'error');
        return;
    }
    
    // Validate anggota for credit
    const validation = validateAnggotaForPOS(anggotaId);
    if (!validation.valid) {
        showAlert(validation.error, 'error');
        return;
    }
    
    // Save credit transaction
    const transaksi = {
        id: generateId(),
        tanggal: new Date().toISOString(),
        items: cart.map(item => ({
            barangId: item.id,
            nama: item.nama,
            qty: item.qty,
            harga: item.hargaJual,
            subtotal: item.qty * item.hargaJual
        })),
        total: total,
        anggotaId: anggotaId,
        status: 'kredit',
        kasir: currentUser?.nama || 'Kasir'
    };
    
    // Update stock
    updateStockAfterSale();
    
    // Save to localStorage
    const penjualan = JSON.parse(localStorage.getItem('penjualan') || '[]');
    penjualan.push(transaksi);
    localStorage.setItem('penjualan', JSON.stringify(penjualan));
    
    // Show success message
    showAlert('Transaksi kredit berhasil disimpan!', 'success');
    
    // Print receipt
    printStrukPOS(transaksi);
    
    // Clear cart
    cart = [];
    updateCartDisplayPOS();
}

// Update stock after sale
function updateStockAfterSale() {
    const barang = JSON.parse(localStorage.getItem('barang') || '[]');
    
    cart.forEach(cartItem => {
        const product = barang.find(b => b.id === cartItem.id);
        if (product) {
            product.stok -= cartItem.qty;
        }
    });
    
    localStorage.setItem('barang', JSON.stringify(barang));
    
    // Reload products to show updated stock
    loadProductsPOS();
}

// Print receipt for POS
function printStrukPOS(transaksi) {
    const koperasi = JSON.parse(localStorage.getItem('koperasi') || '{}');
    const anggota = JSON.parse(localStorage.getItem('anggota') || '[]');
    const member = anggota.find(a => a.id === transaksi.anggotaId);
    
    const strukWindow = window.open('', '', 'width=300,height=600');
    strukWindow.document.write(`
        <html>
        <head>
            <title>Struk Pembayaran</title>
            <style>
                body { font-family: monospace; font-size: 12px; padding: 10px; }
                .center { text-align: center; }
                .right { text-align: right; }
                hr { border: 1px dashed #000; }
                .logo { max-width: 80px; max-height: 80px; margin: 10px auto; }
            </style>
        </head>
        <body>
            <div class="center">
                ${koperasi.logo ? `<img src="${koperasi.logo}" alt="Logo" class="logo">` : ''}
                <h3 style="margin: 5px 0;">${koperasi.nama || 'Koperasi Karyawan'}</h3>
                <p style="margin: 5px 0;">${koperasi.alamat || ''}</p>
                ${koperasi.telepon ? `<p style="margin: 5px 0;">Telp: ${koperasi.telepon}</p>` : ''}
            </div>
            <hr>
            <p>No: ${transaksi.id}<br>
            Tanggal: ${formatDate(transaksi.tanggal)}<br>
            Kasir: ${transaksi.kasir}<br>
            ${member ? `Anggota: ${member.nama}` : 'Pembeli: Umum'}</p>
            <hr>
            ${transaksi.items.map(item => `
                <p style="margin: 5px 0;">${item.nama}<br>
                ${item.qty} x ${formatRupiah(item.harga)} = ${formatRupiah(item.subtotal)}</p>
            `).join('')}
            <hr>
            <p class="right"><strong>Total: ${formatRupiah(transaksi.total)}</strong></p>
            ${transaksi.status === 'cash' && transaksi.bayar ? `
                <p class="right">Bayar: ${formatRupiah(transaksi.bayar)}</p>
                <p class="right">Kembalian: ${formatRupiah(transaksi.kembalian)}</p>
            ` : ''}
            ${transaksi.status === 'kredit' ? `
                <p class="center" style="margin-top: 10px; font-weight: bold;">KREDIT / BON</p>
            ` : ''}
            <hr>
            <p class="center" style="margin-top: 15px;">Terima Kasih<br>Atas Kunjungan Anda</p>
        </body>
        </html>
    `);
    strukWindow.document.close();
    strukWindow.print();
}

// Legacy function aliases for compatibility
function addToCart(productId) {
    addToCartPOS(productId);
}

function clearCart() {
    clearCartPOS();
}

function calculateChange() {
    calculateChangePOS();
}

// Validate anggota for POS transactions
function validateAnggotaForPOS(anggotaId) {
    const anggota = JSON.parse(localStorage.getItem('anggota') || '[]');
    const member = anggota.find(a => a.id === anggotaId);
    
    if (!member) {
        return { valid: false, error: 'Anggota tidak ditemukan' };
    }
    
    if (member.statusKeanggotaan !== 'Aktif') {
        return { valid: false, error: 'Anggota tidak aktif' };
    }
    
    return { valid: true, anggota: member };
}

// Show buka kas modal (simplified version)
function showBukaKasModal() {
    const content = document.getElementById('mainContent');
    
    content.innerHTML = `
        <div class="row justify-content-center mt-5">
            <div class="col-md-6">
                <div class="card">
                    <div class="card-body">
                        <h3 class="text-center mb-4">Buka Kas</h3>
                        
                        <form id="bukaKasForm">
                            <div class="mb-3">
                                <label class="form-label">Modal Awal Kasir</label>
                                <input type="number" class="form-control" id="modalKasir" required>
                                <small class="text-muted">Masukkan modal untuk uang kembalian</small>
                            </div>
                            
                            <div class="d-grid">
                                <button type="submit" class="btn btn-primary">
                                    <i class="bi bi-box-arrow-in-right me-2"></i>Buka Kas
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('bukaKasForm').addEventListener('submit', function(e) {
        e.preventDefault();
        modalKasir = parseFloat(document.getElementById('modalKasir').value);
        
        const shiftData = {
            id: generateId(),
            kasir: currentUser?.name || 'Kasir',
            kasirId: currentUser?.id || 'kasir1',
            modalAwal: modalKasir,
            waktuBuka: new Date().toISOString(),
            status: 'buka'
        };
        
        sessionStorage.setItem('bukaKas', JSON.stringify(shiftData));
        sessionStorage.setItem('shiftId', shiftData.id);
        
        showAlert('Kas berhasil dibuka');
        renderPOS();
    });
}

// Show tutup kasir modal
function showTutupKasirModal() {
    // Enhanced session validation
    const bukaKas = sessionStorage.getItem('bukaKas');
    if (!bukaKas) {
        showAlert('Belum ada kas yang dibuka. Silakan buka kas terlebih dahulu untuk memulai shift.', 'error');
        return;
    }
    
    let shiftData;
    try {
        shiftData = JSON.parse(bukaKas);
        
        // Validate required fields
        if (!shiftData.kasir || !shiftData.modalAwal || !shiftData.waktuBuka) {
            sessionStorage.removeItem('bukaKas');
            sessionStorage.removeItem('shiftId');
            showAlert('Data buka kas tidak lengkap. Session telah dibersihkan, silakan buka kas ulang.', 'error');
            return;
        }
    } catch (e) {
        sessionStorage.removeItem('bukaKas');
        sessionStorage.removeItem('shiftId');
        showAlert('Data buka kas corrupt. Session telah dibersihkan, silakan buka kas ulang.', 'error');
        return;
    }
    const penjualan = JSON.parse(localStorage.getItem('penjualan') || '[]');
    
    // Filter penjualan untuk shift ini (berdasarkan waktu)
    const waktuBuka = new Date(shiftData.waktuBuka);
    const sekarang = new Date();
    
    const penjualanShift = penjualan.filter(p => {
        const tanggalPenjualan = new Date(p.tanggal);
        return tanggalPenjualan >= waktuBuka && tanggalPenjualan <= sekarang;
    });
    
    // Hitung total penjualan
    const totalPenjualan = penjualanShift.reduce((sum, p) => sum + p.total, 0);
    const totalCash = penjualanShift.filter(p => p.status === 'cash').reduce((sum, p) => sum + p.total, 0);
    const totalKredit = penjualanShift.filter(p => p.status === 'kredit').reduce((sum, p) => sum + p.total, 0);
    
    // Kas yang seharusnya ada
    const kasSeharusnya = shiftData.modalAwal + totalCash;
    
    // Create modal HTML
    const modalHTML = `
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
                        <div class="row mb-4">
                            <div class="col-md-6">
                                <div class="card">
                                    <div class="card-body">
                                        <h6 class="text-muted">Informasi Shift</h6>
                                        <p class="mb-1"><strong>Kasir:</strong> ${shiftData.kasir}</p>
                                        <p class="mb-1"><strong>Waktu Buka:</strong> ${formatDateTime(shiftData.waktuBuka)}</p>
                                        <p class="mb-0"><strong>Modal Awal:</strong> ${formatRupiah(shiftData.modalAwal)}</p>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="card">
                                    <div class="card-body">
                                        <h6 class="text-muted">Ringkasan Penjualan</h6>
                                        <p class="mb-1"><strong>Total Transaksi:</strong> ${penjualanShift.length}</p>
                                        <p class="mb-1"><strong>Penjualan Cash:</strong> ${formatRupiah(totalCash)}</p>
                                        <p class="mb-0"><strong>Penjualan Kredit:</strong> ${formatRupiah(totalKredit)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="row mb-4">
                            <div class="col-md-12">
                                <div class="card bg-light">
                                    <div class="card-body">
                                        <h6 class="text-muted">Perhitungan Kas</h6>
                                        <div class="row">
                                            <div class="col-md-4">
                                                <p class="mb-1">Modal Awal:</p>
                                                <h5 class="text-primary">${formatRupiah(shiftData.modalAwal)}</h5>
                                            </div>
                                            <div class="col-md-4">
                                                <p class="mb-1">Penjualan Cash:</p>
                                                <h5 class="text-success">${formatRupiah(totalCash)}</h5>
                                            </div>
                                            <div class="col-md-4">
                                                <p class="mb-1">Kas Seharusnya:</p>
                                                <h5 class="text-info">${formatRupiah(kasSeharusnya)}</h5>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <form id="tutupKasirForm">
                            <div class="mb-3">
                                <label class="form-label"><strong>Kas Aktual (Hitung Uang di Kasir)</strong></label>
                                <input type="number" class="form-control form-control-lg" id="kasAktual" 
                                       placeholder="Masukkan jumlah uang yang ada di kasir" required>
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
    
    // Remove existing modal if any
    const existingModal = document.getElementById('tutupKasirModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('tutupKasirModal'));
    modal.show();
    
    // Add event listener for kas aktual input
    document.getElementById('kasAktual').addEventListener('input', function() {
        const kasAktual = parseFloat(this.value) || 0;
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
    });
}

// Proses tutup kasir
function prosesTutupKasir() {
    const kasAktual = parseFloat(document.getElementById('kasAktual').value);
    const keteranganSelisih = document.getElementById('keteranganSelisih').value;
    
    if (!kasAktual || kasAktual < 0) {
        showAlert('Masukkan kas aktual yang valid', 'error');
        return;
    }
    
    const bukaKas = JSON.parse(sessionStorage.getItem('bukaKas'));
    const penjualan = JSON.parse(localStorage.getItem('penjualan') || '[]');
    
    // Filter penjualan untuk shift ini
    const waktuBuka = new Date(bukaKas.waktuBuka);
    const sekarang = new Date();
    
    const penjualanShift = penjualan.filter(p => {
        const tanggalPenjualan = new Date(p.tanggal);
        return tanggalPenjualan >= waktuBuka && tanggalPenjualan <= sekarang;
    });
    
    // Hitung totals
    const totalPenjualan = penjualanShift.reduce((sum, p) => sum + p.total, 0);
    const totalCash = penjualanShift.filter(p => p.status === 'cash').reduce((sum, p) => sum + p.total, 0);
    const totalKredit = penjualanShift.filter(p => p.status === 'kredit').reduce((sum, p) => sum + p.total, 0);
    const kasSeharusnya = bukaKas.modalAwal + totalCash;
    const selisih = kasAktual - kasSeharusnya;
    
    // Create tutup kasir record
    const tutupKasData = {
        id: generateId(),
        shiftId: bukaKas.id,
        kasir: bukaKas.kasir,
        kasirId: bukaKas.kasirId,
        waktuBuka: bukaKas.waktuBuka,
        waktuTutup: sekarang.toISOString(),
        modalAwal: bukaKas.modalAwal,
        totalPenjualan: totalPenjualan,
        totalCash: totalCash,
        totalKredit: totalKredit,
        kasSeharusnya: kasSeharusnya,
        kasAktual: kasAktual,
        selisih: selisih,
        keteranganSelisih: keteranganSelisih,
        jumlahTransaksi: penjualanShift.length,
        tanggalTutup: sekarang.toISOString().split('T')[0]
    };
    
    // Save to localStorage
    const riwayatTutupKas = JSON.parse(localStorage.getItem('riwayatTutupKas') || '[]');
    riwayatTutupKas.push(tutupKasData);
    localStorage.setItem('riwayatTutupKas', JSON.stringify(riwayatTutupKas));
    
    // Create journal entry for selisih if any
    if (selisih !== 0) {
        const keterangan = `Selisih Kas Tutup Kasir - ${bukaKas.kasir} - ${formatDate(sekarang)}`;
        
        if (selisih > 0) {
            // Kas lebih - Debit Kas, Kredit Pendapatan Lain-lain
            addJurnal(keterangan, [
                { akun: '1001', debit: Math.abs(selisih), kredit: 0 }, // Kas
                { akun: '4002', debit: 0, kredit: Math.abs(selisih) }  // Pendapatan Lain-lain
            ]);
        } else {
            // Kas kurang - Debit Beban Lain-lain, Kredit Kas
            addJurnal(keterangan, [
                { akun: '5002', debit: Math.abs(selisih), kredit: 0 }, // Beban Lain-lain
                { akun: '1001', debit: 0, kredit: Math.abs(selisih) }  // Kas
            ]);
        }
    }
    
    // Clear session
    sessionStorage.removeItem('bukaKas');
    sessionStorage.removeItem('shiftId');
    
    // Hide modal
    bootstrap.Modal.getInstance(document.getElementById('tutupKasirModal')).hide();
    
    // Print laporan
    printLaporanTutupKasir(tutupKasData);
    
    // Show success message
    showAlert('Kas berhasil ditutup dan laporan telah dicetak!', 'success');
    
    // Return to dashboard
    setTimeout(() => {
        exitPOSFullscreen();
    }, 2000);
}

// Print laporan tutup kasir
function printLaporanTutupKasir(data) {
    const koperasi = JSON.parse(localStorage.getItem('koperasi') || '{}');
    
    const laporanWindow = window.open('', '', 'width=800,height=600');
    laporanWindow.document.write(`
        <html>
        <head>
            <title>Laporan Tutup Kasir</title>
            <style>
                body { 
                    font-family: Arial, sans-serif; 
                    font-size: 12px; 
                    padding: 20px; 
                    line-height: 1.4;
                }
                .header { 
                    text-align: center; 
                    margin-bottom: 30px; 
                    border-bottom: 2px solid #000;
                    padding-bottom: 15px;
                }
                .logo { 
                    max-width: 80px; 
                    max-height: 80px; 
                    margin: 10px auto; 
                }
                .section { 
                    margin-bottom: 20px; 
                }
                .section-title { 
                    font-weight: bold; 
                    background: #f0f0f0; 
                    padding: 8px; 
                    margin-bottom: 10px;
                    border: 1px solid #ccc;
                }
                .info-row { 
                    display: flex; 
                    justify-content: space-between; 
                    margin-bottom: 5px; 
                }
                .amount { 
                    text-align: right; 
                    font-weight: bold; 
                }
                .total-row { 
                    border-top: 2px solid #000; 
                    padding-top: 5px; 
                    font-weight: bold; 
                }
                .signature { 
                    margin-top: 50px; 
                    display: flex; 
                    justify-content: space-between; 
                }
                .signature-box { 
                    text-align: center; 
                    width: 200px; 
                }
                .signature-line { 
                    border-top: 1px solid #000; 
                    margin-top: 60px; 
                    padding-top: 5px; 
                }
                @media print {
                    body { margin: 0; padding: 15px; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                ${koperasi.logo ? `<img src="${koperasi.logo}" alt="Logo" class="logo">` : ''}
                <h2 style="margin: 10px 0;">${koperasi.nama || 'Koperasi Karyawan'}</h2>
                <p style="margin: 5px 0;">${koperasi.alamat || ''}</p>
                ${koperasi.telepon ? `<p style="margin: 5px 0;">Telp: ${koperasi.telepon}</p>` : ''}
                <h3 style="margin: 15px 0 5px 0;">LAPORAN TUTUP KASIR</h3>
                <p style="margin: 0;">No: TK-${data.id}</p>
            </div>

            <div class="section">
                <div class="section-title">INFORMASI SHIFT</div>
                <div class="info-row">
                    <span>Kasir:</span>
                    <span>${data.kasir}</span>
                </div>
                <div class="info-row">
                    <span>Waktu Buka:</span>
                    <span>${formatDateTime(data.waktuBuka)}</span>
                </div>
                <div class="info-row">
                    <span>Waktu Tutup:</span>
                    <span>${formatDateTime(data.waktuTutup)}</span>
                </div>
                <div class="info-row">
                    <span>Durasi Shift:</span>
                    <span>${calculateShiftDuration(data.waktuBuka, data.waktuTutup)}</span>
                </div>
            </div>

            <div class="section">
                <div class="section-title">RINGKASAN PENJUALAN</div>
                <div class="info-row">
                    <span>Jumlah Transaksi:</span>
                    <span>${data.jumlahTransaksi} transaksi</span>
                </div>
                <div class="info-row">
                    <span>Total Penjualan:</span>
                    <span class="amount">${formatRupiah(data.totalPenjualan)}</span>
                </div>
                <div class="info-row">
                    <span>- Penjualan Cash:</span>
                    <span class="amount">${formatRupiah(data.totalCash)}</span>
                </div>
                <div class="info-row">
                    <span>- Penjualan Kredit:</span>
                    <span class="amount">${formatRupiah(data.totalKredit)}</span>
                </div>
            </div>

            <div class="section">
                <div class="section-title">REKONSILIASI KAS</div>
                <div class="info-row">
                    <span>Modal Awal Kasir:</span>
                    <span class="amount">${formatRupiah(data.modalAwal)}</span>
                </div>
                <div class="info-row">
                    <span>Penjualan Cash:</span>
                    <span class="amount">${formatRupiah(data.totalCash)}</span>
                </div>
                <div class="info-row total-row">
                    <span>Kas Seharusnya:</span>
                    <span class="amount">${formatRupiah(data.kasSeharusnya)}</span>
                </div>
                <div class="info-row">
                    <span>Kas Aktual:</span>
                    <span class="amount">${formatRupiah(data.kasAktual)}</span>
                </div>
                <div class="info-row total-row" style="color: ${data.selisih === 0 ? 'green' : data.selisih > 0 ? 'orange' : 'red'};">
                    <span>Selisih:</span>
                    <span class="amount">${formatRupiah(data.selisih)}</span>
                </div>
                ${data.selisih !== 0 && data.keteranganSelisih ? `
                    <div style="margin-top: 10px; padding: 10px; background: #f9f9f9; border: 1px solid #ddd;">
                        <strong>Keterangan Selisih:</strong><br>
                        ${data.keteranganSelisih}
                    </div>
                ` : ''}
            </div>

            <div class="signature">
                <div class="signature-box">
                    <div>Kasir</div>
                    <div class="signature-line">${data.kasir}</div>
                </div>
                <div class="signature-box">
                    <div>Supervisor</div>
                    <div class="signature-line">(.....................)</div>
                </div>
            </div>

            <div style="margin-top: 30px; text-align: center; font-size: 10px; color: #666;">
                Dicetak pada: ${formatDateTime(new Date().toISOString())}
            </div>
        </body>
        </html>
    `);
    laporanWindow.document.close();
    laporanWindow.print();
}

// Helper function to calculate shift duration
function calculateShiftDuration(waktuBuka, waktuTutup) {
    const start = new Date(waktuBuka);
    const end = new Date(waktuTutup);
    const diff = end - start;
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours} jam ${minutes} menit`;
}

// Helper function to format date time
function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('id-ID', {
        day: '2-digit',
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Enhanced session validation function
function validateBukaKasSession() {
    const bukaKas = sessionStorage.getItem('bukaKas');
    if (!bukaKas) {
        return { 
            valid: false, 
            message: 'Belum ada kas yang dibuka. Silakan buka kas terlebih dahulu untuk memulai shift.',
            action: 'buka_kas'
        };
    }
    
    try {
        const data = JSON.parse(bukaKas);
        if (!data.kasir || !data.modalAwal || !data.waktuBuka) {
            return { 
                valid: false, 
                message: 'Data buka kas tidak lengkap. Silakan buka kas ulang.',
                action: 'buka_kas_ulang'
            };
        }
        return { valid: true, data: data };
    } catch (e) {
        sessionStorage.removeItem('bukaKas');
        sessionStorage.removeItem('shiftId');
        return { 
            valid: false, 
            message: 'Data buka kas corrupt. Session telah dibersihkan, silakan buka kas ulang.',
            action: 'session_corrupt'
        };
    }
}

// Update tutup kasir button status and visibility
function updateTutupKasirButtonStatus() {
    const button = document.querySelector('.tutup-kasir-btn-enhanced');
    if (!button) return;
    
    const sessionValidation = validateBukaKasSession();
    
    if (sessionValidation.valid) {
        button.disabled = false;
        button.style.opacity = '1';
        button.title = `Tutup Kasir (F10) - Kasir: ${sessionValidation.data.kasir}`;
        button.classList.remove('btn-secondary');
        button.classList.add('btn-warning');
    } else {
        button.disabled = true;
        button.style.opacity = '0.6';
        button.title = sessionValidation.message;
        button.classList.remove('btn-warning');
        button.classList.add('btn-secondary');
    }
}

// Initialize tutup kasir enhancements
function initTutupKasirEnhancements() {
    // Update button status immediately
    updateTutupKasirButtonStatus();
    
    // Monitor session changes
    const originalSetItem = sessionStorage.setItem;
    const originalRemoveItem = sessionStorage.removeItem;
    
    sessionStorage.setItem = function(key, value) {
        originalSetItem.apply(this, arguments);
        if (key === 'bukaKas') {
            setTimeout(updateTutupKasirButtonStatus, 100);
        }
    };
    
    sessionStorage.removeItem = function(key) {
        originalRemoveItem.apply(this, arguments);
        if (key === 'bukaKas') {
            setTimeout(updateTutupKasirButtonStatus, 100);
        }
    };
    
    // Periodic status check (every 30 seconds)
    setInterval(updateTutupKasirButtonStatus, 30000);
}

// Enhanced showAlert function with better UX
function showEnhancedAlert(message, type = 'info', actions = []) {
    // Create enhanced alert modal
    const alertModal = document.createElement('div');
    alertModal.className = 'modal fade';
    alertModal.innerHTML = `
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header bg-${type === 'error' ? 'danger' : type === 'success' ? 'success' : 'warning'}">
                    <h5 class="modal-title text-white">
                        <i class="bi bi-${type === 'error' ? 'exclamation-triangle' : type === 'success' ? 'check-circle' : 'info-circle'} me-2"></i>
                        ${type === 'error' ? 'Error' : type === 'success' ? 'Berhasil' : 'Informasi'}
                    </h5>
                </div>
                <div class="modal-body">
                    <p>${message}</p>
                    ${actions.length > 0 ? `
                        <div class="d-flex gap-2 mt-3">
                            ${actions.map(action => `
                                <button class="btn btn-${action.type || 'primary'}" onclick="${action.onclick}">
                                    ${action.text}
                                </button>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Tutup</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(alertModal);
    const modal = new bootstrap.Modal(alertModal);
    modal.show();
    
    // Auto remove after modal is hidden
    alertModal.addEventListener('hidden.bs.modal', () => {
        document.body.removeChild(alertModal);
    });
}