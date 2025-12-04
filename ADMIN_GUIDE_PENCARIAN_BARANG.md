# Admin Guide - Pencarian Barang Pembelian

## Daftar Isi
1. [Overview Sistem](#overview-sistem)
2. [Konfigurasi](#konfigurasi)
3. [Performance Tuning](#performance-tuning)
4. [Monitoring](#monitoring)
5. [Audit Log Analysis](#audit-log-analysis)
6. [Maintenance](#maintenance)
7. [Troubleshooting](#troubleshooting)

## Overview Sistem

### Arsitektur Komponen
```
ItemSearchModule
├── ItemSearchService (Core search logic)
├── SearchUI (User interface)
├── SearchHistory (Recent searches)
├── SearchLogger (Audit logging)
└── SearchCache (Performance optimization)
```

### Integrasi Sistem
- **Inventory System**: Sumber data barang dan kategori
- **Purchase Transaction**: Target penambahan barang
- **Audit System**: Logging aktivitas pencarian
- **LocalStorage**: Penyimpanan data browser

### File Struktur
```
js/
├── itemSearch.js          # Core search service
├── itemSearchUI.js        # UI components
css/
├── itemSearch.css         # Styling
__tests__/
├── itemSearch.test.js     # Property-based tests
├── itemSearchUI.test.js   # Unit tests
└── itemSearchIntegration.test.js  # Integration tests
```

## Konfigurasi

### 1. Search Configuration

#### Low Stock Threshold
```javascript
// Di itemSearch.js, line ~15
this.lowStockThreshold = 10; // Items dengan stok <= 10 dianggap low stock
```

#### Debounce Delay
```javascript
// Di itemSearchUI.js, line ~10
this.debounceDelay = 300; // 300ms delay untuk search
```

#### Maximum Results
```javascript
// Default di searchItems query
maxResults: 10 // Maksimal 10 hasil pencarian
```

#### History Size Limit
```javascript
// Di SearchHistory class
this.maxHistorySize = 10; // Maksimal 10 item di history
```

### 2. Performance Configuration

#### Cache Settings
```javascript
// Audit log size limit
if (auditLog.length > 1000) {
    auditLog.splice(0, auditLog.length - 1000);
}
```

#### Search Timeout
```javascript
// Untuk implementasi timeout (opsional)
const searchTimeout = 5000; // 5 detik timeout
```

### 3. UI Configuration

#### Search Field Placeholder
```javascript
// Di renderSearchField()
placeholder="Cari barang berdasarkan nama atau kode..."
```

#### Help Text
```javascript
// Di renderSearchField()
"Ketik minimal 2 karakter untuk mulai mencari. Gunakan Ctrl+F untuk fokus ke pencarian."
```

## Performance Tuning

### 1. Optimasi Search Algorithm

#### Indexing Strategy
```javascript
// Implementasi search indexing (future enhancement)
class SearchIndex {
    constructor() {
        this.nameIndex = new Map();
        this.codeIndex = new Map();
        this.categoryIndex = new Map();
    }
    
    buildIndex(inventory) {
        // Build search indexes for faster lookup
    }
}
```

#### Fuzzy Search Configuration
```javascript
// Untuk implementasi fuzzy search
const fuzzyOptions = {
    threshold: 0.6,    // Similarity threshold
    distance: 100,     // Maximum distance
    maxPatternLength: 32
};
```

### 2. Memory Optimization

#### Cleanup Strategy
```javascript
// Cleanup old data periodically
setInterval(() => {
    cleanupOldAuditLogs();
    cleanupOldSearchHistory();
}, 24 * 60 * 60 * 1000); // Daily cleanup
```

#### Virtual Scrolling (untuk large datasets)
```javascript
// Implementasi virtual scrolling untuk > 100 results
const virtualScrollConfig = {
    itemHeight: 60,
    visibleItems: 10,
    bufferSize: 5
};
```

### 3. Network Optimization

#### Batch Operations
```javascript
// Batch multiple search operations
const searchBatch = {
    batchSize: 5,
    batchDelay: 100
};
```

## Monitoring

### 1. Performance Metrics

#### Key Metrics to Monitor
- **Search Response Time**: Target < 200ms
- **Memory Usage**: Monitor localStorage size
- **Error Rate**: Track search failures
- **User Engagement**: Search frequency per user

#### Monitoring Implementation
```javascript
// Performance monitoring
class SearchMonitor {
    static logPerformance(searchTerm, responseTime, resultCount) {
        const metric = {
            timestamp: new Date().toISOString(),
            searchTerm,
            responseTime,
            resultCount,
            userId: getCurrentUser()?.id
        };
        
        // Send to monitoring system
        this.sendMetric(metric);
    }
}
```

### 2. Health Checks

#### System Health Indicators
```javascript
// Health check function
function checkSearchHealth() {
    const checks = {
        inventoryLoaded: checkInventoryData(),
        searchServiceActive: checkSearchService(),
        uiComponentsLoaded: checkUIComponents(),
        localStorageAvailable: checkLocalStorage()
    };
    
    return checks;
}
```

### 3. User Activity Monitoring

#### Search Analytics
```javascript
// Analytics tracking
const searchAnalytics = {
    totalSearches: 0,
    uniqueUsers: new Set(),
    popularSearchTerms: new Map(),
    averageResponseTime: 0
};
```

## Audit Log Analysis

### 1. Log Structure

#### Search Operation Log
```json
{
    "type": "search",
    "searchTerm": "laptop",
    "resultCount": 5,
    "responseTime": 45,
    "timestamp": "2024-12-03T10:30:00Z",
    "userId": "user123"
}
```

#### Item Selection Log
```json
{
    "type": "item_selection",
    "itemId": "item123",
    "itemName": "Laptop Dell",
    "searchTerm": "laptop",
    "timestamp": "2024-12-03T10:30:15Z",
    "userId": "user123"
}
```

#### Error Log
```json
{
    "type": "search_error",
    "searchTerm": "test",
    "error": "Storage full",
    "stack": "Error stack trace...",
    "timestamp": "2024-12-03T10:30:30Z",
    "userId": "user123"
}
```

### 2. Log Analysis Queries

#### Popular Search Terms
```javascript
function getPopularSearchTerms(logs, limit = 10) {
    const termCounts = new Map();
    
    logs.filter(log => log.type === 'search')
        .forEach(log => {
            const count = termCounts.get(log.searchTerm) || 0;
            termCounts.set(log.searchTerm, count + 1);
        });
    
    return Array.from(termCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit);
}
```

#### Performance Analysis
```javascript
function analyzeSearchPerformance(logs) {
    const searchLogs = logs.filter(log => log.type === 'search');
    
    return {
        averageResponseTime: searchLogs.reduce((sum, log) => sum + log.responseTime, 0) / searchLogs.length,
        slowSearches: searchLogs.filter(log => log.responseTime > 200),
        totalSearches: searchLogs.length,
        uniqueUsers: new Set(searchLogs.map(log => log.userId)).size
    };
}
```

#### Error Analysis
```javascript
function analyzeSearchErrors(logs) {
    const errorLogs = logs.filter(log => log.type === 'search_error');
    
    const errorTypes = new Map();
    errorLogs.forEach(log => {
        const count = errorTypes.get(log.error) || 0;
        errorTypes.set(log.error, count + 1);
    });
    
    return {
        totalErrors: errorLogs.length,
        errorRate: errorLogs.length / logs.length,
        commonErrors: Array.from(errorTypes.entries()).sort((a, b) => b[1] - a[1])
    };
}
```

### 3. Export Functionality

#### CSV Export
```javascript
function exportSearchLogs(logs, format = 'csv') {
    const searchLogs = logs.filter(log => 
        log.type === 'search' || 
        log.type === 'item_selection' || 
        log.type === 'search_error'
    );
    
    if (format === 'csv') {
        return convertToCSV(searchLogs);
    }
    
    return JSON.stringify(searchLogs, null, 2);
}
```

## Maintenance

### 1. Regular Maintenance Tasks

#### Daily Tasks
- [ ] Check error logs for new issues
- [ ] Monitor search performance metrics
- [ ] Verify inventory data integrity
- [ ] Check localStorage usage

#### Weekly Tasks
- [ ] Analyze popular search terms
- [ ] Review slow search queries
- [ ] Clean up old audit logs
- [ ] Update search indexes if needed

#### Monthly Tasks
- [ ] Performance optimization review
- [ ] User feedback analysis
- [ ] System capacity planning
- [ ] Security audit

### 2. Data Cleanup

#### Audit Log Cleanup
```javascript
function cleanupAuditLogs() {
    try {
        const auditLog = JSON.parse(localStorage.getItem('auditLog') || '[]');
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        
        const recentLogs = auditLog.filter(log => 
            new Date(log.timestamp) > oneMonthAgo
        );
        
        localStorage.setItem('auditLog', JSON.stringify(recentLogs));
        
        return {
            removed: auditLog.length - recentLogs.length,
            remaining: recentLogs.length
        };
    } catch (error) {
        console.error('Error cleaning up audit logs:', error);
        return { error: error.message };
    }
}
```

#### Search History Cleanup
```javascript
function cleanupSearchHistory() {
    try {
        const history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        
        const recentHistory = history.filter(entry => 
            new Date(entry.timestamp) > oneWeekAgo
        );
        
        localStorage.setItem('searchHistory', JSON.stringify(recentHistory));
        
        return {
            removed: history.length - recentHistory.length,
            remaining: recentHistory.length
        };
    } catch (error) {
        console.error('Error cleaning up search history:', error);
        return { error: error.message };
    }
}
```

### 3. Index Maintenance

#### Rebuild Search Index
```javascript
function rebuildSearchIndex() {
    try {
        const inventory = JSON.parse(localStorage.getItem('inventory') || '[]');
        
        // Clear existing cache
        if (window.itemSearchService) {
            window.itemSearchService.searchCache.clear();
        }
        
        // Rebuild indexes (future implementation)
        // buildSearchIndexes(inventory);
        
        return { success: true, itemCount: inventory.length };
    } catch (error) {
        console.error('Error rebuilding search index:', error);
        return { error: error.message };
    }
}
```

## Troubleshooting

### 1. Common Issues

#### Issue: Search Not Working
**Symptoms**: No results returned for valid search terms
**Diagnosis**:
```javascript
// Check inventory data
const inventory = JSON.parse(localStorage.getItem('inventory') || '[]');
console.log('Inventory items:', inventory.length);

// Check search service
console.log('Search service available:', !!window.itemSearchService);

// Check UI components
console.log('Search UI available:', !!window.searchUI);
```

**Solutions**:
1. Verify inventory data exists
2. Check JavaScript console for errors
3. Refresh page to reload components
4. Clear browser cache if needed

#### Issue: Poor Performance
**Symptoms**: Search takes > 200ms to respond
**Diagnosis**:
```javascript
// Performance test
async function testSearchPerformance() {
    const start = performance.now();
    await window.itemSearchService.searchItems({ term: 'test' });
    const end = performance.now();
    
    console.log('Search time:', end - start, 'ms');
}
```

**Solutions**:
1. Reduce inventory size if > 1000 items
2. Implement search indexing
3. Optimize search algorithm
4. Add result caching

#### Issue: Memory Usage High
**Symptoms**: Browser becomes slow, localStorage full
**Diagnosis**:
```javascript
// Check localStorage usage
function checkStorageUsage() {
    let total = 0;
    for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
            total += localStorage[key].length;
        }
    }
    
    console.log('Total localStorage usage:', total, 'characters');
    console.log('Approximate size:', Math.round(total / 1024), 'KB');
}
```

**Solutions**:
1. Run cleanup functions
2. Reduce audit log retention
3. Limit search history size
4. Clear unnecessary data

### 2. Debug Tools

#### Search Debug Console
```javascript
// Add to browser console for debugging
window.searchDebug = {
    testSearch: async (term) => {
        console.log('Testing search for:', term);
        const results = await window.itemSearchService.searchItems({ term });
        console.log('Results:', results);
        return results;
    },
    
    checkHealth: () => {
        return {
            inventoryCount: JSON.parse(localStorage.getItem('inventory') || '[]').length,
            historyCount: JSON.parse(localStorage.getItem('searchHistory') || '[]').length,
            auditLogCount: JSON.parse(localStorage.getItem('auditLog') || '[]').length,
            searchServiceActive: !!window.itemSearchService,
            searchUIActive: !!window.searchUI
        };
    },
    
    clearAllData: () => {
        localStorage.removeItem('searchHistory');
        localStorage.removeItem('auditLog');
        console.log('Search data cleared');
    }
};
```

### 3. Performance Profiling

#### Search Performance Profiler
```javascript
class SearchProfiler {
    static profile(searchTerm) {
        console.time('Search Total');
        
        console.time('Data Load');
        const inventory = JSON.parse(localStorage.getItem('inventory') || '[]');
        console.timeEnd('Data Load');
        
        console.time('Filter');
        const filtered = inventory.filter(item => 
            item.nama.toLowerCase().includes(searchTerm.toLowerCase())
        );
        console.timeEnd('Filter');
        
        console.time('Sort');
        const sorted = filtered.sort((a, b) => a.nama.localeCompare(b.nama));
        console.timeEnd('Sort');
        
        console.timeEnd('Search Total');
        
        return {
            totalItems: inventory.length,
            filteredItems: filtered.length,
            finalResults: sorted.slice(0, 10).length
        };
    }
}
```

---

## 📊 Monitoring Dashboard

### Key Metrics to Track
1. **Search Volume**: Searches per day/hour
2. **Response Time**: Average and 95th percentile
3. **Error Rate**: Percentage of failed searches
4. **Popular Terms**: Most searched items
5. **User Adoption**: Active users using search
6. **Conversion Rate**: Searches that result in item selection

### Alerts to Configure
- Search response time > 500ms
- Error rate > 5%
- localStorage usage > 80%
- No searches in last hour (system health)

---

**Versi Dokumen**: 1.0  
**Terakhir Diperbarui**: Desember 2024  
**Berlaku untuk**: Aplikasi Koperasi v1.0+