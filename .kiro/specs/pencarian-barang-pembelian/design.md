# Design Document - Pencarian Barang Pembelian

## Overview

Fitur pencarian barang untuk input pembelian yang memungkinkan pencarian berdasarkan nama dan kategori barang. Fitur ini dirancang untuk membantu kasir/admin dalam menambahkan barang ke transaksi pembelian, terutama untuk barang yang tidak memiliki barcode atau ketika barcode scanner tidak berfungsi.

## Architecture

### Component Structure
```
SearchModule
├── ItemSearchService (Core search logic)
├── SearchUI (User interface components)
├── SearchHistory (Recent searches management)
├── SearchLogger (Audit logging)
└── SearchCache (Performance optimization)
```

### Integration Points
- **Inventory System**: Mengambil data barang dan kategori
- **Purchase Transaction**: Menambahkan barang ke transaksi pembelian
- **Audit System**: Logging aktivitas pencarian
- **UI Framework**: Bootstrap untuk komponen interface

## Components and Interfaces

### ItemSearchService
```javascript
class ItemSearchService {
    searchItems(query, categoryFilter, options)
    getItemsByCategory(categoryId)
    getRecentSearches()
    addToRecentSearches(item)
    clearSearchHistory()
}
```

### SearchUI
```javascript
class SearchUI {
    renderSearchField()
    renderCategoryFilter()
    renderSearchResults(items)
    renderSuggestions(items)
    handleItemSelection(item)
    handleKeyboardNavigation(event)
}
```

### SearchHistory
```javascript
class SearchHistory {
    addSearch(searchTerm, selectedItem)
    getRecentSearches(limit)
    getFrequentItems(limit)
    clearHistory()
    removeDeletedItems(deletedItemIds)
}
```

## Data Models

### SearchQuery
```javascript
{
    term: string,           // Search term
    categoryId: string,     // Category filter (optional)
    minLength: number,      // Minimum characters (default: 2)
    maxResults: number,     // Maximum results (default: 10)
    caseSensitive: boolean  // Case sensitivity (default: false)
}
```

### SearchResult
```javascript
{
    id: string,
    code: string,
    name: string,
    category: string,
    currentStock: number,
    unitPrice: number,
    isLowStock: boolean,
    isOutOfStock: boolean,
    relevanceScore: number
}
```

### SearchHistoryEntry
```javascript
{
    id: string,
    searchTerm: string,
    selectedItem: SearchResult,
    timestamp: Date,
    userId: string,
    frequency: number
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After reviewing all properties identified in the prework, I identified several areas for consolidation:

- Properties 1.1, 5.1, 5.2, 5.4, 5.5 all relate to search matching behavior and can be combined into a comprehensive search matching property
- Properties 1.2 and 4.1 both test result structure and can be combined
- Properties 2.1 and 2.2 both test filtering behavior and can be combined
- Properties 6.1, 6.2, 6.3 all relate to item addition behavior and can be combined
- Properties 9.1, 9.2, 9.3 all relate to search history management and can be combined
- Properties 10.1, 10.2, 10.3 all relate to logging behavior and can be combined

Property 1: Search matching behavior
*For any* search query and inventory data, all returned results should contain the search term (case-insensitive, partial matching) and match any specified category filter
**Validates: Requirements 1.1, 2.1, 2.2, 5.1, 5.2, 5.3, 5.4, 5.5**

Property 2: Search result structure completeness
*For any* search result, the result should contain all required fields (id, code, name, category, currentStock, unitPrice) with appropriate handling for missing data
**Validates: Requirements 1.2, 4.1, 4.5**

Property 3: Search result limiting
*For any* search query, the number of returned results should not exceed the specified maximum limit (default 10)
**Validates: Requirements 3.2**

Property 4: Minimum character threshold
*For any* search input with less than 2 characters, the system should not display suggestions
**Validates: Requirements 3.1**

Property 5: Item addition to purchase transaction
*For any* valid item selected from search results, the item should be added to the purchase transaction with correct quantity handling (increment if duplicate, default quantity 1 if new)
**Validates: Requirements 1.3, 6.1, 6.3**

Property 6: UI state management after selection
*For any* successful item selection, the search field should be cleared and suggestions should be hidden
**Validates: Requirements 6.2**

Property 7: Low stock indicator
*For any* item with stock below the defined threshold, the search result should display a low stock warning indicator
**Validates: Requirements 4.2**

Property 8: Keyboard navigation consistency
*For any* suggestion list, arrow key navigation should move through items sequentially and wrap around at boundaries
**Validates: Requirements 3.3**

Property 9: Search history management
*For any* search history, when the history exceeds 10 items, the oldest entries should be automatically removed, and deleted inventory items should be removed from history
**Validates: Requirements 9.1, 9.2, 9.3, 9.5**

Property 10: Data consistency after inventory updates
*For any* inventory update (add/edit/delete), search results should immediately reflect the changes
**Validates: Requirements 7.3**

Property 11: Comprehensive audit logging
*For any* search operation, item selection, or error, the system should log appropriate details including search terms, results count, timestamps, and user information
**Validates: Requirements 10.1, 10.2, 10.3, 10.5**

Property 12: Graceful error handling
*For any* error condition (storage full, network issues, invalid input), the system should handle the error gracefully without breaking search functionality
**Validates: Requirements 5.3, 7.4**

## Error Handling

### Search Errors
- **Invalid Input**: Sanitize special characters, handle empty queries
- **No Results**: Display appropriate "No items found" message
- **Storage Errors**: Graceful fallback when localStorage is full
- **Performance Issues**: Implement debouncing and result limiting

### UI Errors
- **Keyboard Navigation**: Handle edge cases at list boundaries
- **Focus Management**: Proper focus handling when suggestions are hidden
- **Selection Errors**: Validate item before adding to transaction

### Data Errors
- **Missing Item Data**: Display "N/A" for incomplete information
- **Deleted Items**: Remove from search history and handle gracefully
- **Category Mismatches**: Validate category filters against available categories

## Testing Strategy

### Unit Testing
- Test search algorithms with various input combinations
- Test UI component rendering and event handling
- Test data validation and error scenarios
- Test keyboard navigation and accessibility features

### Property-Based Testing
- Use fast-check library for JavaScript property-based testing
- Generate random search queries, inventory data, and user interactions
- Test search matching algorithms across wide input ranges
- Verify UI state consistency across different interaction patterns
- Test performance characteristics with large datasets

### Integration Testing
- Test integration with inventory system
- Test integration with purchase transaction system
- Test audit logging integration
- Test browser storage integration

### Performance Testing
- Test search performance with large inventory datasets
- Test UI responsiveness during rapid typing
- Test memory usage with extensive search history
- Test concurrent search operations

## Implementation Notes

### Search Algorithm
- Implement fuzzy matching for better user experience
- Use debouncing (300ms) to prevent excessive API calls
- Cache frequently searched items for better performance
- Implement search result ranking based on relevance and frequency

### UI/UX Considerations
- Use dropdown with keyboard navigation support
- Implement loading states for better user feedback
- Add visual indicators for stock status
- Ensure accessibility compliance (ARIA labels, keyboard navigation)

### Performance Optimization
- Implement virtual scrolling for large result sets
- Use IndexedDB for large inventory caching
- Implement search result pagination if needed
- Optimize DOM updates using virtual DOM concepts

### Security Considerations
- Sanitize all search inputs to prevent XSS
- Validate user permissions before showing sensitive item data
- Log search activities for audit purposes
- Implement rate limiting for search requests