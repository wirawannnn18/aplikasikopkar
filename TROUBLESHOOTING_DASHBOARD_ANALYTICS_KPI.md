# Troubleshooting Guide - Dashboard Analytics & KPI

## Daftar Isi
1. [Quick Fixes](#quick-fixes)
2. [Dashboard Loading Issues](#dashboard-loading-issues)
3. [Data dan Widget Problems](#data-dan-widget-problems)
4. [Performance Issues](#performance-issues)
5. [Export dan Report Problems](#export-dan-report-problems)
6. [Authentication dan Access Issues](#authentication-dan-access-issues)
7. [Mobile dan Responsive Issues](#mobile-dan-responsive-issues)
8. [Browser Compatibility](#browser-compatibility)
9. [Network dan Connectivity](#network-dan-connectivity)
10. [Advanced Troubleshooting](#advanced-troubleshooting)

---

## Quick Fixes

### 🚀 First Things to Try
Sebelum troubleshooting mendalam, coba langkah-langkah quick fix ini:

1. **Hard Refresh**: `Ctrl+F5` (Windows) atau `Cmd+Shift+R` (Mac)
2. **Clear Browser Cache**: Settings > Privacy > Clear browsing data
3. **Disable Extensions**: Temporarily disable browser extensions
4. **Try Incognito Mode**: Test dashboard dalam private/incognito window
5. **Check Internet Connection**: Verify stable internet connection

### ⚡ Emergency Recovery
Jika dashboard completely broken:
1. **Safe Mode**: Add `?safe=true` ke URL untuk load minimal dashboard
2. **Reset Settings**: Add `?reset=true` untuk reset user preferences
3. **Clear Local Storage**: F12 > Application > Local Storage > Clear All
4. **Alternative Browser**: Try dengan browser berbeda

---

## Dashboard Loading Issues

### Issue: Blank White Screen
**Symptoms**: Dashboard tidak load, hanya tampil blank screen

**Diagnosis Steps**:
1. Open Developer Tools (F12)
2. Check Console tab untuk error messages
3. Check Network tab untuk failed requests
4. Verify JavaScript is enabled

**Solutions**:

#### Level 1: Basic Fixes
```bash
# Clear browser cache
Ctrl+Shift+Delete > Clear cache and cookies

# Disable browser extensions
Chrome: Menu > Extensions > Disable all
Firefox: Menu > Add-ons > Disable all

# Try different browser
Test dengan Chrome, Firefox, atau Edge
```

#### Level 2: Advanced Fixes
```javascript
// Clear localStorage (paste in console)
localStorage.clear();
sessionStorage.clear();
location.reload();

// Reset dashboard configuration
localStorage.setItem('dashboard-reset', 'true');
location.reload();
```

#### Level 3: System-level Fixes
- **Antivirus**: Temporarily disable antivirus software
- **Firewall**: Check firewall settings untuk dashboard domain
- **DNS**: Try different DNS servers (8.8.8.8, 1.1.1.1)
- **Network**: Test dari network berbeda

### Issue: Infinite Loading Spinner
**Symptoms**: Dashboard stuck pada loading screen

**Common Causes**:
- Network connectivity issues
- Server-side problems
- Large dataset loading
- Authentication token expired

**Solutions**:
1. **Check Network**: Verify internet connection stability
2. **Wait Longer**: Large datasets might take 30-60 seconds
3. **Refresh Token**: Logout dan login kembali
4. **Reduce Data Load**: Use date filters untuk limit data
5. **Contact Admin**: If persistent, contact system administrator

### Issue: Partial Loading
**Symptoms**: Beberapa widget load, beberapa tidak

**Diagnosis**:
```javascript
// Check failed requests in console
console.log('Failed requests:', performance.getEntriesByType('navigation'));

// Check widget errors
document.querySelectorAll('.widget-error').forEach(el => 
    console.log('Widget error:', el.textContent)
);
```

**Solutions**:
1. **Refresh Individual Widgets**: Click refresh button pada widget yang error
2. **Check Data Permissions**: Verify access rights untuk specific data
3. **Remove Problematic Widgets**: Temporarily remove error widgets
4. **Check Date Ranges**: Adjust date ranges untuk problematic widgets

---

## Data dan Widget Problems

### Issue: "No Data Available"
**Symptoms**: Widget menampilkan "No data" message

**Troubleshooting Checklist**:
- [ ] Check date range settings
- [ ] Verify data filters
- [ ] Check user permissions
- [ ] Confirm data source availability
- [ ] Test dengan different time period

**Solutions by Widget Type**:

#### KPI Widgets
```javascript
// Debug KPI data
const widget = document.querySelector('[data-widget-id="kpi-widget"]');
const config = JSON.parse(widget.dataset.config);
console.log('KPI Config:', config);
console.log('Date Range:', config.dateRange);
```

**Fixes**:
- Expand date range (last 30 days → last 90 days)
- Remove restrictive filters
- Check if data exists untuk selected period

#### Chart Widgets
```javascript
// Debug chart data
const chartWidget = document.querySelector('.chart-widget');
const chartData = chartWidget.chart?.data;
console.log('Chart Data:', chartData);
```

**Fixes**:
- Verify chart data source configuration
- Check aggregation settings (daily vs monthly)
- Ensure minimum data points untuk chart type

#### Table Widgets
**Common Issues**:
- Empty result set dari database query
- Restrictive search filters
- Pagination issues

**Fixes**:
- Clear search filters
- Reset pagination to page 1
- Check column visibility settings

### Issue: Incorrect Data Values
**Symptoms**: Data tampil tapi nilai tidak sesuai expected

**Validation Steps**:
1. **Cross-reference**: Compare dengan source system
2. **Check Calculations**: Verify formula dan aggregations
3. **Time Zone**: Confirm timezone settings
4. **Data Refresh**: Check last update timestamp

**Common Causes & Fixes**:

#### Currency/Number Formatting
```javascript
// Check number formatting settings
const formatSettings = JSON.parse(localStorage.getItem('user-preferences'));
console.log('Number Format:', formatSettings.numberFormat);
console.log('Currency:', formatSettings.currency);
```

#### Date/Time Issues
```javascript
// Check timezone settings
console.log('User Timezone:', Intl.DateTimeFormat().resolvedOptions().timeZone);
console.log('Dashboard Timezone:', localStorage.getItem('dashboard-timezone'));
```

#### Calculation Errors
- Verify KPI calculation formulas
- Check data aggregation methods
- Confirm filter applications

### Issue: Widget Configuration Errors
**Symptoms**: Widget settings tidak save atau reset

**Diagnosis**:
```javascript
// Check widget configuration storage
const widgetConfigs = JSON.parse(localStorage.getItem('widget-configurations'));
console.log('Widget Configs:', widgetConfigs);

// Verify configuration validation
const isValidConfig = (config) => {
    return config.dataSource && config.type && config.id;
};
```

**Solutions**:
1. **Re-configure Widget**: Delete dan setup ulang widget
2. **Check Permissions**: Verify edit permissions
3. **Clear Widget Cache**: Remove widget dari localStorage
4. **Reset to Default**: Use default widget configuration

---

## Performance Issues

### Issue: Slow Dashboard Loading
**Symptoms**: Dashboard takes >10 seconds to load

**Performance Diagnosis**:
```javascript
// Measure loading performance
const perfData = performance.getEntriesByType('navigation')[0];
console.log('Page Load Time:', perfData.loadEventEnd - perfData.navigationStart);
console.log('DOM Content Loaded:', perfData.domContentLoadedEventEnd - perfData.navigationStart);

// Check memory usage
if (performance.memory) {
    console.log('Memory Usage:', {
        used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) + ' MB',
        total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024) + ' MB',
        limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024) + ' MB'
    });
}
```

**Optimization Steps**:

#### Level 1: User-level Optimizations
1. **Reduce Active Widgets**: Limit to 8-10 widgets per dashboard
2. **Increase Refresh Intervals**: Set to 10-15 minutes instead of 5
3. **Enable Caching**: Turn on browser caching in settings
4. **Close Unused Tabs**: Free up browser memory
5. **Use Filters**: Apply date/category filters untuk reduce data load

#### Level 2: Browser Optimizations
```javascript
// Enable performance mode
localStorage.setItem('dashboard-performance-mode', 'true');

// Disable animations
localStorage.setItem('dashboard-animations', 'false');

// Reduce chart quality
localStorage.setItem('chart-quality', 'medium');
```

#### Level 3: System Optimizations
- **Hardware Acceleration**: Enable in browser settings
- **RAM**: Ensure minimum 4GB available RAM
- **CPU**: Close CPU-intensive applications
- **Network**: Use wired connection instead of WiFi

### Issue: High Memory Usage
**Symptoms**: Browser becomes slow, system lag

**Memory Monitoring**:
```javascript
// Monitor memory usage over time
setInterval(() => {
    if (performance.memory) {
        const used = Math.round(performance.memory.usedJSHeapSize / 1024 / 1024);
        console.log(`Memory: ${used}MB`);
        
        if (used > 500) {
            console.warn('High memory usage detected!');
        }
    }
}, 30000); // Check every 30 seconds
```

**Memory Optimization**:
1. **Restart Browser**: Close dan reopen browser
2. **Reduce Data Range**: Use shorter time periods
3. **Limit Chart Data Points**: Max 1000 points per chart
4. **Clear Cache**: Regular cache cleanup
5. **Update Browser**: Use latest browser version

### Issue: Slow Chart Rendering
**Symptoms**: Charts take long time to render atau lag during interaction

**Chart Performance Optimization**:
```javascript
// Optimize chart configuration
const optimizedChartConfig = {
    animation: false,           // Disable animations
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            display: false      // Hide legend if not needed
        }
    },
    scales: {
        x: {
            ticks: {
                maxTicksLimit: 10  // Limit x-axis ticks
            }
        }
    }
};
```

**Solutions**:
1. **Reduce Data Points**: Aggregate data untuk fewer points
2. **Disable Animations**: Turn off chart animations
3. **Use Canvas**: Prefer canvas over SVG untuk large datasets
4. **Lazy Loading**: Load charts only when visible
5. **Chart Pooling**: Reuse chart instances

---

## Export dan Report Problems

### Issue: Export Fails
**Symptoms**: Export button tidak work atau file tidak download

**Common Causes**:
- Popup blocker enabled
- File size too large
- Browser download restrictions
- Network timeout

**Solutions by Export Type**:

#### PDF Export Issues
```javascript
// Debug PDF generation
console.log('PDF Export Debug:', {
    widgets: document.querySelectorAll('.widget').length,
    charts: document.querySelectorAll('.chart').length,
    dataSize: JSON.stringify(dashboardData).length
});
```

**Fixes**:
1. **Reduce Content**: Select fewer widgets untuk export
2. **Lower Quality**: Reduce chart image quality
3. **Split Export**: Export in multiple smaller files
4. **Check Popup Blocker**: Allow popups untuk dashboard domain

#### Excel Export Issues
**Common Problems**:
- Large datasets (>100k rows)
- Complex formulas
- Chart embedding failures

**Solutions**:
1. **Filter Data**: Use date range atau category filters
2. **Export Raw Data**: Skip charts dan formatting
3. **Use CSV**: Alternative format untuk large datasets
4. **Batch Export**: Export data in chunks

#### Email Delivery Issues
```javascript
// Check email configuration
const emailConfig = {
    smtp: localStorage.getItem('email-smtp'),
    recipients: localStorage.getItem('email-recipients'),
    schedule: localStorage.getItem('report-schedule')
};
console.log('Email Config:', emailConfig);
```

**Troubleshooting**:
1. **Verify Email Settings**: Check SMTP configuration
2. **Check Spam Folder**: Reports might be filtered as spam
3. **Validate Recipients**: Ensure email addresses are correct
4. **Test Send**: Send test email first

### Issue: Scheduled Reports Not Working
**Symptoms**: Automated reports tidak terkirim sesuai schedule

**Diagnosis Steps**:
1. **Check Schedule Status**: Verify schedule is active
2. **Review Logs**: Check report generation logs
3. **Test Manual**: Try manual report generation
4. **Verify Permissions**: Check user permissions untuk scheduling

**Solutions**:
1. **Recreate Schedule**: Delete dan create new schedule
2. **Update Recipients**: Refresh email recipient list
3. **Check Server Time**: Verify server timezone settings
4. **Contact Admin**: For server-side scheduling issues

---

## Authentication dan Access Issues

### Issue: Login Failures
**Symptoms**: Cannot login dengan valid credentials

**Troubleshooting Steps**:
1. **Verify Credentials**: Double-check username/password
2. **Check Caps Lock**: Ensure caps lock is off
3. **Clear Cookies**: Remove authentication cookies
4. **Try Different Browser**: Test dengan browser lain
5. **Check Account Status**: Verify account is not locked

**Common Solutions**:
```javascript
// Clear authentication data
localStorage.removeItem('auth-token');
localStorage.removeItem('user-session');
sessionStorage.clear();

// Reset login form
document.querySelector('#login-form').reset();
```

### Issue: Session Timeouts
**Symptoms**: Frequent "Session Expired" messages

**Configuration Check**:
```javascript
// Check session settings
const sessionConfig = {
    timeout: localStorage.getItem('session-timeout'),
    keepAlive: localStorage.getItem('keep-alive-enabled'),
    lastActivity: localStorage.getItem('last-activity')
};
console.log('Session Config:', sessionConfig);
```

**Solutions**:
1. **Enable Keep-Alive**: Turn on session keep-alive
2. **Extend Timeout**: Request longer session timeout
3. **Regular Activity**: Interact dengan dashboard regularly
4. **Auto-refresh**: Enable auto-refresh untuk maintain session

### Issue: Permission Denied
**Symptoms**: "Access Denied" errors untuk specific features

**Permission Diagnosis**:
```javascript
// Check user permissions
const userPermissions = JSON.parse(localStorage.getItem('user-permissions'));
console.log('User Role:', userPermissions.role);
console.log('Permissions:', userPermissions.permissions);
```

**Solutions**:
1. **Contact Administrator**: Request additional permissions
2. **Check Role Assignment**: Verify correct role is assigned
3. **Refresh Permissions**: Logout dan login untuk refresh
4. **Use Alternative Account**: Try dengan different user account

---

## Mobile dan Responsive Issues

### Issue: Mobile Layout Problems
**Symptoms**: Dashboard tidak display properly di mobile

**Mobile Debugging**:
```javascript
// Check mobile detection
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
console.log('Is Mobile:', isMobile);
console.log('Screen Size:', {
    width: window.innerWidth,
    height: window.innerHeight,
    devicePixelRatio: window.devicePixelRatio
});
```

**Solutions**:
1. **Force Mobile View**: Add `?mobile=true` to URL
2. **Rotate Device**: Try landscape orientation
3. **Zoom Out**: Pinch to zoom out untuk see full layout
4. **Use Desktop View**: Switch to desktop view in browser
5. **Update Browser**: Use latest mobile browser version

### Issue: Touch Interaction Problems
**Symptoms**: Touch gestures tidak work properly

**Touch Debugging**:
```javascript
// Test touch events
document.addEventListener('touchstart', (e) => {
    console.log('Touch Start:', e.touches.length);
});

document.addEventListener('touchmove', (e) => {
    console.log('Touch Move:', e.touches[0].clientX, e.touches[0].clientY);
});
```

**Solutions**:
1. **Enable Touch Mode**: Turn on touch-friendly mode
2. **Increase Touch Targets**: Use larger buttons/controls
3. **Disable Zoom**: Prevent accidental zoom gestures
4. **Use Native App**: Consider mobile app if available

### Issue: Performance on Mobile
**Symptoms**: Slow performance di mobile devices

**Mobile Optimization**:
```javascript
// Enable mobile performance mode
localStorage.setItem('mobile-performance-mode', 'true');
localStorage.setItem('reduce-animations', 'true');
localStorage.setItem('limit-widgets', '6');
```

**Optimization Steps**:
1. **Reduce Widgets**: Limit to 4-6 widgets on mobile
2. **Disable Animations**: Turn off all animations
3. **Lower Chart Quality**: Reduce chart resolution
4. **Enable Data Compression**: Use compressed data transfer
5. **Close Background Apps**: Free up device memory

---

## Browser Compatibility

### Chrome Issues
**Common Problems**:
- Extension conflicts
- Hardware acceleration issues
- Memory leaks

**Chrome-specific Fixes**:
```bash
# Reset Chrome settings
chrome://settings/reset

# Disable hardware acceleration
chrome://settings/ > Advanced > System > Use hardware acceleration when available (OFF)

# Clear site data
chrome://settings/content/all > [site] > Clear data
```

### Firefox Issues
**Common Problems**:
- Strict privacy settings
- Add-on conflicts
- WebGL issues

**Firefox-specific Fixes**:
```bash
# Reset Firefox
about:support > Refresh Firefox

# Enable WebGL
about:config > webgl.force-enabled = true

# Disable tracking protection
about:preferences#privacy > Standard protection
```

### Safari Issues
**Common Problems**:
- Intelligent Tracking Prevention
- Local storage limitations
- WebKit compatibility

**Safari-specific Fixes**:
1. **Disable ITP**: Safari > Preferences > Privacy > Prevent cross-site tracking (OFF)
2. **Enable JavaScript**: Safari > Preferences > Security > Enable JavaScript
3. **Clear Website Data**: Safari > Preferences > Privacy > Manage Website Data
4. **Update Safari**: Ensure latest version

### Edge Issues
**Common Problems**:
- Legacy compatibility mode
- SmartScreen blocking
- Extension issues

**Edge-specific Fixes**:
```bash
# Reset Edge
edge://settings/reset

# Disable SmartScreen
edge://settings/privacy > Microsoft Defender SmartScreen (OFF)

# Clear browsing data
edge://settings/clearBrowserData
```

---

## Network dan Connectivity

### Issue: Intermittent Connection
**Symptoms**: Dashboard works sometimes, fails other times

**Network Diagnosis**:
```javascript
// Monitor network status
navigator.onLine ? console.log('Online') : console.log('Offline');

// Test connection quality
const testConnection = async () => {
    const start = Date.now();
    try {
        await fetch('/api/health', { method: 'HEAD' });
        const latency = Date.now() - start;
        console.log(`Connection latency: ${latency}ms`);
    } catch (error) {
        console.error('Connection test failed:', error);
    }
};
```

**Solutions**:
1. **Check WiFi Signal**: Ensure strong WiFi signal
2. **Use Ethernet**: Switch to wired connection
3. **Restart Router**: Power cycle network equipment
4. **Change DNS**: Use public DNS (8.8.8.8, 1.1.1.1)
5. **Contact ISP**: Report connectivity issues

### Issue: Slow Data Loading
**Symptoms**: Data takes long time to load

**Network Optimization**:
```javascript
// Enable data compression
localStorage.setItem('enable-compression', 'true');

// Reduce data requests
localStorage.setItem('batch-requests', 'true');

// Enable offline mode
localStorage.setItem('offline-mode', 'true');
```

**Solutions**:
1. **Enable Caching**: Turn on aggressive caching
2. **Reduce Data Range**: Use shorter time periods
3. **Compress Transfers**: Enable data compression
4. **Use CDN**: Ensure CDN is properly configured
5. **Optimize Queries**: Contact admin untuk query optimization

### Issue: CORS Errors
**Symptoms**: Cross-origin request blocked errors

**CORS Debugging**:
```javascript
// Check CORS headers
fetch('/api/data')
    .then(response => {
        console.log('CORS Headers:', {
            'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
            'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
            'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers')
        });
    })
    .catch(error => console.error('CORS Error:', error));
```

**Solutions**:
1. **Contact Administrator**: CORS configuration needs server-side fix
2. **Use Proxy**: Configure proxy server
3. **Different Domain**: Access dari allowed domain
4. **Browser Extension**: Use CORS-disabling extension (development only)

---

## Advanced Troubleshooting

### Developer Tools Debugging

#### Console Debugging
```javascript
// Enable debug mode
localStorage.setItem('debug-mode', 'true');

// Monitor all errors
window.addEventListener('error', (e) => {
    console.error('Global Error:', {
        message: e.message,
        filename: e.filename,
        lineno: e.lineno,
        colno: e.colno,
        error: e.error
    });
});

// Monitor unhandled promise rejections
window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled Promise Rejection:', e.reason);
});
```

#### Network Debugging
```javascript
// Monitor all network requests
const originalFetch = window.fetch;
window.fetch = function(...args) {
    console.log('Fetch Request:', args[0]);
    return originalFetch.apply(this, args)
        .then(response => {
            console.log('Fetch Response:', response.status, response.statusText);
            return response;
        })
        .catch(error => {
            console.error('Fetch Error:', error);
            throw error;
        });
};
```

#### Performance Debugging
```javascript
// Monitor performance metrics
const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
        if (entry.entryType === 'measure') {
            console.log(`Performance: ${entry.name} took ${entry.duration}ms`);
        }
    }
});
observer.observe({ entryTypes: ['measure'] });

// Measure custom operations
performance.mark('dashboard-start');
// ... dashboard operations ...
performance.mark('dashboard-end');
performance.measure('dashboard-load', 'dashboard-start', 'dashboard-end');
```

### System-level Debugging

#### Memory Analysis
```javascript
// Analyze memory usage patterns
const analyzeMemory = () => {
    if (performance.memory) {
        const memory = performance.memory;
        const usage = {
            used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
            total: Math.round(memory.totalJSHeapSize / 1024 / 1024),
            limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024)
        };
        
        console.log('Memory Analysis:', usage);
        
        if (usage.used / usage.limit > 0.8) {
            console.warn('High memory usage detected!');
        }
        
        return usage;
    }
};

// Run memory analysis every minute
setInterval(analyzeMemory, 60000);
```

#### Storage Analysis
```javascript
// Analyze storage usage
const analyzeStorage = () => {
    const storage = {
        localStorage: JSON.stringify(localStorage).length,
        sessionStorage: JSON.stringify(sessionStorage).length
    };
    
    console.log('Storage Usage:', {
        localStorage: `${Math.round(storage.localStorage / 1024)}KB`,
        sessionStorage: `${Math.round(storage.sessionStorage / 1024)}KB`
    });
    
    // Check for storage quota
    if ('storage' in navigator && 'estimate' in navigator.storage) {
        navigator.storage.estimate().then(estimate => {
            console.log('Storage Quota:', {
                used: `${Math.round(estimate.usage / 1024 / 1024)}MB`,
                available: `${Math.round(estimate.quota / 1024 / 1024)}MB`
            });
        });
    }
};
```

### Recovery Procedures

#### Emergency Reset
```javascript
// Complete dashboard reset
const emergencyReset = () => {
    // Clear all storage
    localStorage.clear();
    sessionStorage.clear();
    
    // Clear cookies
    document.cookie.split(";").forEach(cookie => {
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
    });
    
    // Clear cache
    if ('caches' in window) {
        caches.keys().then(names => {
            names.forEach(name => caches.delete(name));
        });
    }
    
    // Reload page
    window.location.reload(true);
};

// Use only in emergency situations
// emergencyReset();
```

#### Backup dan Restore
```javascript
// Backup dashboard configuration
const backupConfig = () => {
    const config = {
        userPreferences: localStorage.getItem('user-preferences'),
        dashboardLayout: localStorage.getItem('dashboard-layout'),
        widgetConfigurations: localStorage.getItem('widget-configurations'),
        customSettings: localStorage.getItem('custom-settings')
    };
    
    const backup = JSON.stringify(config);
    const blob = new Blob([backup], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashboard-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
};

// Restore dashboard configuration
const restoreConfig = (backupFile) => {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const config = JSON.parse(e.target.result);
            
            Object.entries(config).forEach(([key, value]) => {
                if (value) {
                    localStorage.setItem(key, value);
                }
            });
            
            alert('Configuration restored successfully!');
            window.location.reload();
        } catch (error) {
            alert('Invalid backup file!');
        }
    };
    reader.readAsText(backupFile);
};
```

---

## Contact Information

### Immediate Support
- **Emergency Hotline**: +62-21-1234-5678 (24/7)
- **Email**: emergency@koperasi.com
- **Chat Support**: Available in dashboard (bottom-right corner)

### Technical Support Levels

#### Level 1: User Support
- **Email**: support@koperasi.com
- **Phone**: +62-21-1234-5678 ext. 1234
- **Hours**: Mon-Fri 08:00-17:00 WIB
- **Response Time**: 4 hours

#### Level 2: Technical Support
- **Email**: tech-support@koperasi.com
- **Phone**: +62-21-1234-5678 ext. 2345
- **Hours**: Mon-Fri 08:00-20:00 WIB
- **Response Time**: 2 hours

#### Level 3: Development Support
- **Email**: dev-support@koperasi.com
- **Phone**: +62-21-1234-5678 ext. 3456
- **Hours**: Mon-Fri 09:00-18:00 WIB
- **Response Time**: 1 hour (critical issues)

### Escalation Process
1. **Level 1**: Basic troubleshooting dan user guidance
2. **Level 2**: Technical issues dan system problems
3. **Level 3**: Code bugs dan development issues
4. **Management**: Critical business impact issues

---

*Troubleshooting guide ini akan diupdate berdasarkan feedback dan issue reports. Untuk update terbaru, kunjungi https://docs.koperasi.com/dashboard-troubleshooting*