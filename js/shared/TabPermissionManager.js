/**
 * Tab Permission Manager
 * Manages role-based access control for integrated payment tabs
 * Requirements: 8.1, 8.2 - Role-based access control for tabs
 */

/**
 * Tab Permission Manager Class
 * Handles tab-level permissions and access control
 */
class TabPermissionManager {
    constructor() {
        this.currentUser = this._initializeUserContext();
        this.permissionConfig = this._getPermissionConfiguration();
        this.auditLogger = null;
        this.securityAuditLogger = null;
        
        // Initialize audit logger if available
        this._initializeAuditLogger();
        
        // Initialize security audit logger
        this._initializeSecurityAuditLogger();
    }

    /**
     * Check if user has permission to access a specific tab
     * Requirements: 8.1, 8.2
     * @param {string} tabId - Tab identifier ('manual' or 'import')
     * @param {Object} user - User object (optional, uses current user if not provided)
     * @returns {boolean} True if user has access
     */
    hasTabAccess(tabId, user = null) {
        try {
            const targetUser = user || this.currentUser;
            
            if (!targetUser) {
                this._logAccessAttempt(tabId, 'NO_USER', 'denied');
                return false;
            }

            // Check if user is active
            if (targetUser.active === false) {
                this._logAccessAttempt(tabId, 'USER_INACTIVE', 'denied', targetUser);
                return false;
            }

            const userRole = targetUser.role;
            const tabPermissions = this.permissionConfig.tabs[tabId];

            if (!tabPermissions) {
                this._logAccessAttempt(tabId, 'INVALID_TAB', 'denied', targetUser);
                return false;
            }

            // Check if user role is allowed for this tab
            const hasAccess = tabPermissions.allowedRoles.includes(userRole);
            
            // Log access attempt
            this._logAccessAttempt(tabId, hasAccess ? 'PERMISSION_GRANTED' : 'PERMISSION_DENIED', 
                                 hasAccess ? 'granted' : 'denied', targetUser);
            
            return hasAccess;
            
        } catch (error) {
            console.error('Error checking tab access:', error);
            this._logAccessAttempt(tabId, 'ERROR', 'denied', user);
            return false;
        }
    }

    /**
     * Get available tabs for current user
     * Requirements: 8.1, 8.2
     * @param {Object} user - User object (optional, uses current user if not provided)
     * @returns {Array} Array of available tab objects
     */
    getAvailableTabs(user = null) {
        try {
            const targetUser = user || this.currentUser;
            
            if (!targetUser) {
                return [];
            }

            const availableTabs = [];
            
            Object.keys(this.permissionConfig.tabs).forEach(tabId => {
                if (this.hasTabAccess(tabId, targetUser)) {
                    const tabConfig = this.permissionConfig.tabs[tabId];
                    availableTabs.push({
                        id: tabId,
                        name: tabConfig.name,
                        icon: tabConfig.icon,
                        description: tabConfig.description,
                        accessLevel: this._getAccessLevel(tabId, targetUser)
                    });
                }
            });

            return availableTabs;
            
        } catch (error) {
            console.error('Error getting available tabs:', error);
            return [];
        }
    }

    /**
     * Check tab access and redirect if denied
     * Requirements: 8.1, 8.2
     * @param {string} tabId - Tab identifier
     * @param {Function} onDenied - Callback function when access is denied
     * @returns {boolean} True if access granted
     */
    checkTabAccessOrDeny(tabId, onDenied = null) {
        const hasAccess = this.hasTabAccess(tabId);
        
        if (!hasAccess) {
            // Log permission violation
            this._logPermissionViolation(tabId, 'TAB_ACCESS_DENIED');
            
            // Call denial callback if provided
            if (typeof onDenied === 'function') {
                onDenied(tabId, this.currentUser);
            } else {
                // Default denial handling
                this._handleAccessDenied(tabId);
            }
        }
        
        return hasAccess;
    }

    /**
     * Validate tab switch permission
     * Requirements: 8.1, 8.2
     * @param {string} fromTab - Current tab
     * @param {string} toTab - Target tab
     * @returns {Object} Validation result
     */
    validateTabSwitch(fromTab, toTab) {
        try {
            const result = {
                allowed: false,
                reason: '',
                fromTabAccess: this.hasTabAccess(fromTab),
                toTabAccess: this.hasTabAccess(toTab)
            };

            // Check if user has access to target tab
            if (!result.toTabAccess) {
                result.reason = 'ACCESS_DENIED_TARGET_TAB';
                this._logPermissionViolation(toTab, 'TAB_SWITCH_DENIED');
                return result;
            }

            // Check if user has permission to leave current tab (if applicable)
            if (fromTab && !result.fromTabAccess) {
                result.reason = 'ACCESS_DENIED_SOURCE_TAB';
                return result;
            }

            // Additional business logic checks can be added here
            // For example, checking if user has unsaved data permissions, etc.

            result.allowed = true;
            result.reason = 'ACCESS_GRANTED';
            
            // Log successful tab switch validation
            this._logTabSwitchValidation(fromTab, toTab, 'granted');
            
            return result;
            
        } catch (error) {
            console.error('Error validating tab switch:', error);
            return {
                allowed: false,
                reason: 'VALIDATION_ERROR',
                error: error.message
            };
        }
    }

    /**
     * Get user's access level for a specific tab
     * Requirements: 8.1, 8.2
     * @param {string} tabId - Tab identifier
     * @param {Object} user - User object (optional)
     * @returns {string} Access level ('full', 'limited', 'none')
     */
    getTabAccessLevel(tabId, user = null) {
        try {
            const targetUser = user || this.currentUser;
            
            if (!this.hasTabAccess(tabId, targetUser)) {
                return 'none';
            }

            return this._getAccessLevel(tabId, targetUser);
            
        } catch (error) {
            console.error('Error getting tab access level:', error);
            return 'none';
        }
    }

    /**
     * Update user context (call when user changes)
     * @param {Object} user - New user object
     */
    updateUserContext(user) {
        this.currentUser = user;
        
        // Log user context update
        if (this.auditLogger) {
            this.auditLogger.logAccessAttempt('USER_CONTEXT_UPDATE', {
                userId: user?.id,
                userName: user?.name,
                userRole: user?.role
            }, 'granted');
        }
    }

    /**
     * Get permission configuration for debugging
     * @returns {Object} Permission configuration
     */
    getPermissionConfig() {
        return this.permissionConfig;
    }

    // ===== PRIVATE HELPER METHODS =====

    /**
     * Initialize user context
     * @private
     */
    _initializeUserContext() {
        if (typeof localStorage !== 'undefined') {
            try {
                const currentUser = localStorage.getItem('currentUser');
                if (currentUser) {
                    return JSON.parse(currentUser);
                }
            } catch (error) {
                console.warn('Failed to initialize user context:', error);
            }
        }
        return null;
    }

    /**
     * Initialize audit logger
     * @private
     */
    _initializeAuditLogger() {
        try {
            // Try to get enhanced audit logger
            if (typeof window !== 'undefined' && window._enhancedAuditLogger) {
                this.auditLogger = window._enhancedAuditLogger;
            } else if (typeof window !== 'undefined' && window.EnhancedAuditLogger) {
                this.auditLogger = new window.EnhancedAuditLogger();
            }
        } catch (error) {
            console.warn('Failed to initialize audit logger:', error);
        }
    }

    /**
     * Initialize security audit logger
     * Requirements: 8.3, 8.4
     * @private
     */
    _initializeSecurityAuditLogger() {
        try {
            // Try to get security audit logger
            if (typeof window !== 'undefined' && window._securityAuditLogger) {
                this.securityAuditLogger = window._securityAuditLogger;
            } else if (typeof window !== 'undefined' && window.SecurityAuditLogger) {
                this.securityAuditLogger = new window.SecurityAuditLogger();
            }
        } catch (error) {
            console.warn('Failed to initialize security audit logger:', error);
        }
    }

    /**
     * Get permission configuration
     * @private
     */
    _getPermissionConfiguration() {
        return {
            tabs: {
                manual: {
                    name: 'Pembayaran Manual',
                    icon: 'bi-person',
                    description: 'Pembayaran hutang/piutang secara manual (satuan)',
                    allowedRoles: ['super_admin', 'administrator', 'kasir'],
                    accessLevels: {
                        'super_admin': 'full',
                        'administrator': 'full', 
                        'kasir': 'full'
                    },
                    requiredPermissions: ['payment.manual.access']
                },
                import: {
                    name: 'Import Batch',
                    icon: 'bi-upload',
                    description: 'Import pembayaran hutang/piutang secara batch (massal)',
                    allowedRoles: ['super_admin', 'administrator'],
                    accessLevels: {
                        'super_admin': 'full',
                        'administrator': 'full'
                    },
                    requiredPermissions: ['payment.import.access', 'payment.batch.process']
                }
            },
            defaultTab: 'manual',
            fallbackBehavior: 'redirect_to_available'
        };
    }

    /**
     * Get access level for user and tab
     * @private
     */
    _getAccessLevel(tabId, user) {
        const tabConfig = this.permissionConfig.tabs[tabId];
        if (!tabConfig || !user) {
            return 'none';
        }

        return tabConfig.accessLevels[user.role] || 'none';
    }

    /**
     * Log access attempt
     * Requirements: 8.3, 8.4
     * @private
     */
    _logAccessAttempt(tabId, reason, result, user = null) {
        try {
            const targetUser = user || this.currentUser;
            
            // Log to enhanced audit logger
            if (this.auditLogger) {
                this.auditLogger.logAccessAttempt('TAB_ACCESS_CHECK', {
                    tabId,
                    reason,
                    userId: targetUser?.id,
                    userName: targetUser?.name,
                    userRole: targetUser?.role,
                    userActive: targetUser?.active,
                    timestamp: new Date().toISOString()
                }, result);
            }
            
            // Log to security audit logger with enhanced context
            if (this.securityAuditLogger) {
                this.securityAuditLogger.logTabAccessAttempt(tabId, result, {
                    reason,
                    userId: targetUser?.id,
                    userName: targetUser?.name,
                    userRole: targetUser?.role,
                    userActive: targetUser?.active,
                    requestedPermissions: this._getRequiredPermissions(tabId),
                    userPermissions: this._getUserPermissions(targetUser)
                });
            }
            
            // Also log to console for debugging
            console.log(`Tab access check: ${tabId} - ${reason} - ${result}`, {
                user: targetUser?.name,
                role: targetUser?.role
            });
            
        } catch (error) {
            console.error('Error logging access attempt:', error);
        }
    }

    /**
     * Log permission violation
     * Requirements: 8.3, 8.4
     * @private
     */
    _logPermissionViolation(tabId, violationType) {
        try {
            // Log to enhanced audit logger
            if (this.auditLogger) {
                this.auditLogger.logAccessAttempt('PERMISSION_VIOLATION', {
                    tabId,
                    violationType,
                    userId: this.currentUser?.id,
                    userName: this.currentUser?.name,
                    userRole: this.currentUser?.role,
                    severity: 'medium',
                    timestamp: new Date().toISOString()
                }, 'denied');
            }
            
            // Log to security audit logger with detailed context
            if (this.securityAuditLogger) {
                this.securityAuditLogger.logPermissionViolation(violationType, {
                    tabId,
                    userId: this.currentUser?.id,
                    userName: this.currentUser?.name,
                    userRole: this.currentUser?.role,
                    userActive: this.currentUser?.active,
                    attemptedAction: 'tab_access',
                    requiredPermissions: this._getRequiredPermissions(tabId),
                    userPermissions: this._getUserPermissions(this.currentUser),
                    violationContext: {
                        interface: 'integrated-payment',
                        feature: 'tab-navigation'
                    }
                });
            }
            
            // Log to console for immediate visibility
            console.warn(`Permission violation: ${violationType} for tab ${tabId}`, {
                user: this.currentUser?.name,
                role: this.currentUser?.role
            });
            
        } catch (error) {
            console.error('Error logging permission violation:', error);
        }
    }

    /**
     * Log tab switch validation
     * Requirements: 8.3, 8.4
     * @private
     */
    _logTabSwitchValidation(fromTab, toTab, result) {
        try {
            // Log to enhanced audit logger
            if (this.auditLogger) {
                this.auditLogger.logAccessAttempt('TAB_SWITCH_VALIDATION', {
                    fromTab,
                    toTab,
                    userId: this.currentUser?.id,
                    userName: this.currentUser?.name,
                    userRole: this.currentUser?.role,
                    timestamp: new Date().toISOString()
                }, result);
            }
            
            // Log to security audit logger with navigation context
            if (this.securityAuditLogger) {
                this.securityAuditLogger.logTabSwitchAttempt(fromTab, toTab, result, {
                    userId: this.currentUser?.id,
                    userName: this.currentUser?.name,
                    userRole: this.currentUser?.role,
                    fromTabPermissions: this._getRequiredPermissions(fromTab),
                    toTabPermissions: this._getRequiredPermissions(toTab),
                    userPermissions: this._getUserPermissions(this.currentUser),
                    navigationContext: {
                        interface: 'integrated-payment',
                        feature: 'tab-switching'
                    }
                });
            }
        } catch (error) {
            console.error('Error logging tab switch validation:', error);
        }
    }

    /**
     * Handle access denied
     * @private
     */
    _handleAccessDenied(tabId) {
        try {
            // Show user-friendly error message
            const tabConfig = this.permissionConfig.tabs[tabId];
            const tabName = tabConfig ? tabConfig.name : tabId;
            
            if (typeof showAlert === 'function') {
                showAlert(
                    `Akses Ditolak: Anda tidak memiliki izin untuk mengakses ${tabName}. ` +
                    `Hubungi administrator jika Anda memerlukan akses ini.`,
                    'warning'
                );
            } else {
                alert(`Akses ditolak untuk ${tabName}`);
            }
            
            // Redirect to available tab if possible
            this._redirectToAvailableTab();
            
        } catch (error) {
            console.error('Error handling access denied:', error);
        }
    }

    /**
     * Redirect to available tab
     * @private
     */
    _redirectToAvailableTab() {
        try {
            const availableTabs = this.getAvailableTabs();
            
            if (availableTabs.length > 0) {
                // Redirect to first available tab
                const firstTab = availableTabs[0];
                
                // Use integrated controller if available
                if (typeof window.pembayaranIntegrated !== 'undefined' && 
                    typeof window.pembayaranIntegrated.switchTab === 'function') {
                    window.pembayaranIntegrated.switchTab(firstTab.id);
                } else {
                    console.log(`Would redirect to available tab: ${firstTab.id}`);
                }
            } else {
                // No tabs available - redirect to dashboard or show error
                if (typeof navigateTo === 'function') {
                    navigateTo('dashboard');
                } else {
                    console.warn('No tabs available for user and no navigation function found');
                }
            }
            
        } catch (error) {
            console.error('Error redirecting to available tab:', error);
        }
    }

    /**
     * Get required permissions for a tab
     * Requirements: 8.3, 8.4
     * @private
     * @param {string} tabId - Tab identifier
     * @returns {Array} Required permissions
     */
    _getRequiredPermissions(tabId) {
        const tabConfig = this.permissionConfig.tabs[tabId];
        return tabConfig ? tabConfig.requiredPermissions || [] : [];
    }

    /**
     * Get user permissions based on role
     * Requirements: 8.3, 8.4
     * @private
     * @param {Object} user - User object
     * @returns {Array} User permissions
     */
    _getUserPermissions(user) {
        if (!user) return [];
        
        // Map roles to permissions
        const rolePermissions = {
            'super_admin': [
                'payment.manual.access',
                'payment.import.access',
                'payment.batch.process',
                'admin.all.access'
            ],
            'administrator': [
                'payment.manual.access',
                'payment.import.access',
                'payment.batch.process'
            ],
            'kasir': [
                'payment.manual.access'
            ],
            'keuangan': [
                'payment.manual.access'
            ]
        };
        
        return rolePermissions[user.role] || [];
    }
}

/**
 * Global permission checking functions for backward compatibility
 */

/**
 * Check if current user has access to a specific tab
 * Requirements: 8.1, 8.2
 * @param {string} tabId - Tab identifier
 * @returns {boolean} True if user has access
 */
function hasTabPermission(tabId) {
    if (!window._tabPermissionManager) {
        window._tabPermissionManager = new TabPermissionManager();
    }
    
    return window._tabPermissionManager.hasTabAccess(tabId);
}

/**
 * Check tab access or show denial message
 * Requirements: 8.1, 8.2
 * @param {string} tabId - Tab identifier
 * @param {Function} onDenied - Optional callback for denial handling
 * @returns {boolean} True if access granted
 */
function checkTabAccessOrDeny(tabId, onDenied = null) {
    if (!window._tabPermissionManager) {
        window._tabPermissionManager = new TabPermissionManager();
    }
    
    return window._tabPermissionManager.checkTabAccessOrDeny(tabId, onDenied);
}

/**
 * Get available tabs for current user
 * Requirements: 8.1, 8.2
 * @returns {Array} Array of available tab objects
 */
function getAvailableTabsForUser() {
    if (!window._tabPermissionManager) {
        window._tabPermissionManager = new TabPermissionManager();
    }
    
    return window._tabPermissionManager.getAvailableTabs();
}

/**
 * Update user context in permission manager
 * @param {Object} user - User object
 */
function updateTabPermissionUserContext(user) {
    if (!window._tabPermissionManager) {
        window._tabPermissionManager = new TabPermissionManager();
    }
    
    window._tabPermissionManager.updateUserContext(user);
}

// Initialize global permission manager
if (typeof window !== 'undefined') {
    // Export classes and functions
    window.TabPermissionManager = TabPermissionManager;
    window.hasTabPermission = hasTabPermission;
    window.checkTabAccessOrDeny = checkTabAccessOrDeny;
    window.getAvailableTabsForUser = getAvailableTabsForUser;
    window.updateTabPermissionUserContext = updateTabPermissionUserContext;
    
    // Create global permission manager instance
    window._tabPermissionManager = new TabPermissionManager();
    
    // Listen for user context changes
    if (typeof addEventListener === 'function') {
        addEventListener('storage', function(e) {
            if (e.key === 'currentUser') {
                try {
                    const newUser = e.newValue ? JSON.parse(e.newValue) : null;
                    updateTabPermissionUserContext(newUser);
                } catch (error) {
                    console.warn('Failed to update user context from storage event:', error);
                }
            }
        });
    }
}

// ES6 export for modern environments
export { TabPermissionManager, hasTabPermission, checkTabAccessOrDeny, getAvailableTabsForUser };

// CommonJS export for compatibility
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
        TabPermissionManager, 
        hasTabPermission, 
        checkTabAccessOrDeny, 
        getAvailableTabsForUser 
    };
}