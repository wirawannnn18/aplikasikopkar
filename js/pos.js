// Point of Sales Module

let cart = [];
let modalKasir = 0;
let shiftKasir = null;
let tutupKasData = null;

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
    
    const content = document.getElementById('mainContent');
    content.style.padding = '0';
    content.style.margin = '0';
    
    const barang = JSON.parse(localStorage.getItem('barang') || '[]');
    const anggota = JSON.parse(localStorage.getItem('anggota') || '[]');
    
    // Create fullscreen POS interface
    content.innerHTML = `
        <style>
            /* Fullscreen POS Styles */
            body {
                margin: 0;
                padding: 0;
                overflow: hidden;
            }
            
            .pos-container {
                background: linear-gradient(135deg, #f8f9fa 0%, #e9f5f0 100%);
                height: 100vh;
                width: 100vw;
                padding: 0;
                display: flex;
                flex-direction: column;
            }

            .pos-header {
                background: linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%);
                color: white;
                padding: 15px 20px;
                border-radius: 0;
                margin-bottom: 0;
                box-shadow: 0 2px 10px rgba(45, 106, 79, 0.3);
                flex-shrink: 0;
            }

            .pos-search-section {
                background: white;
                border-radius: 0;
                padding: 20px;
                box-shadow: 0 2px 10px rgba(45, 106, 79, 0.1);
                margin-bottom: 0;
                height: 100%;
                overflow-y: auto;
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
                background: white;
                border-radius: 0;
                padding: 20px;
                box-shadow: -2px 0 10px rgba(45, 106, 79, 0.1);
                height: 100%;
                position: relative;
                display: flex;
                flex-direction: column;
                border-left: 3px solid #e9f5f0;
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
                flex: 1;
                display: flex;
                height: calc(100vh - 70px);
            }

            .products-section {
                flex: 1;
                display: flex;
                flex-direction: column;
            }

            .cart-column {
                width: 400px;
                flex-shrink: 0;
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
                    height: 50vh;
                }

                .products-section {
                    height: 50vh;
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
                        <div class="d-flex gap-2 align-items-center">
                            <small class="opacity-75">F1: Search | ESC: Exit | F12: Clear</small>
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
                <div class="cart-column">
                    <div class="cart-section fade-in">
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
    
    const content = document.getElementById('mainContent');
    content.style.padding = '';
    content.style.margin = '';
    
    // Reset body styles
    document.body.style.overflow = 'auto';
    
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
    });
    
    // Hide dropdown when clicking outside
    document.addEventListener('click', function(event) {
        const dropdown = document.getElementById('memberDropdown');
        const input = document.getElementById('memberSearch');
        
        if (dropdown && input && !dropdown.contains(event.target) && !input.contains(event.target)) {
            dropdown.style.display = 'none';
        }
    });
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

let selectedPaymentMethod = 'cash';

// Select payment method
function selectPaymentMethod(method) {
    selectedPaymentMethod = method;
    
    document.querySelectorAll('.payment-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    event.target.classList.add('active');
    
    const cashSection = document.getElementById('cashSection');
    cashSection.style.display = method === 'cash' ? 'block' : 'none';
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

// Legacy function aliases for compatibility
function addToCart(productId) {
    addToCartPOS(productId);
}

function clearCart() {
    clearCartPOS();
}

function calculateChange() {
    calculateChangePOS();
                        <div class="mb-3">
                            <select class="form-select" id="anggotaSelect" onchange="updateCreditInfo()">
                                <option value="">Umum (Cash)</option>
                                ${filterTransactableAnggota(anggota).map(a => `<option value="${a.id}">${a.nama} - ${a.nik}</option>`).join('')}
                            </select>
                        </div>
                        <!-- Credit Info Section -->
                        <div id="creditInfoSection" style="display: none;">
                            <div class="alert mb-3" id="creditInfoAlert">
                                <h6><i class="bi bi-credit-card me-2"></i>Info Kredit</h6>
                                <div class="row">
                                    <div class="col-6">
                                        <small><strong>Tagihan:</strong></small><br>
                                        <span id="outstandingBalance" style="font-weight: bold;">Rp 0</span>
                                    </div>
                                    <div class="col-6">
                                        <small><strong>Tersedia:</strong></small><br>
                                        <span id="availableCredit" style="font-weight: bold;">Rp 2.000.000</span>
                                    </div>
                                </div>
                                <div id="creditStatusIndicator" class="mt-2" style="font-size: 0.85rem;"></div>
                            </div>
                        </div>
                        <div id="cartItems" style="max-height: 300px; overflow-y: auto;"></div>
                        <hr>
                        <div class="d-flex justify-content-between mb-3">
                            <strong style="font-size: 1.2rem;">Total:</strong>
                            <span class="total-display" id="totalAmount" style="font-size: 1.2rem; font-weight: bold; color: #2d6a4f;">Rp 0</span>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Metode Pembayaran</label>
                            <select class="form-select" id="metodePembayaran" onchange="toggleBayarKembalian()">
                                <option value="cash">Cash</option>
                                <option value="bon">Bon (Kredit)</option>
                            </select>
                        </div>
                        <div id="bayarKembalianSection">
                            <div class="mb-3">
                                <label class="form-label">
                                    <i class="bi bi-cash me-1"></i>Uang Bayar
                                </label>
                                <input type="number" class="form-control" id="uangBayar" 
                                    placeholder="Masukkan jumlah uang bayar" 
                                    onkeyup="hitungKembalian()" 
                                    onchange="hitungKembalian()">
                                <div class="btn-group w-100 mt-2" role="group">
                                    <button type="button" class="btn btn-sm btn-outline-secondary" onclick="setUangPas()">Uang Pas</button>
                                    <button type="button" class="btn btn-sm btn-outline-secondary" onclick="setUangBayar(50000)">50K</button>
                                    <button type="button" class="btn btn-sm btn-outline-secondary" onclick="setUangBayar(100000)">100K</button>
                                </div>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">
                                    <i class="bi bi-arrow-return-left me-1"></i>Kembalian
                                </label>
                                <div class="form-control" id="kembalian" style="background-color: #e9f5f0; font-weight: bold; font-size: 1.1rem; color: #2d6a4f;">
                                    Rp 0
                                </div>
                            </div>
                        </div>
                        <button class="btn btn-success w-100 mb-2" onclick="processPayment()">
                            <i class="bi bi-check-circle"></i> Bayar
                        </button>
                        <button class="btn btn-danger w-100 mb-2" onclick="clearCart()">
                            <i class="bi bi-x-circle"></i> Batal
                        </button>
                        <button class="btn btn-warning w-100" onclick="showTutupKasModal()">
                            <i class="bi bi-lock"></i> Tutup Kasir
                        </button>
                    </div>
                </div>
                
                <!-- Info Shift Kasir -->
                <div class="card mt-3">
                    <div class="card-body">
                        <h6><i class="bi bi-info-circle me-2"></i>Info Shift</h6>
                        <small>
                            <strong>Kasir:</strong> ${currentUser.name}<br>
                            <strong>Buka Kas:</strong> ${new Date(JSON.parse(bukaKas).waktuBuka).toLocaleString('id-ID')}<br>
                            <strong>Modal Awal:</strong> ${formatRupiah(JSON.parse(bukaKas).modalAwal)}
                        </small>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    updateCartDisplay();
    
    // Set default metode pembayaran dan tampilkan section bayar-kembalian
    setTimeout(() => {
        toggleBayarKembalian();
    }, 100);
}

function showBukaKasModal() {
    const content = document.getElementById('mainContent');
    
    // Check if pengajuan modal feature is enabled
    const pengajuanEnabled = isPengajuanModalEnabled();
    
    // Get approved pengajuan for current kasir
    let approvedPengajuan = null;
    let pendingPengajuan = null;
    let rejectedPengajuan = null;
    
    if (pengajuanEnabled && currentUser) {
        approvedPengajuan = getApprovedPengajuanForKasir(currentUser.id);
        pendingPengajuan = hasPendingPengajuan(currentUser.id);
        
        // Get latest rejected pengajuan
        const pengajuanList = getPengajuanByKasir(currentUser.id);
        rejectedPengajuan = pengajuanList.find(p => p.status === 'rejected');
    }
    
    // Determine modal input state
    const hasApproved = approvedPengajuan !== null;
    const hasPending = pendingPengajuan !== null;
    const modalValue = hasApproved ? approvedPengajuan.jumlahDiminta : '';
    const modalDisabled = hasApproved ? 'disabled' : '';
    const bukaKasDisabled = hasPending ? 'disabled' : '';
    
    content.innerHTML = `
        <div class="row justify-content-center mt-5">
            <div class="col-md-8">
                <div class="card">
                    <div class="card-body">
                        <h3 class="text-center mb-4">Buka Kas</h3>
                        
                        ${pengajuanEnabled ? `
                            <!-- Status Pengajuan Modal -->
                            ${hasApproved ? `
                                <div class="alert alert-success">
                                    <h6><i class="bi bi-check-circle me-2"></i>Pengajuan Modal Disetujui</h6>
                                    <p class="mb-0">Modal Anda sebesar <strong>${formatRupiah(approvedPengajuan.jumlahDiminta)}</strong> telah disetujui oleh ${approvedPengajuan.adminName}.</p>
                                    <small class="text-muted">Modal akan otomatis terisi saat buka kas.</small>
                                </div>
                            ` : hasPending ? `
                                <div class="alert alert-warning">
                                    <h6><i class="bi bi-clock-history me-2"></i>Pengajuan Modal Menunggu Persetujuan</h6>
                                    <p class="mb-1">Pengajuan modal Anda sebesar <strong>${formatRupiah(pendingPengajuan.jumlahDiminta)}</strong> sedang menunggu persetujuan admin.</p>
                                    <small class="text-muted">Diajukan pada: ${new Date(pendingPengajuan.tanggalPengajuan).toLocaleString('id-ID')}</small>
                                    <p class="mb-0 mt-2"><small>Anda tidak dapat membuka kas atau mengajukan modal baru hingga pengajuan diproses.</small></p>
                                </div>
                            ` : rejectedPengajuan ? `
                                <div class="alert alert-danger">
                                    <h6><i class="bi bi-x-circle me-2"></i>Pengajuan Modal Ditolak</h6>
                                    <p class="mb-1">Pengajuan modal Anda sebesar <strong>${formatRupiah(rejectedPengajuan.jumlahDiminta)}</strong> ditolak.</p>
                                    <p class="mb-0"><strong>Alasan:</strong> ${rejectedPengajuan.alasanPenolakan}</p>
                                    <small class="text-muted">Anda dapat mengajukan modal baru atau buka kas dengan modal manual.</small>
                                </div>
                            ` : ''}
                        ` : ''}
                        
                        <form id="bukaKasForm">
                            <div class="mb-3">
                                <label class="form-label">Modal Awal Kasir</label>
                                <input type="number" class="form-control" id="modalKasir" 
                                    value="${modalValue}" ${modalDisabled} required>
                                <small class="text-muted">
                                    ${hasApproved ? 'Modal dari pengajuan yang disetujui' : 'Masukkan modal untuk uang kembalian'}
                                </small>
                            </div>
                            
                            <div class="d-grid gap-2">
                                <button type="submit" class="btn btn-primary" ${bukaKasDisabled}>
                                    <i class="bi bi-box-arrow-in-right me-2"></i>Buka Kas
                                </button>
                                
                                ${pengajuanEnabled && !hasApproved && !hasPending ? `
                                    <button type="button" class="btn btn-outline-secondary" onclick="showPengajuanModalForm()">
                                        <i class="bi bi-file-earmark-text me-2"></i>Ajukan Modal
                                    </button>
                                ` : ''}
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
            kasir: currentUser.name,
            kasirId: currentUser.id,
            modalAwal: modalKasir,
            waktuBuka: new Date().toISOString(),
            status: 'buka'
        };
        
        // If using approved pengajuan, mark it as used
        if (approvedPengajuan) {
            const result = markPengajuanAsUsed(approvedPengajuan.id, shiftData.id);
            if (!result.success) {
                showAlert(result.message, 'error');
                return;
            }
            shiftData.pengajuanId = approvedPengajuan.id;
        }
        
        sessionStorage.setItem('bukaKas', JSON.stringify(shiftData));
        sessionStorage.setItem('shiftId', shiftData.id);
        
        showAlert('Kas berhasil dibuka');
        renderPOS();
    });
}

/**
 * Show form pengajuan modal
 */
function showPengajuanModalForm() {
    const content = document.getElementById('mainContent');
    const settings = getPengajuanModalSettings();
    
    content.innerHTML = `
        <div class="row justify-content-center mt-5">
            <div class="col-md-6">
                <div class="card">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-center mb-4">
                            <h3 class="mb-0">Ajukan Modal Kasir</h3>
                            <button class="btn btn-sm btn-outline-secondary" onclick="showBukaKasModal()">
                                <i class="bi bi-arrow-left"></i> Kembali
                            </button>
                        </div>
                        
                        <div class="alert alert-info">
                            <small>
                                <i class="bi bi-info-circle me-2"></i>
                                Batas maksimum pengajuan: <strong>${formatRupiah(settings.batasMaximum)}</strong>
                            </small>
                        </div>
                        
                        <form id="pengajuanModalForm">
                            <div class="mb-3">
                                <label class="form-label">Jumlah Modal yang Diminta <span class="text-danger">*</span></label>
                                <input type="number" class="form-control" id="jumlahModal" 
                                    placeholder="Contoh: 2000000" required min="1" max="${settings.batasMaximum}">
                                <small class="text-muted">Masukkan jumlah dalam Rupiah</small>
                            </div>
                            
                            <div class="mb-3">
                                <label class="form-label">Keterangan</label>
                                <textarea class="form-control" id="keteranganModal" rows="3" 
                                    placeholder="Contoh: Modal untuk shift pagi, estimasi transaksi tinggi"></textarea>
                                <small class="text-muted">Opsional - jelaskan kebutuhan modal Anda</small>
                            </div>
                            
                            <div class="d-grid gap-2">
                                <button type="submit" class="btn btn-primary">
                                    <i class="bi bi-send me-2"></i>Kirim Pengajuan
                                </button>
                                <button type="button" class="btn btn-outline-secondary" onclick="showBukaKasModal()">
                                    Batal
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('pengajuanModalForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const jumlah = parseFloat(document.getElementById('jumlahModal').value);
        const keterangan = document.getElementById('keteranganModal').value;
        
        // Create pengajuan
        const result = createPengajuanModal(
            currentUser.id,
            currentUser.name,
            jumlah,
            keterangan
        );
        
        if (result.success) {
            showAlert('Pengajuan modal berhasil dikirim. Menunggu persetujuan admin.', 'success');
            showBukaKasModal();
        } else {
            showAlert(result.message, 'error');
        }
    });
}

function searchBarang(event) {
    const query = event.target.value.toLowerCase();
    const barang = JSON.parse(localStorage.getItem('barang') || '[]');
    
    if (event.key === 'Enter' && query) {
        // Cari berdasarkan barcode
        const item = barang.find(b => b.barcode.toLowerCase() === query);
        if (item) {
            addToCart(item.id);
            event.target.value = '';
        }
    } else {
        // Filter barang
        const filtered = barang.filter(b => 
            b.nama.toLowerCase().includes(query) || 
            b.barcode.toLowerCase().includes(query)
        );
        
        const barangList = document.getElementById('barangList');
        barangList.innerHTML = filtered.slice(0, 12).map(b => `
            <div class="col-md-3 mb-3">
                <div class="card pos-item" onclick="addToCart('${b.id}')">
                    <div class="card-body text-center">
                        <h6>${b.nama}</h6>
                        <p class="mb-0">${formatRupiah(b.hargaJual)}</p>
                        <small>Stok: ${b.stok}</small>
                    </div>
                </div>
            </div>
        `).join('');
    }
}

function addToCart(barangId) {
    const barang = JSON.parse(localStorage.getItem('barang') || '[]');
    const item = barang.find(b => b.id === barangId);
    
    if (!item || item.stok <= 0) {
        showAlert('Stok barang tidak tersedia', 'warning');
        return;
    }
    
    const existingItem = cart.find(c => c.id === barangId);
    if (existingItem) {
        if (existingItem.qty < item.stok) {
            existingItem.qty++;
        } else {
            showAlert('Stok tidak mencukupi', 'warning');
        }
    } else {
        cart.push({
            id: item.id,
            nama: item.nama,
            harga: item.hargaJual,
            hpp: item.hpp,
            qty: 1,
            stok: item.stok
        });
    }
    
    updateCartDisplay();
}

function updateCartDisplay() {
    const cartItems = document.getElementById('cartItems');
    if (!cartItems) return;
    
    cartItems.innerHTML = cart.map(item => `
        <div class="cart-item">
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <strong>${item.nama}</strong><br>
                    <small>${formatRupiah(item.harga)} x ${item.qty}</small>
                </div>
                <div>
                    <button class="btn btn-sm btn-outline-secondary" onclick="updateQty('${item.id}', -1)">-</button>
                    <span class="mx-2">${item.qty}</span>
                    <button class="btn btn-sm btn-outline-secondary" onclick="updateQty('${item.id}', 1)">+</button>
                    <button class="btn btn-sm btn-danger ms-2" onclick="removeFromCart('${item.id}')">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
    
    const total = cart.reduce((sum, item) => sum + (item.harga * item.qty), 0);
    document.getElementById('totalAmount').textContent = formatRupiah(total);
    
    // Update kembalian jika ada input uang bayar
    const uangBayarElement = document.getElementById('uangBayar');
    if (uangBayarElement && uangBayarElement.value) {
        hitungKembalian();
    }
}

function updateCreditInfo() {
    const anggotaId = document.getElementById('anggotaSelect').value;
    const creditInfoSection = document.getElementById('creditInfoSection');
    
    if (!anggotaId) {
        // Hide credit info for "Umum (Cash)"
        creditInfoSection.style.display = 'none';
        return;
    }
    
    // Show credit info section
    creditInfoSection.style.display = 'block';
    
    // Calculate credit information
    const outstandingBalance = creditLimitValidator.calculateOutstandingBalance(anggotaId);
    const availableCredit = creditLimitValidator.getAvailableCredit(anggotaId);
    const creditStatus = creditLimitValidator.getCreditStatus(anggotaId);
    
    // Update display
    document.getElementById('outstandingBalance').textContent = formatRupiah(outstandingBalance);
    document.getElementById('availableCredit').textContent = formatRupiah(availableCredit);
    
    // Update alert styling based on status
    const creditInfoAlert = document.getElementById('creditInfoAlert');
    creditInfoAlert.style.backgroundColor = creditStatus.bgColor;
    creditInfoAlert.style.borderColor = creditStatus.color;
    creditInfoAlert.style.color = creditStatus.color;
    
    // Update status indicator
    const statusIndicator = document.getElementById('creditStatusIndicator');
    statusIndicator.innerHTML = `
        <i class="bi ${creditStatus.icon} me-1"></i>
        <strong>${creditStatus.message}</strong> (${creditStatus.percentage.toFixed(1)}% terpakai)
    `;
    statusIndicator.style.color = creditStatus.color;
}

function updateQty(itemId, change) {
    const item = cart.find(c => c.id === itemId);
    if (item) {
        const newQty = item.qty + change;
        if (newQty > 0 && newQty <= item.stok) {
            item.qty = newQty;
            updateCartDisplay();
        } else if (newQty <= 0) {
            removeFromCart(itemId);
        } else {
            showAlert('Stok tidak mencukupi!', 'warning');
        }
    }
}

function removeFromCart(itemId) {
    cart = cart.filter(c => c.id !== itemId);
    updateCartDisplay();
}

function clearCart() {
    cart = [];
    updateCartDisplay();
    resetBayarKembalian();
}

function toggleBayarKembalian() {
    const metode = document.getElementById('metodePembayaran').value;
    const section = document.getElementById('bayarKembalianSection');
    
    if (metode === 'cash') {
        section.style.display = 'block';
    } else {
        section.style.display = 'none';
        resetBayarKembalian();
    }
}

function hitungKembalian() {
    const total = cart.reduce((sum, item) => sum + (item.harga * item.qty), 0);
    const uangBayar = parseFloat(document.getElementById('uangBayar').value) || 0;
    const kembalian = uangBayar - total;
    
    const kembalianElement = document.getElementById('kembalian');
    if (kembalian < 0) {
        kembalianElement.textContent = 'Uang kurang!';
        kembalianElement.style.color = '#dc3545';
        kembalianElement.style.backgroundColor = '#f8d7da';
    } else {
        kembalianElement.textContent = formatRupiah(kembalian);
        kembalianElement.style.color = '#2d6a4f';
        kembalianElement.style.backgroundColor = '#e9f5f0';
    }
}

function setUangPas() {
    const total = cart.reduce((sum, item) => sum + (item.harga * item.qty), 0);
    document.getElementById('uangBayar').value = total;
    hitungKembalian();
}

function setUangBayar(amount) {
    const total = cart.reduce((sum, item) => sum + (item.harga * item.qty), 0);
    const currentBayar = parseFloat(document.getElementById('uangBayar').value) || 0;
    
    // Jika uang bayar masih 0 atau kurang dari total, set ke amount
    // Jika sudah ada, tambahkan amount
    if (currentBayar < total) {
        document.getElementById('uangBayar').value = total + amount;
    } else {
        document.getElementById('uangBayar').value = currentBayar + amount;
    }
    hitungKembalian();
}

function resetBayarKembalian() {
    document.getElementById('uangBayar').value = '';
    document.getElementById('kembalian').textContent = 'Rp 0';
    document.getElementById('kembalian').style.color = '#2d6a4f';
    document.getElementById('kembalian').style.backgroundColor = '#e9f5f0';
}

function processPayment() {
    if (cart.length === 0) {
        showAlert('Keranjang kosong', 'warning');
        return;
    }
    
    const anggotaId = document.getElementById('anggotaSelect').value;
    const metode = document.getElementById('metodePembayaran').value;
    const total = cart.reduce((sum, item) => sum + (item.harga * item.qty), 0);
    
    // Validasi uang bayar untuk metode cash
    if (metode === 'cash') {
        const uangBayar = parseFloat(document.getElementById('uangBayar').value) || 0;
        
        if (uangBayar === 0) {
            showAlert('Masukkan jumlah uang bayar!', 'warning');
            document.getElementById('uangBayar').focus();
            return;
        }
        
        if (uangBayar < total) {
            showAlert('Uang bayar kurang dari total belanja!', 'warning');
            document.getElementById('uangBayar').focus();
            return;
        }
    }
    
    // Validasi tipe anggota untuk metode bon
    if (metode === 'bon' && anggotaId) {
        // NEW: Use transaction validator module
        const validation = validateAnggotaForPOS(anggotaId);
        if (!validation.valid) {
            showAlert(validation.error, 'error');
            return;
        }
        
        const member = validation.anggota;
        
        if (member.tipeAnggota === 'Umum') {
            showAlert('Anggota tipe Umum hanya bisa transaksi Cash!', 'warning');
            return;
        }
        
        if (member.status !== 'Aktif') {
            showAlert('Anggota dengan status ' + member.status + ' tidak bisa melakukan transaksi!', 'warning');
            return;
        }
    }
    
    if (metode === 'bon' && !anggotaId) {
        showAlert('Pilih anggota untuk transaksi Bon!', 'warning');
        return;
    }
    
    // VALIDASI BATAS KREDIT untuk transaksi BON
    if (metode === 'bon' && anggotaId) {
        const validation = creditLimitValidator.validateCreditTransaction(anggotaId, total);
        
        if (!validation.valid) {
            showAlert(validation.message, 'error');
            return;
        }
    }
    
    // Get member info
    const anggota = JSON.parse(localStorage.getItem('anggota') || '[]');
    const member = anggotaId ? anggota.find(a => a.id === anggotaId) : null;
    
    // Ambil data bayar dan kembalian untuk cash
    const uangBayar = metode === 'cash' ? parseFloat(document.getElementById('uangBayar').value) || 0 : 0;
    const kembalian = metode === 'cash' ? uangBayar - total : 0;
    
    // Simpan transaksi
    const penjualan = JSON.parse(localStorage.getItem('penjualan') || '[]');
    const noTransaksi = generateNoByType('penjualan');
    
    const transaksi = {
        id: generateId(), // Keep for backward compatibility
        noTransaksi: noTransaksi, // New readable transaction number
        tanggal: new Date().toISOString(),
        kasir: currentUser.name,
        anggotaId: anggotaId || null,
        tipeAnggota: member ? member.tipeAnggota : 'Umum',
        metode: metode,
        items: cart,
        total: total,
        uangBayar: uangBayar,
        kembalian: kembalian,
        status: metode === 'bon' ? 'kredit' : 'lunas'
    };
    penjualan.push(transaksi);
    localStorage.setItem('penjualan', JSON.stringify(penjualan));
    
    // Update stok barang
    const barang = JSON.parse(localStorage.getItem('barang') || '[]');
    cart.forEach(cartItem => {
        const item = barang.find(b => b.id === cartItem.id);
        if (item) {
            item.stok -= cartItem.qty;
        }
    });
    localStorage.setItem('barang', JSON.stringify(barang));
    
    // Hitung HPP (Harga Pokok Penjualan)
    const totalHPP = cart.reduce((sum, item) => sum + (item.hpp * item.qty), 0);
    
    // Jurnal Penjualan
    // 1. Mencatat Pendapatan
    addJurnal(`Penjualan - ${transaksi.id}`, [
        { akun: metode === 'bon' ? '1-1200' : '1-1000', debit: total, kredit: 0 },  // Kas/Piutang (Debit)
        { akun: '4-1000', debit: 0, kredit: total }  // Pendapatan Penjualan (Kredit)
    ]);
    
    // 2. Mencatat HPP (Harga Pokok Penjualan)
    addJurnal(`HPP Penjualan - ${transaksi.id}`, [
        { akun: '5-1000', debit: totalHPP, kredit: 0 },  // Beban HPP (Debit)
        { akun: '1-1300', debit: 0, kredit: totalHPP }   // Persediaan Barang (Kredit)
    ]);
    
    showAlert('Transaksi berhasil');
    printStruk(transaksi);
    clearCart();
}

function printStruk(transaksi) {
    const koperasi = JSON.parse(localStorage.getItem('koperasi'));
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
                ${item.qty} x ${formatRupiah(item.harga)} = ${formatRupiah(item.qty * item.harga)}</p>
            `).join('')}
            <hr>
            <p class="right"><strong>Total: ${formatRupiah(transaksi.total)}</strong></p>
            ${transaksi.metode === 'cash' && transaksi.uangBayar ? `
                <p class="right">Bayar: ${formatRupiah(transaksi.uangBayar)}</p>
                <p class="right">Kembalian: ${formatRupiah(transaksi.kembalian)}</p>
            ` : ''}
            ${transaksi.metode === 'bon' ? `
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

function renderRiwayatTransaksi() {
    const content = document.getElementById('mainContent');
    const penjualan = JSON.parse(localStorage.getItem('penjualan') || '[]');
    
    content.innerHTML = `
        <h2>Riwayat Transaksi</h2>
        <table class="table">
            <thead>
                <tr><th>No</th><th>Tanggal</th><th>Kasir</th><th>Total</th><th>Metode</th><th>Status</th></tr>
            </thead>
            <tbody>
                ${penjualan.map(p => `
                    <tr>
                        <td>${p.id}</td>
                        <td>${formatDate(p.tanggal)}</td>
                        <td>${p.kasir}</td>
                        <td>${formatRupiah(p.total)}</td>
                        <td>${p.metode}</td>
                        <td>${p.status}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// Tutup Kasir Functions

function showTutupKasModal() {
    const bukaKasStr = sessionStorage.getItem('bukaKas');
    if (!bukaKasStr) {
        showAlert('Tidak ada data buka kas!', 'warning');
        return;
    }
    
    let bukaKasData;
    try {
        bukaKasData = JSON.parse(bukaKasStr);
    } catch (e) {
        showAlert('Data buka kas tidak valid!', 'error');
        console.error('Error parsing bukaKas:', e);
        return;
    }
    
    // Hitung transaksi dalam shift ini
    const penjualan = JSON.parse(localStorage.getItem('penjualan') || '[]');
    const waktuBuka = new Date(bukaKasData.waktuBuka);
    const transaksiShift = penjualan.filter(p => new Date(p.tanggal) >= waktuBuka);
    
    // VALIDASI: Cek apakah ada penjualan
    if (transaksiShift.length === 0) {
        // Tampilkan konfirmasi pembatalan
        if (confirm('Tidak ada transaksi penjualan dalam shift ini.\n\nApakah Anda ingin MEMBATALKAN shift dan kembali ke menu utama?\n\n(Klik OK untuk batalkan shift, Cancel untuk tetap di POS)')) {
            // Batalkan shift - hapus data buka kas
            sessionStorage.removeItem('bukaKas');
            showAlert('Shift dibatalkan karena tidak ada transaksi', 'info');
            // Kembali ke menu utama atau refresh POS
            showMenu('dashboard');
            return;
        } else {
            // User memilih tetap di POS
            return;
        }
    }
    
    // Debug log
    console.log('Buka Kas Data:', bukaKasData);
    console.log('Transaksi Shift:', transaksiShift);
    
    // Hitung total dengan validasi
    const totalCash = transaksiShift
        .filter(t => t.metode === 'cash')
        .reduce((sum, t) => sum + (parseFloat(t.total) || 0), 0);
    
    const totalBon = transaksiShift
        .filter(t => t.metode === 'bon')
        .reduce((sum, t) => sum + (parseFloat(t.total) || 0), 0);
    
    const totalPenjualan = totalCash + totalBon;
    const jumlahTransaksi = transaksiShift.length;
    
    // Validasi modalAwal
    const modalAwal = parseFloat(bukaKasData.modalAwal) || 0;
    const expectedCash = modalAwal + totalCash;
    
    // Debug log hasil perhitungan
    console.log('Modal Awal:', modalAwal);
    console.log('Total Cash:', totalCash);
    console.log('Total Bon:', totalBon);
    console.log('Total Penjualan:', totalPenjualan);
    console.log('Expected Cash:', expectedCash);
    
    // Simpan data untuk digunakan di fungsi lain
    tutupKasData = {
        bukaKasData: bukaKasData,
        transaksiShift: transaksiShift,
        modalAwal: modalAwal,
        totalCash: totalCash,
        totalBon: totalBon,
        totalPenjualan: totalPenjualan,
        jumlahTransaksi: jumlahTransaksi,
        expectedCash: expectedCash
    };
    
    const modalHTML = `
        <div class="modal fade" id="tutupKasModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header bg-warning">
                        <h5 class="modal-title">
                            <i class="bi bi-lock me-2"></i>Tutup Kasir
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="alert alert-info">
                            <strong><i class="bi bi-info-circle me-2"></i>Informasi Shift</strong><br>
                            <strong>Kasir:</strong> ${bukaKasData.kasir}<br>
                            <strong>Buka Kas:</strong> ${new Date(bukaKasData.waktuBuka).toLocaleString('id-ID')}<br>
                            <strong>Tutup Kas:</strong> ${new Date().toLocaleString('id-ID')}
                        </div>
                        
                        <h6 class="mb-3">Ringkasan Transaksi</h6>
                        <div class="row mb-3">
                            <div class="col-md-6">
                                <div class="card">
                                    <div class="card-body text-center">
                                        <h6 class="text-muted">Jumlah Transaksi</h6>
                                        <h3 style="color: #2d6a4f;">${jumlahTransaksi}</h3>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="card">
                                    <div class="card-body text-center">
                                        <h6 class="text-muted">Total Penjualan</h6>
                                        <h3 style="color: #52b788;">${formatRupiah(totalPenjualan)}</h3>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <table class="table table-sm">
                            <tr>
                                <td><strong>Modal Awal Kasir:</strong></td>
                                <td class="text-end">${formatRupiah(modalAwal)}</td>
                            </tr>
                            <tr>
                                <td><strong>Penjualan Cash:</strong></td>
                                <td class="text-end">${formatRupiah(totalCash)}</td>
                            </tr>
                            <tr>
                                <td><strong>Penjualan Bon:</strong></td>
                                <td class="text-end">${formatRupiah(totalBon)}</td>
                            </tr>
                            <tr class="table-primary">
                                <td><strong>Kas yang Seharusnya:</strong></td>
                                <td class="text-end"><strong>${formatRupiah(expectedCash)}</strong></td>
                            </tr>
                        </table>
                        
                        <hr>
                        
                        <form id="tutupKasForm">
                            <div class="mb-3">
                                <label class="form-label"><strong>Kas Aktual (Hasil Hitung Fisik):</strong></label>
                                <input type="number" class="form-control" id="kasAktual" required 
                                    placeholder="Masukkan hasil hitung kas fisik">
                                <small class="text-muted">Hitung uang fisik di laci kasir</small>
                            </div>
                            
                            <div class="mb-3" id="selisihInfo" style="display: none;">
                                <div class="alert" id="selisihAlert">
                                    <strong>Selisih Kas:</strong> <span id="selisihAmount"></span>
                                </div>
                            </div>
                            
                            <div class="mb-3">
                                <label class="form-label">Catatan (Opsional):</label>
                                <textarea class="form-control" id="catatanTutupKas" rows="3" 
                                    placeholder="Catatan tambahan untuk shift ini..."></textarea>
                            </div>
                        </form>
                        
                        <div class="alert alert-warning">
                            <strong><i class="bi bi-exclamation-triangle me-2"></i>Perhatian:</strong>
                            Setelah tutup kasir, Anda harus buka kas lagi untuk melakukan transaksi baru.
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Batal</button>
                        <button type="button" class="btn btn-info" onclick="hitungSelisih()">
                            <i class="bi bi-calculator me-1"></i>Hitung Selisih
                        </button>
                        <button type="button" class="btn btn-success" onclick="prosesTutupKas()">
                            <i class="bi bi-printer me-1"></i>Tutup & Print Laporan
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    const existingModal = document.getElementById('tutupKasModal');
    if (existingModal) existingModal.remove();
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Show modal
    const modalElement = document.getElementById('tutupKasModal');
    if (modalElement) {
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
    } else {
        console.error('Modal tutupKasModal tidak ditemukan!');
        showAlert('Gagal menampilkan modal tutup kasir', 'error');
    }
}

function hitungSelisih() {
    if (!tutupKasData) {
        showAlert('Data tutup kas tidak ditemukan!', 'error');
        return;
    }
    
    const kasAktual = parseFloat(document.getElementById('kasAktual').value);
    
    if (!kasAktual) {
        showAlert('Masukkan kas aktual terlebih dahulu!', 'warning');
        return;
    }
    
    const selisih = kasAktual - tutupKasData.expectedCash;
    const selisihInfo = document.getElementById('selisihInfo');
    const selisihAlert = document.getElementById('selisihAlert');
    const selisihAmount = document.getElementById('selisihAmount');
    
    selisihInfo.style.display = 'block';
    
    if (selisih === 0) {
        selisihAlert.className = 'alert alert-success';
        selisihAmount.textContent = formatRupiah(0) + ' (PAS)';
    } else if (selisih > 0) {
        selisihAlert.className = 'alert alert-warning';
        selisihAmount.textContent = formatRupiah(selisih) + ' (LEBIH)';
    } else {
        selisihAlert.className = 'alert alert-danger';
        selisihAmount.textContent = formatRupiah(Math.abs(selisih)) + ' (KURANG)';
    }
}

function prosesTutupKas() {
    if (!tutupKasData) {
        showAlert('Data tutup kas tidak ditemukan!', 'error');
        return;
    }
    
    const kasAktual = parseFloat(document.getElementById('kasAktual').value);
    
    if (!kasAktual) {
        showAlert('Masukkan kas aktual terlebih dahulu!', 'warning');
        return;
    }
    
    const selisih = kasAktual - tutupKasData.expectedCash;
    const catatan = document.getElementById('catatanTutupKas').value;
    
    // Simpan data tutup kas
    const dataTutupKas = {
        id: generateId(),
        shiftId: tutupKasData.bukaKasData.id,
        kasir: tutupKasData.bukaKasData.kasir,
        waktuBuka: tutupKasData.bukaKasData.waktuBuka,
        waktuTutup: new Date().toISOString(),
        modalAwal: tutupKasData.modalAwal,
        totalCash: tutupKasData.totalCash,
        totalBon: tutupKasData.totalBon,
        totalPenjualan: tutupKasData.totalPenjualan,
        jumlahTransaksi: tutupKasData.jumlahTransaksi,
        kasSeharusnya: tutupKasData.expectedCash,
        kasAktual: kasAktual,
        selisih: selisih,
        catatan: catatan
    };
    
    // Simpan ke localStorage
    const riwayatTutupKas = JSON.parse(localStorage.getItem('riwayatTutupKas') || '[]');
    riwayatTutupKas.push(dataTutupKas);
    localStorage.setItem('riwayatTutupKas', JSON.stringify(riwayatTutupKas));
    
    // Jika ada selisih, catat di jurnal
    if (selisih !== 0) {
        if (selisih > 0) {
            // Kas lebih (pendapatan lain-lain)
            addJurnal('Selisih Kas Lebih - Tutup Kasir', [
                { akun: '1-1000', debit: selisih, kredit: 0 },
                { akun: '4-1000', debit: 0, kredit: selisih }
            ]);
        } else {
            // Kas kurang (beban selisih)
            addJurnal('Selisih Kas Kurang - Tutup Kasir', [
                { akun: '5-2000', debit: Math.abs(selisih), kredit: 0 },
                { akun: '1-1000', debit: 0, kredit: Math.abs(selisih) }
            ]);
        }
    }
    
    // Print laporan
    printLaporanTutupKas(dataTutupKas);
    
    // Clear session
    sessionStorage.removeItem('bukaKas');
    sessionStorage.removeItem('shiftId');
    
    // Close modal
    bootstrap.Modal.getInstance(document.getElementById('tutupKasModal')).hide();
    
    showAlert('Kasir berhasil ditutup. Silakan buka kas lagi untuk transaksi baru.', 'success');
    
    // Redirect to dashboard or show buka kas
    setTimeout(() => {
        renderPOS();
    }, 1000);
}

function printLaporanTutupKas(data) {
    const koperasi = JSON.parse(localStorage.getItem('koperasi'));
    const penjualan = JSON.parse(localStorage.getItem('penjualan') || '[]');
    const waktuBuka = new Date(data.waktuBuka);
    const waktuTutup = new Date(data.waktuTutup);
    const transaksiShift = penjualan.filter(p => {
        const waktuTransaksi = new Date(p.tanggal);
        return waktuTransaksi >= waktuBuka && waktuTransaksi <= waktuTutup;
    });
    
    const printWindow = window.open('', '', 'width=800,height=600');
    printWindow.document.write(`
        <html>
        <head>
            <title>Laporan Tutup Kasir - ${data.id}</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #2d6a4f; padding-bottom: 15px; }
                .logo { max-width: 100px; max-height: 100px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
                th { background-color: #2d6a4f; color: white; }
                .info-table { border: none; margin-bottom: 20px; }
                .info-table td { border: none; padding: 5px; }
                .total-row { font-weight: bold; background-color: #e9f5f0; }
                .selisih-plus { color: #52b788; font-weight: bold; }
                .selisih-minus { color: #dc3545; font-weight: bold; }
                .selisih-pas { color: #2d6a4f; font-weight: bold; }
                .print-btn {
                    position: fixed;
                    top: 10px;
                    right: 10px;
                    padding: 10px 20px;
                    background: #2d6a4f;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                }
                @media print {
                    .print-btn { display: none; }
                }
            </style>
        </head>
        <body>
            <button class="print-btn" onclick="window.print()">🖨️ Print</button>
            
            <div class="header">
                ${koperasi.logo ? `<img src="${koperasi.logo}" class="logo">` : ''}
                <h2 style="margin: 10px 0; color: #2d6a4f;">${koperasi.nama || 'Koperasi Karyawan'}</h2>
                <p style="margin: 5px 0;">${koperasi.alamat || ''}</p>
                <h3 style="margin-top: 15px; color: #2d6a4f;">LAPORAN TUTUP KASIR</h3>
            </div>
            
            <table class="info-table">
                <tr>
                    <td style="width: 150px;"><strong>Kasir:</strong></td>
                    <td>${data.kasir}</td>
                    <td style="width: 150px;"><strong>No. Shift:</strong></td>
                    <td>${data.id}</td>
                </tr>
                <tr>
                    <td><strong>Buka Kas:</strong></td>
                    <td>${new Date(data.waktuBuka).toLocaleString('id-ID')}</td>
                    <td><strong>Tutup Kas:</strong></td>
                    <td>${new Date(data.waktuTutup).toLocaleString('id-ID')}</td>
                </tr>
            </table>
            
            <h4 style="color: #2d6a4f; margin-top: 30px;">Ringkasan Penjualan</h4>
            <table>
                <tr>
                    <td><strong>Modal Awal Kasir</strong></td>
                    <td style="text-align: right;">${formatRupiah(data.modalAwal)}</td>
                </tr>
                <tr>
                    <td><strong>Jumlah Transaksi</strong></td>
                    <td style="text-align: right;">${data.jumlahTransaksi} transaksi</td>
                </tr>
                <tr>
                    <td><strong>Penjualan Cash</strong></td>
                    <td style="text-align: right;">${formatRupiah(data.totalCash)}</td>
                </tr>
                <tr>
                    <td><strong>Penjualan Bon (Kredit)</strong></td>
                    <td style="text-align: right;">${formatRupiah(data.totalBon)}</td>
                </tr>
                <tr class="total-row">
                    <td><strong>Total Penjualan</strong></td>
                    <td style="text-align: right;"><strong>${formatRupiah(data.totalPenjualan)}</strong></td>
                </tr>
            </table>
            
            <h4 style="color: #2d6a4f; margin-top: 30px;">Rekonsiliasi Kas</h4>
            <table>
                <tr>
                    <td><strong>Modal Awal</strong></td>
                    <td style="text-align: right;">${formatRupiah(data.modalAwal)}</td>
                </tr>
                <tr>
                    <td><strong>Penjualan Cash</strong></td>
                    <td style="text-align: right;">${formatRupiah(data.totalCash)}</td>
                </tr>
                <tr class="total-row">
                    <td><strong>Kas yang Seharusnya</strong></td>
                    <td style="text-align: right;"><strong>${formatRupiah(data.kasSeharusnya)}</strong></td>
                </tr>
                <tr>
                    <td><strong>Kas Aktual (Fisik)</strong></td>
                    <td style="text-align: right;">${formatRupiah(data.kasAktual)}</td>
                </tr>
                <tr class="total-row">
                    <td><strong>Selisih Kas</strong></td>
                    <td style="text-align: right;" class="${data.selisih === 0 ? 'selisih-pas' : data.selisih > 0 ? 'selisih-plus' : 'selisih-minus'}">
                        <strong>${formatRupiah(Math.abs(data.selisih))} ${data.selisih === 0 ? '(PAS)' : data.selisih > 0 ? '(LEBIH)' : '(KURANG)'}</strong>
                    </td>
                </tr>
            </table>
            
            ${data.catatan ? `
                <h4 style="color: #2d6a4f; margin-top: 30px;">Catatan</h4>
                <p style="border: 1px solid #ddd; padding: 10px; background: #f8f9fa;">${data.catatan}</p>
            ` : ''}
            
            <h4 style="color: #2d6a4f; margin-top: 30px;">Detail Transaksi</h4>
            <table>
                <thead>
                    <tr>
                        <th>No</th>
                        <th>Waktu</th>
                        <th>Anggota</th>
                        <th>Total</th>
                        <th>Metode</th>
                    </tr>
                </thead>
                <tbody>
                    ${transaksiShift.map((t, idx) => {
                        const anggota = JSON.parse(localStorage.getItem('anggota') || '[]');
                        const member = anggota.find(a => a.id === t.anggotaId);
                        return `
                            <tr>
                                <td>${idx + 1}</td>
                                <td>${new Date(t.tanggal).toLocaleTimeString('id-ID')}</td>
                                <td>${member ? member.nama : 'Umum'}</td>
                                <td style="text-align: right;">${formatRupiah(t.total)}</td>
                                <td>${t.metode.toUpperCase()}</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
            
            <div style="margin-top: 60px;">
                <div style="float: left; width: 45%; text-align: center;">
                    <p style="margin-bottom: 80px;">Kasir,</p>
                    <p style="border-top: 1px solid #000; display: inline-block; padding-top: 5px; min-width: 200px;">
                        ${data.kasir}
                    </p>
                </div>
                <div style="float: right; width: 45%; text-align: center;">
                    <p style="margin-bottom: 80px;">Mengetahui,</p>
                    <p style="border-top: 1px solid #000; display: inline-block; padding-top: 5px; min-width: 200px;">
                        (________________)
                    </p>
                </div>
                <div style="clear: both;"></div>
            </div>
            
            <div style="margin-top: 40px; text-align: center; color: #666; font-size: 12px;">
                <p>Dokumen ini dicetak dari Sistem Koperasi Karyawan</p>
                <p>Dicetak pada: ${new Date().toLocaleString('id-ID')}</p>
            </div>
        </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

function renderRiwayatTutupKas() {
    const content = document.getElementById('mainContent');
    const riwayat = JSON.parse(localStorage.getItem('riwayatTutupKas') || '[]');
    
    content.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2 style="color: #2d6a4f; font-weight: 700;">
                <i class="bi bi-clock-history me-2"></i>Riwayat Tutup Kasir
            </h2>
        </div>
        
        <div class="card">
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <th>No. Shift</th>
                                <th>Kasir</th>
                                <th>Waktu Buka</th>
                                <th>Waktu Tutup</th>
                                <th>Total Penjualan</th>
                                <th>Selisih</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${riwayat.reverse().map(r => `
                                <tr>
                                    <td>${r.id}</td>
                                    <td>${r.kasir}</td>
                                    <td>${new Date(r.waktuBuka).toLocaleString('id-ID')}</td>
                                    <td>${new Date(r.waktuTutup).toLocaleString('id-ID')}</td>
                                    <td>${formatRupiah(r.totalPenjualan)}</td>
                                    <td>
                                        <span class="${r.selisih === 0 ? 'text-success' : r.selisih > 0 ? 'text-warning' : 'text-danger'}">
                                            ${formatRupiah(Math.abs(r.selisih))} ${r.selisih === 0 ? '(PAS)' : r.selisih > 0 ? '(LEBIH)' : '(KURANG)'}
                                        </span>
                                    </td>
                                    <td>
                                        <button class="btn btn-sm btn-info" onclick="viewDetailTutupKas('${r.id}')">
                                            <i class="bi bi-eye"></i> Detail
                                        </button>
                                        <button class="btn btn-sm btn-success" onclick="reprintLaporanTutupKas('${r.id}')">
                                            <i class="bi bi-printer"></i> Print
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

function viewDetailTutupKas(id) {
    const riwayat = JSON.parse(localStorage.getItem('riwayatTutupKas') || '[]');
    const data = riwayat.find(r => r.id === id);
    
    if (!data) return;
    
    const modalHTML = `
        <div class="modal fade" id="detailTutupKasModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Detail Tutup Kasir - ${data.id}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <table class="table">
                            <tr><td><strong>Kasir:</strong></td><td>${data.kasir}</td></tr>
                            <tr><td><strong>Buka Kas:</strong></td><td>${new Date(data.waktuBuka).toLocaleString('id-ID')}</td></tr>
                            <tr><td><strong>Tutup Kas:</strong></td><td>${new Date(data.waktuTutup).toLocaleString('id-ID')}</td></tr>
                            <tr><td><strong>Modal Awal:</strong></td><td>${formatRupiah(data.modalAwal)}</td></tr>
                            <tr><td><strong>Jumlah Transaksi:</strong></td><td>${data.jumlahTransaksi}</td></tr>
                            <tr><td><strong>Penjualan Cash:</strong></td><td>${formatRupiah(data.totalCash)}</td></tr>
                            <tr><td><strong>Penjualan Bon:</strong></td><td>${formatRupiah(data.totalBon)}</td></tr>
                            <tr><td><strong>Total Penjualan:</strong></td><td>${formatRupiah(data.totalPenjualan)}</td></tr>
                            <tr><td><strong>Kas Seharusnya:</strong></td><td>${formatRupiah(data.kasSeharusnya)}</td></tr>
                            <tr><td><strong>Kas Aktual:</strong></td><td>${formatRupiah(data.kasAktual)}</td></tr>
                            <tr><td><strong>Selisih:</strong></td><td class="${data.selisih === 0 ? 'text-success' : data.selisih > 0 ? 'text-warning' : 'text-danger'}">${formatRupiah(Math.abs(data.selisih))} ${data.selisih === 0 ? '(PAS)' : data.selisih > 0 ? '(LEBIH)' : '(KURANG)'}</td></tr>
                            ${data.catatan ? `<tr><td><strong>Catatan:</strong></td><td>${data.catatan}</td></tr>` : ''}
                        </table>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Tutup</button>
                        <button type="button" class="btn btn-success" onclick="reprintLaporanTutupKas('${data.id}')">
                            <i class="bi bi-printer me-1"></i>Print Laporan
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    const existingModal = document.getElementById('detailTutupKasModal');
    if (existingModal) existingModal.remove();
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    new bootstrap.Modal(document.getElementById('detailTutupKasModal')).show();
}

function reprintLaporanTutupKas(id) {
    const riwayat = JSON.parse(localStorage.getItem('riwayatTutupKas') || '[]');
    const data = riwayat.find(r => r.id === id);
    
    if (data) {
        printLaporanTutupKas(data);
    }
}

// Additional functions needed for fullscreen POS compatibility

// Show alert function for fullscreen POS
function showAlert(message, type = 'success') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px; max-width: 500px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alertDiv);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 3000);
}

// Generate ID function
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Add journal entry function (simplified for POS)
function addJurnal(keterangan, entries) {
    const jurnal = JSON.parse(localStorage.getItem('jurnal') || '[]');
    
    const jurnalEntry = {
        id: generateId(),
        tanggal: new Date().toISOString(),
        keterangan: keterangan,
        entries: entries,
        total: entries.reduce((sum, entry) => sum + entry.debit, 0)
    };
    
    jurnal.push(jurnalEntry);
    localStorage.setItem('jurnal', JSON.stringify(jurnal));
}

// Generate transaction number by type
function generateNoByType(type) {
    const today = new Date();
    const year = today.getFullYear().toString().substr(-2);
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const date = today.getDate().toString().padStart(2, '0');
    
    const existing = JSON.parse(localStorage.getItem(type) || '[]');
    const todayTransactions = existing.filter(t => {
        const tDate = new Date(t.tanggal);
        return tDate.toDateString() === today.toDateString();
    });
    
    const sequence = (todayTransactions.length + 1).toString().padStart(3, '0');
    
    return `${type.toUpperCase()}-${year}${month}${date}-${sequence}`;
}

// Filter transactable anggota (for compatibility)
function filterTransactableAnggota(anggota) {
    return anggota.filter(a => a.statusKeanggotaan === 'Aktif');
}

// Print struk function for fullscreen POS
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
            Tanggal: ${new Date(transaksi.tanggal).toLocaleString('id-ID')}<br>
            Kasir: ${transaksi.kasir}<br>
            ${member ? `Anggota: ${member.nama}` : 'Pembeli: Umum'}</p>
            <hr>
            ${transaksi.items.map(item => `
                <p style="margin: 5px 0;">${item.nama}<br>
                ${item.qty} x ${formatRupiah(item.hargaJual)} = ${formatRupiah(item.qty * item.hargaJual)}</p>
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

// Update process payment for fullscreen POS to include printing
function processPaymentWithPrint() {
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
        processCashPaymentWithPrint(total, cash, anggotaId);
    } else {
        // Process credit payment
        processCreditPaymentWithPrint(total, anggotaId);
    }
}

// Process cash payment with print
function processCashPaymentWithPrint(total, cash, anggotaId) {
    const change = cash - total;
    
    // Save transaction
    const transaksi = {
        id: generateId(),
        tanggal: new Date().toISOString(),
        items: cart.map(item => ({
            barangId: item.id,
            nama: item.nama,
            qty: item.qty,
            hargaJual: item.hargaJual,
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
    
    // Add journal entries
    addJurnal(`Penjualan Cash - ${transaksi.id}`, [
        { akun: '1-1000', debit: total, kredit: 0 },  // Kas (Debit)
        { akun: '4-1000', debit: 0, kredit: total }   // Pendapatan Penjualan (Kredit)
    ]);
    
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

// Process credit payment with print
function processCreditPaymentWithPrint(total, anggotaId) {
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
            hargaJual: item.hargaJual,
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
    
    // Add journal entries
    addJurnal(`Penjualan Kredit - ${transaksi.id}`, [
        { akun: '1-1200', debit: total, kredit: 0 },  // Piutang Dagang (Debit)
        { akun: '4-1000', debit: 0, kredit: total }   // Pendapatan Penjualan (Kredit)
    ]);
    
    // Show success message
    showAlert('Transaksi kredit berhasil disimpan!', 'success');
    
    // Print receipt
    printStrukPOS(transaksi);
    
    // Clear cart
    cart = [];
    updateCartDisplayPOS();
}

// Override the original processPayment function to use the new one
const originalProcessPayment = processPayment;
processPayment = function() {
    // Check if we're in fullscreen mode
    if (document.querySelector('.pos-container')) {
        processPaymentWithPrint();
    } else {
        originalProcessPayment();
    }
};