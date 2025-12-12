/**
 * User Preferences Manager
 * Handles user-specific dashboard configurations, preferences, and settings
 * 
 * @class UserPreferencesManager
 */
class UserPreferencesManager {
    constructor(dashboardController) {
        this.dashboardController = dashboardController;
        this.currentUser = null;
        this.preferences = new Map();
        this.defaultPreferences = {};
        this.storageKey = 'dashboard_preferences';
        
        this.init();
    }

    /**
     * Initialize preferences manager
     */
    init() {
        this.defineDefaultPreferences();
        this.loadCurrentUser();
        this.loadUserPreferences();
        this.createPreferencesInterface();
    }

    /**
     * Define default preferences structure
     */
    defineDefaultPreferences() {
        this.defaultPreferences = {
            // Dashboard Layout
            layout: {
                gridSize: 20,
                snapToGrid: true,
                compactMode: false,
                sidebarCollapsed: false
            },
            
            // Theme and Appearance
            theme: {
                colorScheme: 'light', // light, dark, auto
                primaryColor: '#007bff',
                fontSize: 'medium', // small, medium, large
                animations: true,
                reducedMotion: false
            },
            
            // Widget Preferences
            widgets: {
                defaultRefreshInterval: 300000, // 5 minutes in ms
                autoRefresh: true,
                showTooltips: true,
                chartAnimations: true,
                defaultChartType: 'line'
            },
            
            // Data and Analytics
            data: {
                defaultDateRange: '30d', // 7d, 30d, 90d, 1y
                defaultCurrency: 'IDR',
                numberFormat: 'id-ID', // locale
                timezone: 'Asia/Jakarta',
                cacheEnabled: true
            },
            
            // Notifications
            notifications: {
                enabled: true,
                desktop: false,
                email: false,
                alertThresholds: true,
                soundEnabled: false
            },
            
            // Export and Sharing
            export: {
                defaultFormat: 'pdf', // pdf, excel, csv
                includeCharts: true,
                includeData: true,
                watermark: true
            },
            
            // Accessibility
            accessibility: {
                highContrast: false,
                largeText: false,
                keyboardNavigation: true,
                screenReader: false
            },
            
            // Privacy and Security
            privacy: {
                shareUsageData: false,
                rememberLogin: true,
                sessionTimeout: 3600000, // 1 hour in ms
                twoFactorAuth: false
            }
        };
    }

    /**
     * Load current user information
     */
    loadCurrentUser() {
        const userData = localStorage.getItem('currentUser');
        if (userData) {
            try {
                this.currentUser = JSON.parse(userData);
            } catch (error) {
                console.error('Error loading user data:', error);
                this.currentUser = { id: 'default', name: 'Default User' };
            }
        } else {
            this.currentUser = { id: 'default', name: 'Default User' };
        }
    }

    /**
     * Load user preferences from storage
     */
    loadUserPreferences() {
        const userId = this.currentUser.id;
        const storageKey = `${this.storageKey}_${userId}`;
        
        try {
            const savedPreferences = localStorage.getItem(storageKey);
            if (savedPreferences) {
                const parsed = JSON.parse(savedPreferences);
                this.preferences.set(userId, this.mergePreferences(this.defaultPreferences, parsed));
            } else {
                this.preferences.set(userId, { ...this.defaultPreferences });
            }
        } catch (error) {
            console.error('Error loading preferences:', error);
            this.preferences.set(userId, { ...this.defaultPreferences });
        }
        
        // Apply loaded preferences
        this.applyPreferences();
    }

    /**
     * Merge default preferences with user preferences
     */
    mergePreferences(defaults, user) {
        const merged = { ...defaults };
        
        for (const [key, value] of Object.entries(user)) {
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                merged[key] = { ...defaults[key], ...value };
            } else {
                merged[key] = value;
            }
        }
        
        return merged;
    }

    /**
     * Get user preference
     */
    getPreference(path) {
        const userId = this.currentUser.id;
        const userPrefs = this.preferences.get(userId) || this.defaultPreferences;
        
        return this.getNestedValue(userPrefs, path);
    }

    /**
     * Set user preference
     */
    setPreference(path, value) {
        const userId = this.currentUser.id;
        let userPrefs = this.preferences.get(userId) || { ...this.defaultPreferences };
        
        userPrefs = this.setNestedValue(userPrefs, path, value);
        this.preferences.set(userId, userPrefs);
        
        // Save to storage
        this.savePreferences();
        
        // Apply changes
        this.applyPreference(path, value);
        
        console.log(`Preference updated: ${path} = ${value}`);
    }

    /**
     * Get nested object value by path
     */
    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }

    /**
     * Set nested object value by path
     */
    setNestedValue(obj, path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        const target = keys.reduce((current, key) => {
            if (!current[key] || typeof current[key] !== 'object') {
                current[key] = {};
            }
            return current[key];
        }, obj);
        
        target[lastKey] = value;
        return obj;
    }

    /**
     * Save preferences to storage
     */
    savePreferences() {
        const userId = this.currentUser.id;
        const storageKey = `${this.storageKey}_${userId}`;
        const userPrefs = this.preferences.get(userId);
        
        try {
            localStorage.setItem(storageKey, JSON.stringify(userPrefs));
        } catch (error) {
            console.error('Error saving preferences:', error);
        }
    }

    /**
     * Apply all preferences to the dashboard
     */
    applyPreferences() {
        const userPrefs = this.preferences.get(this.currentUser.id);
        if (!userPrefs) return;

        // Apply theme preferences
        this.applyThemePreferences(userPrefs.theme);
        
        // Apply layout preferences
        this.applyLayoutPreferences(userPrefs.layout);
        
        // Apply widget preferences
        this.applyWidgetPreferences(userPrefs.widgets);
        
        // Apply accessibility preferences
        this.applyAccessibilityPreferences(userPrefs.accessibility);
        
        console.log('All preferences applied');
    }

    /**
     * Apply specific preference
     */
    applyPreference(path, value) {
        const [category, setting] = path.split('.');
        
        switch (category) {
            case 'theme':
                this.applyThemeSetting(setting, value);
                break;
            case 'layout':
                this.applyLayoutSetting(setting, value);
                break;
            case 'widgets':
                this.applyWidgetSetting(setting, value);
                break;
            case 'accessibility':
                this.applyAccessibilitySetting(setting, value);
                break;
        }
    }

    /**
     * Apply theme preferences
     */
    applyThemePreferences(themePrefs) {
        // Color scheme
        this.setColorScheme(themePrefs.colorScheme);
        
        // Primary color
        this.setPrimaryColor(themePrefs.primaryColor);
        
        // Font size
        this.setFontSize(themePrefs.fontSize);
        
        // Animations
        this.setAnimations(themePrefs.animations);
    }

    /**
     * Apply layout preferences
     */
    applyLayoutPreferences(layoutPrefs) {
        // Grid size
        if (this.dashboardController.customizer) {
            this.dashboardController.customizer.gridSize = layoutPrefs.gridSize;
        }
        
        // Compact mode
        document.body.classList.toggle('compact-mode', layoutPrefs.compactMode);
        
        // Sidebar state
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) {
            sidebar.classList.toggle('collapsed', layoutPrefs.sidebarCollapsed);
        }
    }

    /**
     * Apply widget preferences
     */
    applyWidgetPreferences(widgetPrefs) {
        // Set default refresh interval for new widgets
        if (this.dashboardController.widgetManager) {
            this.dashboardController.widgetManager.defaultRefreshInterval = widgetPrefs.defaultRefreshInterval;
        }
        
        // Apply to existing widgets
        const widgets = document.querySelectorAll('.dashboard-widget');
        widgets.forEach(widget => {
            if (widgetPrefs.showTooltips) {
                widget.setAttribute('data-bs-toggle', 'tooltip');
            }
        });
    }

    /**
     * Apply accessibility preferences
     */
    applyAccessibilityPreferences(accessibilityPrefs) {
        document.body.classList.toggle('high-contrast', accessibilityPrefs.highContrast);
        document.body.classList.toggle('large-text', accessibilityPrefs.largeText);
        document.body.classList.toggle('keyboard-navigation', accessibilityPrefs.keyboardNavigation);
        document.body.classList.toggle('screen-reader', accessibilityPrefs.screenReader);
    }

    /**
     * Set color scheme
     */
    setColorScheme(scheme) {
        document.body.classList.remove('theme-light', 'theme-dark');
        
        if (scheme === 'auto') {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            scheme = prefersDark ? 'dark' : 'light';
        }
        
        document.body.classList.add(`theme-${scheme}`);
    }

    /**
     * Set primary color
     */
    setPrimaryColor(color) {
        document.documentElement.style.setProperty('--primary-color', color);
    }

    /**
     * Set font size
     */
    setFontSize(size) {
        document.body.classList.remove('font-small', 'font-medium', 'font-large');
        document.body.classList.add(`font-${size}`);
    }

    /**
     * Set animations
     */
    setAnimations(enabled) {
        document.body.classList.toggle('no-animations', !enabled);
    }

    /**
     * Apply individual theme setting
     */
    applyThemeSetting(setting, value) {
        switch (setting) {
            case 'colorScheme':
                this.setColorScheme(value);
                break;
            case 'primaryColor':
                this.setPrimaryColor(value);
                break;
            case 'fontSize':
                this.setFontSize(value);
                break;
            case 'animations':
                this.setAnimations(value);
                break;
        }
    }

    /**
     * Apply individual layout setting
     */
    applyLayoutSetting(setting, value) {
        switch (setting) {
            case 'compactMode':
                document.body.classList.toggle('compact-mode', value);
                break;
            case 'sidebarCollapsed':
                const sidebar = document.querySelector('.sidebar');
                if (sidebar) {
                    sidebar.classList.toggle('collapsed', value);
                }
                break;
        }
    }

    /**
     * Apply individual widget setting
     */
    applyWidgetSetting(setting, value) {
        // Implementation depends on widget manager
        console.log(`Widget setting applied: ${setting} = ${value}`);
    }

    /**
     * Apply individual accessibility setting
     */
    applyAccessibilitySetting(setting, value) {
        switch (setting) {
            case 'highContrast':
                document.body.classList.toggle('high-contrast', value);
                break;
            case 'largeText':
                document.body.classList.toggle('large-text', value);
                break;
            case 'keyboardNavigation':
                document.body.classList.toggle('keyboard-navigation', value);
                break;
            case 'screenReader':
                document.body.classList.toggle('screen-reader', value);
                break;
        }
    }

    /**
     * Create preferences interface
     */
    createPreferencesInterface() {
        const button = document.createElement('button');
        button.id = 'preferences-btn';
        button.className = 'btn btn-outline-secondary btn-sm';
        button.innerHTML = '<i class="fas fa-cog"></i> Preferences';
        button.onclick = () => this.showPreferencesModal();
        
        // Add to dashboard if container exists
        const container = document.querySelector('.dashboard-header, .navbar, .toolbar-section');
        if (container) {
            container.appendChild(button);
        }
    }

    /**
     * Show preferences modal
     */
    showPreferencesModal() {
        const modal = this.createPreferencesModal();
        document.body.appendChild(modal);
        
        // Show modal
        setTimeout(() => modal.classList.add('show'), 10);
    }

    /**
     * Create preferences modal
     */
    createPreferencesModal() {
        const userPrefs = this.preferences.get(this.currentUser.id);
        
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'preferences-modal';
        modal.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Dashboard Preferences</h5>
                        <button type="button" class="btn-close" onclick="this.closest('.modal').remove()"></button>
                    </div>
                    <div class="modal-body">
                        <div class="preferences-tabs">
                            <ul class="nav nav-tabs" role="tablist">
                                <li class="nav-item">
                                    <a class="nav-link active" data-bs-toggle="tab" href="#theme-tab">Theme</a>
                                </li>
                                <li class="nav-item">
                                    <a class="nav-link" data-bs-toggle="tab" href="#layout-tab">Layout</a>
                                </li>
                                <li class="nav-item">
                                    <a class="nav-link" data-bs-toggle="tab" href="#widgets-tab">Widgets</a>
                                </li>
                                <li class="nav-item">
                                    <a class="nav-link" data-bs-toggle="tab" href="#accessibility-tab">Accessibility</a>
                                </li>
                            </ul>
                            
                            <div class="tab-content mt-3">
                                <!-- Theme Tab -->
                                <div class="tab-pane fade show active" id="theme-tab">
                                    <div class="row">
                                        <div class="col-md-6">
                                            <div class="mb-3">
                                                <label class="form-label">Color Scheme</label>
                                                <select class="form-select" data-preference="theme.colorScheme">
                                                    <option value="light" ${userPrefs.theme.colorScheme === 'light' ? 'selected' : ''}>Light</option>
                                                    <option value="dark" ${userPrefs.theme.colorScheme === 'dark' ? 'selected' : ''}>Dark</option>
                                                    <option value="auto" ${userPrefs.theme.colorScheme === 'auto' ? 'selected' : ''}>Auto</option>
                                                </select>
                                            </div>
                                            <div class="mb-3">
                                                <label class="form-label">Primary Color</label>
                                                <input type="color" class="form-control form-control-color" 
                                                       data-preference="theme.primaryColor" 
                                                       value="${userPrefs.theme.primaryColor}">
                                            </div>
                                        </div>
                                        <div class="col-md-6">
                                            <div class="mb-3">
                                                <label class="form-label">Font Size</label>
                                                <select class="form-select" data-preference="theme.fontSize">
                                                    <option value="small" ${userPrefs.theme.fontSize === 'small' ? 'selected' : ''}>Small</option>
                                                    <option value="medium" ${userPrefs.theme.fontSize === 'medium' ? 'selected' : ''}>Medium</option>
                                                    <option value="large" ${userPrefs.theme.fontSize === 'large' ? 'selected' : ''}>Large</option>
                                                </select>
                                            </div>
                                            <div class="mb-3">
                                                <div class="form-check">
                                                    <input class="form-check-input" type="checkbox" 
                                                           data-preference="theme.animations" 
                                                           ${userPrefs.theme.animations ? 'checked' : ''}>
                                                    <label class="form-check-label">Enable Animations</label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Layout Tab -->
                                <div class="tab-pane fade" id="layout-tab">
                                    <div class="row">
                                        <div class="col-md-6">
                                            <div class="mb-3">
                                                <label class="form-label">Grid Size</label>
                                                <input type="range" class="form-range" min="10" max="50" 
                                                       data-preference="layout.gridSize" 
                                                       value="${userPrefs.layout.gridSize}">
                                                <div class="form-text">Current: ${userPrefs.layout.gridSize}px</div>
                                            </div>
                                            <div class="mb-3">
                                                <div class="form-check">
                                                    <input class="form-check-input" type="checkbox" 
                                                           data-preference="layout.snapToGrid" 
                                                           ${userPrefs.layout.snapToGrid ? 'checked' : ''}>
                                                    <label class="form-check-label">Snap to Grid</label>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-md-6">
                                            <div class="mb-3">
                                                <div class="form-check">
                                                    <input class="form-check-input" type="checkbox" 
                                                           data-preference="layout.compactMode" 
                                                           ${userPrefs.layout.compactMode ? 'checked' : ''}>
                                                    <label class="form-check-label">Compact Mode</label>
                                                </div>
                                            </div>
                                            <div class="mb-3">
                                                <div class="form-check">
                                                    <input class="form-check-input" type="checkbox" 
                                                           data-preference="layout.sidebarCollapsed" 
                                                           ${userPrefs.layout.sidebarCollapsed ? 'checked' : ''}>
                                                    <label class="form-check-label">Collapse Sidebar</label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Widgets Tab -->
                                <div class="tab-pane fade" id="widgets-tab">
                                    <div class="row">
                                        <div class="col-md-6">
                                            <div class="mb-3">
                                                <label class="form-label">Default Refresh Interval</label>
                                                <select class="form-select" data-preference="widgets.defaultRefreshInterval">
                                                    <option value="60000" ${userPrefs.widgets.defaultRefreshInterval === 60000 ? 'selected' : ''}>1 minute</option>
                                                    <option value="300000" ${userPrefs.widgets.defaultRefreshInterval === 300000 ? 'selected' : ''}>5 minutes</option>
                                                    <option value="600000" ${userPrefs.widgets.defaultRefreshInterval === 600000 ? 'selected' : ''}>10 minutes</option>
                                                    <option value="1800000" ${userPrefs.widgets.defaultRefreshInterval === 1800000 ? 'selected' : ''}>30 minutes</option>
                                                </select>
                                            </div>
                                            <div class="mb-3">
                                                <div class="form-check">
                                                    <input class="form-check-input" type="checkbox" 
                                                           data-preference="widgets.autoRefresh" 
                                                           ${userPrefs.widgets.autoRefresh ? 'checked' : ''}>
                                                    <label class="form-check-label">Auto Refresh</label>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-md-6">
                                            <div class="mb-3">
                                                <div class="form-check">
                                                    <input class="form-check-input" type="checkbox" 
                                                           data-preference="widgets.showTooltips" 
                                                           ${userPrefs.widgets.showTooltips ? 'checked' : ''}>
                                                    <label class="form-check-label">Show Tooltips</label>
                                                </div>
                                            </div>
                                            <div class="mb-3">
                                                <div class="form-check">
                                                    <input class="form-check-input" type="checkbox" 
                                                           data-preference="widgets.chartAnimations" 
                                                           ${userPrefs.widgets.chartAnimations ? 'checked' : ''}>
                                                    <label class="form-check-label">Chart Animations</label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Accessibility Tab -->
                                <div class="tab-pane fade" id="accessibility-tab">
                                    <div class="row">
                                        <div class="col-md-6">
                                            <div class="mb-3">
                                                <div class="form-check">
                                                    <input class="form-check-input" type="checkbox" 
                                                           data-preference="accessibility.highContrast" 
                                                           ${userPrefs.accessibility.highContrast ? 'checked' : ''}>
                                                    <label class="form-check-label">High Contrast</label>
                                                </div>
                                            </div>
                                            <div class="mb-3">
                                                <div class="form-check">
                                                    <input class="form-check-input" type="checkbox" 
                                                           data-preference="accessibility.largeText" 
                                                           ${userPrefs.accessibility.largeText ? 'checked' : ''}>
                                                    <label class="form-check-label">Large Text</label>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-md-6">
                                            <div class="mb-3">
                                                <div class="form-check">
                                                    <input class="form-check-input" type="checkbox" 
                                                           data-preference="accessibility.keyboardNavigation" 
                                                           ${userPrefs.accessibility.keyboardNavigation ? 'checked' : ''}>
                                                    <label class="form-check-label">Keyboard Navigation</label>
                                                </div>
                                            </div>
                                            <div class="mb-3">
                                                <div class="form-check">
                                                    <input class="form-check-input" type="checkbox" 
                                                           data-preference="accessibility.screenReader" 
                                                           ${userPrefs.accessibility.screenReader ? 'checked' : ''}>
                                                    <label class="form-check-label">Screen Reader Support</label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">Cancel</button>
                        <button type="button" class="btn btn-warning" id="reset-preferences">Reset to Default</button>
                        <button type="button" class="btn btn-primary" id="save-preferences">Save Changes</button>
                    </div>
                </div>
            </div>
        `;

        // Add event listeners
        this.addPreferencesEventListeners(modal);

        return modal;
    }

    /**
     * Add event listeners to preferences modal
     */
    addPreferencesEventListeners(modal) {
        // Handle preference changes
        modal.addEventListener('change', (e) => {
            const element = e.target;
            const preference = element.dataset.preference;
            
            if (preference) {
                let value;
                
                if (element.type === 'checkbox') {
                    value = element.checked;
                } else if (element.type === 'range') {
                    value = parseInt(element.value);
                    // Update range display
                    const display = element.nextElementSibling;
                    if (display) {
                        display.textContent = `Current: ${value}px`;
                    }
                } else {
                    value = element.value;
                }
                
                // Apply immediately for preview
                this.setPreference(preference, value);
            }
        });

        // Save button
        modal.addEventListener('click', (e) => {
            if (e.target.id === 'save-preferences') {
                modal.remove();
                this.showNotification('Preferences saved successfully!', 'success');
            }
            
            if (e.target.id === 'reset-preferences') {
                if (confirm('Reset all preferences to default values?')) {
                    this.resetPreferences();
                    modal.remove();
                    this.showPreferencesModal(); // Reopen with default values
                }
            }
        });

        // Tab switching (simple implementation)
        modal.addEventListener('click', (e) => {
            if (e.target.classList.contains('nav-link')) {
                e.preventDefault();
                
                // Remove active from all tabs and panes
                modal.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
                modal.querySelectorAll('.tab-pane').forEach(pane => {
                    pane.classList.remove('show', 'active');
                });
                
                // Add active to clicked tab
                e.target.classList.add('active');
                
                // Show corresponding pane
                const targetId = e.target.getAttribute('href').substring(1);
                const targetPane = modal.querySelector(`#${targetId}`);
                if (targetPane) {
                    targetPane.classList.add('show', 'active');
                }
            }
        });
    }

    /**
     * Reset preferences to default
     */
    resetPreferences() {
        const userId = this.currentUser.id;
        this.preferences.set(userId, { ...this.defaultPreferences });
        this.savePreferences();
        this.applyPreferences();
        
        console.log('Preferences reset to default');
        this.showNotification('Preferences reset to default', 'info');
    }

    /**
     * Export preferences
     */
    exportPreferences() {
        const userId = this.currentUser.id;
        const userPrefs = this.preferences.get(userId);
        
        const exportData = {
            user: this.currentUser,
            preferences: userPrefs,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `dashboard-preferences-${userId}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
    }

    /**
     * Import preferences
     */
    importPreferences(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importData = JSON.parse(e.target.result);
                
                if (importData.preferences) {
                    const userId = this.currentUser.id;
                    const mergedPrefs = this.mergePreferences(this.defaultPreferences, importData.preferences);
                    
                    this.preferences.set(userId, mergedPrefs);
                    this.savePreferences();
                    this.applyPreferences();
                    
                    this.showNotification('Preferences imported successfully!', 'success');
                } else {
                    throw new Error('Invalid preferences file format');
                }
            } catch (error) {
                console.error('Error importing preferences:', error);
                this.showNotification('Error importing preferences', 'error');
            }
        };
        
        reader.readAsText(file);
    }

    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span>${message}</span>
                <button class="notification-close">&times;</button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
        
        // Manual close
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.remove();
        });
    }

    /**
     * Get all user preferences
     */
    getAllPreferences() {
        const userId = this.currentUser.id;
        return this.preferences.get(userId) || this.defaultPreferences;
    }

    /**
     * Set multiple preferences at once
     */
    setMultiplePreferences(preferencesObj) {
        for (const [path, value] of Object.entries(preferencesObj)) {
            this.setPreference(path, value);
        }
    }

    /**
     * Cleanup
     */
    destroy() {
        // Remove preferences button
        const button = document.getElementById('preferences-btn');
        if (button) {
            button.remove();
        }
        
        // Remove any open modals
        const modal = document.getElementById('preferences-modal');
        if (modal) {
            modal.remove();
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UserPreferencesManager;
}