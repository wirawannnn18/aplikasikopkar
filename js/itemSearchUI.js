/**
 * Item Search UI Components
 * Handles user interface for item search functionality
 */

class SearchUI {
    constructor() {
        this.debounceTimeout = null;
        this.debounceDelay = 300; // 300ms debounce
        this.selectedIndex = -1;
        this.isDropdownVisible = false;
        this.currentResults = [];
        
        // Bind methods to maintain context
        this.handleKeyboardNavigation = this.handleKeyboardNavigation.bind(this);
        this.handleItemSelection = this.handleItemSelection.bind(this);
        this.handleClickOutside = this.handleClickOutside.bind(this);
    }

    /**
     * Render search field with debouncing
     * @param {string} containerId - Container element ID
     * @returns {HTMLElement} Search field element
     */
    renderSearchField(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error('Search container not found:', containerId);
            return null;
        }

        const searchFieldHtml = `
            <div class="search-field-container position-relative">
                <div class="input-group">
                    <span class="input-group-text">
                        <i class="bi bi-search"></i>
                    </span>
                    <input 
                        type="text" 
                        id="itemSearchInput" 
                        class="form-control" 
                        placeholder="Cari barang berdasarkan nama atau kode..."
                        autocomplete="off"
                        aria-label="Pencarian barang"
                        aria-describedby="searchHelp"
                    >
                    <button 
                        type="button" 
                        id="clearSearchBtn" 
                        class="btn btn-outline-secondary" 
                        title="Bersihkan pencarian"
                        style="display: none;"
                    >
                        <i class="bi bi-x"></i>
                    </button>
                </div>
                <div id="searchHelp" class="form-text">
                    Ketik minimal 2 karakter untuk mulai mencari. Gunakan Ctrl+F untuk fokus ke pencarian.
                </div>
                <div id="searchDropdown" class="search-dropdown" style="display: none;">
                    <!-- Search results will be populated here -->
                </div>
            </div>
        `;

        container.innerHTML = searchFieldHtml;

        // Get elements
        const searchInput = document.getElementById('itemSearchInput');
        const clearBtn = document.getElementById('clearSearchBtn');
        const dropdown = document.getElementById('searchDropdown');

        // Add event listeners
        searchInput.addEventListener('input', (e) => this.handleSearchInput(e));
        searchInput.addEventListener('keydown', (e) => this.handleKeyboardNavigation(e));
        searchInput.addEventListener('focus', () => this.handleSearchFocus());
        
        clearBtn.addEventListener('click', () => this.clearSearch());
        
        // Global keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'f') {
                e.preventDefault();
                searchInput.focus();
            }
            if (e.key === 'Escape') {
                this.hideDropdown();
            }
        });

        // Click outside to close dropdown
        document.addEventListener('click', this.handleClickOutside);

        return searchInput;
    }

    /**
     * Render category filter dropdown
     * @param {string} containerId - Container element ID
     * @returns {HTMLElement} Category filter element
     */
    renderCategoryFilter(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error('Category filter container not found:', containerId);
            return null;
        }

        // Get categories from inventory
        const categories = this.getAvailableCategories();

        const categoryFilterHtml = `
            <div class="category-filter-container">
                <label for="categoryFilter" class="form-label">Filter Kategori:</label>
                <select id="categoryFilter" class="form-select" aria-label="Filter berdasarkan kategori">
                    <option value="all">Semua Kategori</option>
                    ${categories.map(cat => 
                        `<option value="${cat.id}">${cat.name} (${cat.count})</option>`
                    ).join('')}
                </select>
            </div>
        `;

        container.innerHTML = categoryFilterHtml;

        const categorySelect = document.getElementById('categoryFilter');
        categorySelect.addEventListener('change', (e) => this.handleCategoryChange(e));

        return categorySelect;
    }

    /**
     * Handle search input with debouncing
     * @param {Event} event - Input event
     */
    handleSearchInput(event) {
        const searchTerm = event.target.value.trim();
        const clearBtn = document.getElementById('clearSearchBtn');

        // Show/hide clear button
        clearBtn.style.display = searchTerm ? 'block' : 'none';

        // Clear previous timeout
        if (this.debounceTimeout) {
            clearTimeout(this.debounceTimeout);
        }

        // Debounce search
        this.debounceTimeout = setTimeout(() => {
            this.performSearch(searchTerm);
        }, this.debounceDelay);
    }

    /**
     * Handle search field focus
     */
    handleSearchFocus() {
        const searchInput = document.getElementById('itemSearchInput');
        const searchTerm = searchInput.value.trim();

        if (searchTerm.length >= 2) {
            this.performSearch(searchTerm);
        } else {
            // Show recent searches when focused with empty field
            this.showRecentSearches();
        }
    }

    /**
     * Perform search and display results
     * @param {string} searchTerm - Search term
     */
    async performSearch(searchTerm) {
        if (searchTerm.length < 2) {
            this.hideDropdown();
            return;
        }

        try {
            const categoryFilter = document.getElementById('categoryFilter')?.value || 'all';
            
            const query = {
                term: searchTerm,
                categoryId: categoryFilter,
                maxResults: 10,
                caseSensitive: false
            };

            const results = await window.itemSearchService.searchItems(query);
            this.currentResults = results;
            this.renderSearchResults(results);
            
        } catch (error) {
            console.error('Search error:', error);
            this.showErrorMessage('Terjadi kesalahan saat mencari barang');
        }
    }

    /**
     * Render search results dropdown
     * @param {SearchResult[]} results - Search results
     */
    renderSearchResults(results) {
        const dropdown = document.getElementById('searchDropdown');
        if (!dropdown) return;

        if (results.length === 0) {
            dropdown.innerHTML = `
                <div class="search-no-results">
                    <i class="bi bi-search text-muted"></i>
                    <p class="mb-0 text-muted">Tidak ada barang yang ditemukan</p>
                </div>
            `;
        } else {
            dropdown.innerHTML = `
                <div class="search-results-header">
                    <small class="text-muted">${results.length} barang ditemukan</small>
                </div>
                ${results.map((item, index) => this.renderSearchResultItem(item, index)).join('')}
            `;
        }

        this.showDropdown();
        this.selectedIndex = -1; // Reset selection
    }

    /**
     * Render individual search result item
     * @param {SearchResult} item - Search result item
     * @param {number} index - Item index
     * @returns {string} HTML for result item
     */
    renderSearchResultItem(item, index) {
        const stockStatus = item.isOutOfStock ? 'out-of-stock' : 
                           item.isLowStock ? 'low-stock' : 'in-stock';
        
        const stockText = item.isOutOfStock ? 'Stok Habis' :
                         item.isLowStock ? `Stok Rendah (${item.currentStock})` :
                         `Stok: ${item.currentStock}`;

        const stockIcon = item.isOutOfStock ? 'bi-x-circle-fill text-danger' :
                         item.isLowStock ? 'bi-exclamation-triangle-fill text-warning' :
                         'bi-check-circle-fill text-success';

        return `
            <div class="search-result-item ${stockStatus}" data-index="${index}" data-item-id="${item.id}">
                <div class="item-main-info">
                    <div class="item-name">${this.highlightSearchTerm(item.name)}</div>
                    <div class="item-code text-muted">${item.code}</div>
                </div>
                <div class="item-details">
                    <div class="item-category">
                        <i class="bi bi-tag"></i>
                        ${item.category}
                    </div>
                    <div class="item-price">
                        <i class="bi bi-currency-dollar"></i>
                        ${this.formatCurrency(item.unitPrice)}
                    </div>
                </div>
                <div class="item-stock ${stockStatus}">
                    <i class="${stockIcon}"></i>
                    <span>${stockText}</span>
                </div>
            </div>
        `;
    }

    /**
     * Show recent searches when field is focused
     */
    showRecentSearches() {
        const recentSearches = window.searchHistory.getRecentSearches(5);
        const frequentItems = window.searchHistory.getFrequentItems(3);
        
        const dropdown = document.getElementById('searchDropdown');
        if (!dropdown) return;

        let html = '';

        if (frequentItems.length > 0) {
            html += `
                <div class="search-section">
                    <div class="search-section-header">
                        <i class="bi bi-star"></i>
                        Sering Digunakan
                    </div>
                    ${frequentItems.map((entry, index) => 
                        this.renderHistoryItem(entry.selectedItem, index, 'frequent')
                    ).join('')}
                </div>
            `;
        }

        if (recentSearches.length > 0) {
            html += `
                <div class="search-section">
                    <div class="search-section-header">
                        <i class="bi bi-clock-history"></i>
                        Pencarian Terakhir
                    </div>
                    ${recentSearches.map((entry, index) => 
                        this.renderHistoryItem(entry.selectedItem, index + frequentItems.length, 'recent')
                    ).join('')}
                </div>
            `;
        }

        if (html === '') {
            html = `
                <div class="search-no-results">
                    <i class="bi bi-clock-history text-muted"></i>
                    <p class="mb-0 text-muted">Belum ada riwayat pencarian</p>
                </div>
            `;
        }

        dropdown.innerHTML = html;
        this.showDropdown();
    }

    /**
     * Render history item
     * @param {SearchResult} item - History item
     * @param {number} index - Item index
     * @param {string} type - Type (recent/frequent)
     * @returns {string} HTML for history item
     */
    renderHistoryItem(item, index, type) {
        if (!item) return '';

        const stockStatus = item.isOutOfStock ? 'out-of-stock' : 
                           item.isLowStock ? 'low-stock' : 'in-stock';

        return `
            <div class="search-result-item history-item ${type} ${stockStatus}" 
                 data-index="${index}" data-item-id="${item.id}">
                <div class="item-main-info">
                    <div class="item-name">${item.name}</div>
                    <div class="item-code text-muted">${item.code}</div>
                </div>
                <div class="item-details">
                    <div class="item-category">
                        <i class="bi bi-tag"></i>
                        ${item.category}
                    </div>
                    <div class="item-price">
                        <i class="bi bi-currency-dollar"></i>
                        ${this.formatCurrency(item.unitPrice)}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Handle keyboard navigation
     * @param {KeyboardEvent} event - Keyboard event
     */
    handleKeyboardNavigation(event) {
        if (!this.isDropdownVisible) return;

        const items = document.querySelectorAll('.search-result-item');
        
        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault();
                this.selectedIndex = Math.min(this.selectedIndex + 1, items.length - 1);
                this.updateSelection(items);
                break;
                
            case 'ArrowUp':
                event.preventDefault();
                this.selectedIndex = Math.max(this.selectedIndex - 1, -1);
                this.updateSelection(items);
                break;
                
            case 'Enter':
                event.preventDefault();
                if (this.selectedIndex >= 0 && items[this.selectedIndex]) {
                    const itemId = items[this.selectedIndex].dataset.itemId;
                    const item = this.findItemById(itemId);
                    if (item) {
                        this.handleItemSelection(item);
                    }
                }
                break;
                
            case 'Escape':
                event.preventDefault();
                this.hideDropdown();
                break;
        }
    }

    /**
     * Update visual selection in dropdown
     * @param {NodeList} items - Result items
     */
    updateSelection(items) {
        items.forEach((item, index) => {
            if (index === this.selectedIndex) {
                item.classList.add('selected');
                item.scrollIntoView({ block: 'nearest' });
            } else {
                item.classList.remove('selected');
            }
        });
    }

    /**
     * Handle item selection
     * @param {SearchResult} item - Selected item
     */
    handleItemSelection(item) {
        try {
            // Add to purchase transaction
            this.addItemToPurchase(item);
            
            // Add to search history
            const searchTerm = document.getElementById('itemSearchInput').value;
            window.searchHistory.addSearch(searchTerm, item);
            
            // Log selection
            window.searchLogger.logItemSelection(item, searchTerm);
            
            // Clear search and hide dropdown
            this.clearSearch();
            
            // Show success feedback
            this.showSuccessMessage(`${item.name} berhasil ditambahkan ke pembelian`);
            
        } catch (error) {
            console.error('Error selecting item:', error);
            this.showErrorMessage('Gagal menambahkan barang ke pembelian');
        }
    }

    /**
     * Add item to purchase transaction
     * @param {SearchResult} item - Item to add
     */
    addItemToPurchase(item) {
        // Get current purchase items
        let purchaseItems = JSON.parse(localStorage.getItem('currentPurchaseItems') || '[]');
        
        // Check if item already exists
        const existingIndex = purchaseItems.findIndex(p => p.id === item.id);
        
        if (existingIndex >= 0) {
            // Increment quantity
            purchaseItems[existingIndex].quantity += 1;
            purchaseItems[existingIndex].total = purchaseItems[existingIndex].quantity * purchaseItems[existingIndex].unitPrice;
        } else {
            // Add new item
            const purchaseItem = {
                id: item.id,
                code: item.code,
                name: item.name,
                category: item.category,
                unitPrice: item.unitPrice,
                quantity: 1,
                total: item.unitPrice
            };
            purchaseItems.push(purchaseItem);
        }
        
        // Save to storage
        localStorage.setItem('currentPurchaseItems', JSON.stringify(purchaseItems));
        
        // Update UI if purchase table exists
        if (typeof updatePurchaseTable === 'function') {
            updatePurchaseTable();
        }
        
        // Trigger custom event for other components
        const event = new CustomEvent('itemAddedToPurchase', { 
            detail: { item, purchaseItems } 
        });
        document.dispatchEvent(event);
    }

    /**
     * Handle category filter change
     * @param {Event} event - Change event
     */
    handleCategoryChange(event) {
        const searchInput = document.getElementById('itemSearchInput');
        const searchTerm = searchInput.value.trim();
        
        if (searchTerm.length >= 2) {
            this.performSearch(searchTerm);
        }
    }

    /**
     * Handle click outside dropdown
     * @param {Event} event - Click event
     */
    handleClickOutside(event) {
        const searchContainer = document.querySelector('.search-field-container');
        const dropdown = document.getElementById('searchDropdown');
        
        if (searchContainer && !searchContainer.contains(event.target)) {
            this.hideDropdown();
        }
        
        // Handle item clicks
        if (event.target.closest('.search-result-item')) {
            const itemElement = event.target.closest('.search-result-item');
            const itemId = itemElement.dataset.itemId;
            const item = this.findItemById(itemId);
            
            if (item) {
                this.handleItemSelection(item);
            }
        }
    }

    /**
     * Show dropdown
     */
    showDropdown() {
        const dropdown = document.getElementById('searchDropdown');
        if (dropdown) {
            dropdown.style.display = 'block';
            this.isDropdownVisible = true;
        }
    }

    /**
     * Hide dropdown
     */
    hideDropdown() {
        const dropdown = document.getElementById('searchDropdown');
        if (dropdown) {
            dropdown.style.display = 'none';
            this.isDropdownVisible = false;
            this.selectedIndex = -1;
        }
    }

    /**
     * Clear search field and hide dropdown
     */
    clearSearch() {
        const searchInput = document.getElementById('itemSearchInput');
        const clearBtn = document.getElementById('clearSearchBtn');
        
        if (searchInput) {
            searchInput.value = '';
        }
        
        if (clearBtn) {
            clearBtn.style.display = 'none';
        }
        
        this.hideDropdown();
    }

    /**
     * Get available categories from inventory
     * @returns {Object[]} Categories with counts
     */
    getAvailableCategories() {
        try {
            const inventory = window.itemSearchService.getInventoryData();
            const categoryMap = new Map();
            
            inventory.forEach(item => {
                const category = item.category || 'Uncategorized';
                if (categoryMap.has(category)) {
                    categoryMap.set(category, categoryMap.get(category) + 1);
                } else {
                    categoryMap.set(category, 1);
                }
            });
            
            return Array.from(categoryMap.entries())
                .map(([name, count]) => ({ id: name, name, count }))
                .sort((a, b) => a.name.localeCompare(b.name));
                
        } catch (error) {
            console.error('Error getting categories:', error);
            return [];
        }
    }

    /**
     * Find item by ID in current results or inventory
     * @param {string} itemId - Item ID
     * @returns {SearchResult|null} Found item
     */
    findItemById(itemId) {
        // First check current results
        let item = this.currentResults.find(r => r.id === itemId);
        
        if (!item) {
            // Check inventory
            const inventory = window.itemSearchService.getInventoryData();
            item = inventory.find(i => i.id === itemId);
            
            if (item) {
                // Add stock indicators
                item = window.itemSearchService.addStockIndicators(item);
            }
        }
        
        return item || null;
    }

    /**
     * Highlight search term in text
     * @param {string} text - Text to highlight
     * @returns {string} Text with highlighted terms
     */
    highlightSearchTerm(text) {
        const searchInput = document.getElementById('itemSearchInput');
        if (!searchInput) return text;
        
        const searchTerm = searchInput.value.trim();
        if (!searchTerm) return text;
        
        const regex = new RegExp(`(${searchTerm})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }

    /**
     * Format currency value
     * @param {number} amount - Amount to format
     * @returns {string} Formatted currency
     */
    formatCurrency(amount) {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    }

    /**
     * Show success message
     * @param {string} message - Success message
     */
    showSuccessMessage(message) {
        this.showNotification(message, 'success');
    }

    /**
     * Show error message
     * @param {string} message - Error message
     */
    showErrorMessage(message) {
        this.showNotification(message, 'error');
    }

    /**
     * Show notification
     * @param {string} message - Notification message
     * @param {string} type - Notification type (success/error/info)
     */
    showNotification(message, type = 'info') {
        // Use existing notification system if available
        if (typeof showNotification === 'function') {
            showNotification(message, type);
            return;
        }
        
        // Fallback to simple alert
        const alertClass = type === 'success' ? 'alert-success' : 
                          type === 'error' ? 'alert-danger' : 'alert-info';
        
        const notification = document.createElement('div');
        notification.className = `alert ${alertClass} alert-dismissible fade show position-fixed`;
        notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; max-width: 400px;';
        notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(notification);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }
}

// Global instance
window.searchUI = new SearchUI();