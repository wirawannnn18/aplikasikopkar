/**
 * Security Audit Logger
 * Enhanced audit logging specifically for security events and access control
 * Requirements: 8.3, 8.4 - Enhanced audit logging for security
 */

/**
 * Security Audit Logger Class
 * Specialized audit logger for security-related events
 */
class SecurityAuditLogger {
    constructor() {
        this.currentUser = this._initializeUserContext();
        this.sessionId = this._generateSessionId();
        this.enhancedAuditLogger = null;
        
        // Initialize enhanced audit logger if available
        this._initializeEnhancedAuditLogger();
        
        // Security event types
        this.securityEventTypes = {
            TAB_ACCESS_ATTEMPT: 'TAB_ACCESS_ATTEMPT',
            TAB_ACCESS_GRANTED: 'TAB_ACCESS_GRANTED', 
            TAB_ACCESS_DENIED: 'TAB_ACCESS_DENIED',
            TAB_SWITCH_ATTEMPT: 'TAB_SWITCH_ATTEMPT',
            TAB_SWITCH_SUCCESS: 'TAB_SWITCH_SUCCESS',
            TAB_SWITCH_DENIED: 'TAB_SWITCH_DENIED',
            PERMISSION_VIOLATION: 'PERMISSION_VIOLATION',
            SESSION_START: 'SESSION_START',
            SESSION_END: 'SESSION_END',
            USER_CONTEXT_CHANGE: 'USER_CONTEXT_CHANGE',
            SECURITY_ALERT: 'SECURITY_ALERT',
            SUSPICIOUS_ACTIVITY: 'SUSPICIOUS_ACTIVITY'
        };
        
        // Risk levels
        this.riskLevels = {
            LOW: 'low',
            MEDIUM: 'medium',
            HIGH: 'high',
            CRITICAL: 'critical'
        };
        
        // Initialize session tracking
        this._initializeSessionTracking();
    }

    /**
     * Log tab access attempts with detailed security context
     * Requirements: 8.3, 8.4
     * @param {string} tabId - Tab identifier
     * @param {string} result - Access result ('granted' or 'denied')
     * @param {Object} context - Additional context
     */
    logTabAccessAttempt(tabId, result, context = {}) {
        try {
            const eventType = result === 'granted' 
                ? this.securityEventTypes.TAB_ACCESS_GRANTED 
                : this.securityEventTypes.TAB_ACCESS_DENIED;
            
            const securityDetails = {
                tabId,
                accessResult: result,
                userInfo: this._getUserSecurityInfo(),
                sessionInfo: this._getSessionInfo(),
                requestInfo: this._getRequestInfo(),
                riskLevel: this._assessRiskLevel(eventType, context),
                context,
                timestamp: new Date().toISOString()
            };
            
            // Log to enhanced audit logger
            if (this.enhancedAuditLogger) {
                this.enhancedAuditLogger.saveAuditLog(
                    eventType,
                    securityDetails,
                    'integrated',
                    'security-access-control'
                );
            }
            
            // Log to security-specific storage
            this._saveSecurityLog(eventType, securityDetails);
            
            // Check for suspicious patterns
            this._checkSuspiciousActivity(eventType, securityDetails);
            
        } catch (error) {
            console.error('Error logging tab access attempt:', error);
            this._fallbackSecurityLog('TAB_ACCESS_LOG_ERROR', { tabId, result, error: error.message });
        }
    }

    /**
     * Log tab switch attempts with security tracking
     * Requirements: 8.3, 8.4
     * @param {string} fromTab - Source tab
     * @param {string} toTab - Target tab
     * @param {string} result - Switch result ('success' or 'denied')
     * @param {Object} context - Additional context
     */
    logTabSwitchAttempt(fromTab, toTab, result, context = {}) {
        try {
            const eventType = result === 'success' 
                ? this.securityEventTypes.TAB_SWITCH_SUCCESS 
                : this.securityEventTypes.TAB_SWITCH_DENIED;
            
            const securityDetails = {
                fromTab,
                toTab,
                switchResult: result,
                userInfo: this._getUserSecurityInfo(),
                sessionInfo: this._getSessionInfo(),
                navigationPattern: this._getNavigationPattern(fromTab, toTab),
                riskLevel: this._assessRiskLevel(eventType, context),
                context,
                timestamp: new Date().toISOString()
            };
            
            // Log to enhanced audit logger
            if (this.enhancedAuditLogger) {
                this.enhancedAuditLogger.saveAuditLog(
                    eventType,
                    securityDetails,
                    'integrated',
                    'security-navigation'
                );
            }
            
            // Log to security-specific storage
            this._saveSecurityLog(eventType, securityDetails);
            
            // Update navigation tracking
            this._updateNavigationTracking(fromTab, toTab, result);
            
        } catch (error) {
            console.error('Error logging tab switch attempt:', error);
            this._fallbackSecurityLog('TAB_SWITCH_LOG_ERROR', { fromTab, toTab, result, error: error.message });
        }
    }

    /**
     * Log permission violations with detailed context
     * Requirements: 8.3, 8.4
     * @param {string} violationType - Type of violation
     * @param {Object} violationDetails - Violation details
     */
    logPermissionViolation(violationType, violationDetails = {}) {
        try {
            const securityDetails = {
                violationType,
                violationDetails,
                userInfo: this._getUserSecurityInfo(),
                sessionInfo: this._getSessionInfo(),
                requestInfo: this._getRequestInfo(),
                riskLevel: this.riskLevels.MEDIUM, // Permission violations are medium risk by default
                severity: 'warning',
                requiresReview: true,
                timestamp: new Date().toISOString()
            };
            
            // Log to enhanced audit logger
            if (this.enhancedAuditLogger) {
                this.enhancedAuditLogger.saveAuditLog(
                    this.securityEventTypes.PERMISSION_VIOLATION,
                    securityDetails,
                    'integrated',
                    'security-violations'
                );
            }
            
            // Log to security-specific storage
            this._saveSecurityLog(this.securityEventTypes.PERMISSION_VIOLATION, securityDetails);
            
            // Check if this indicates suspicious activity
            this._checkPermissionViolationPattern(violationType, securityDetails);
            
            // Alert administrators for high-risk violations
            if (this._isHighRiskViolation(violationType, violationDetails)) {
                this._alertAdministrators(securityDetails);
            }
            
        } catch (error) {
            console.error('Error logging permission violation:', error);
            this._fallbackSecurityLog('PERMISSION_VIOLATION_LOG_ERROR', { violationType, error: error.message });
        }
    }

    /**
     * Log session tracking events
     * Requirements: 8.3, 8.4
     * @param {string} eventType - Session event type
     * @param {Object} sessionData - Session data
     */
    logSessionEvent(eventType, sessionData = {}) {
        try {
            const securityDetails = {
                sessionEvent: eventType,
                sessionData,
                userInfo: this._getUserSecurityInfo(),
                sessionInfo: this._getSessionInfo(),
                requestInfo: this._getRequestInfo(),
                riskLevel: this._assessSessionRisk(eventType, sessionData),
                timestamp: new Date().toISOString()
            };
            
            // Log to enhanced audit logger
            if (this.enhancedAuditLogger) {
                this.enhancedAuditLogger.saveAuditLog(
                    eventType,
                    securityDetails,
                    'integrated',
                    'security-session'
                );
            }
            
            // Log to security-specific storage
            this._saveSecurityLog(eventType, securityDetails);
            
            // Update session tracking
            this._updateSessionTracking(eventType, sessionData);
            
        } catch (error) {
            console.error('Error logging session event:', error);
            this._fallbackSecurityLog('SESSION_LOG_ERROR', { eventType, error: error.message });
        }
    }

    /**
     * Log suspicious activity detection
     * Requirements: 8.3, 8.4
     * @param {string} activityType - Type of suspicious activity
     * @param {Object} activityDetails - Activity details
     * @param {string} riskLevel - Risk level assessment
     */
    logSuspiciousActivity(activityType, activityDetails, riskLevel = this.riskLevels.MEDIUM) {
        try {
            const securityDetails = {
                activityType,
                activityDetails,
                userInfo: this._getUserSecurityInfo(),
                sessionInfo: this._getSessionInfo(),
                requestInfo: this._getRequestInfo(),
                riskLevel,
                severity: this._mapRiskToSeverity(riskLevel),
                requiresImmedateReview: riskLevel === this.riskLevels.HIGH || riskLevel === this.riskLevels.CRITICAL,
                detectionTimestamp: new Date().toISOString(),
                timestamp: new Date().toISOString()
            };
            
            // Log to enhanced audit logger
            if (this.enhancedAuditLogger) {
                this.enhancedAuditLogger.saveAuditLog(
                    this.securityEventTypes.SUSPICIOUS_ACTIVITY,
                    securityDetails,
                    'integrated',
                    'security-detection'
                );
            }
            
            // Log to security-specific storage
            this._saveSecurityLog(this.securityEventTypes.SUSPICIOUS_ACTIVITY, securityDetails);
            
            // Alert administrators for high-risk activities
            if (riskLevel === this.riskLevels.HIGH || riskLevel === this.riskLevels.CRITICAL) {
                this._alertAdministrators(securityDetails);
            }
            
            // Update threat tracking
            this._updateThreatTracking(activityType, securityDetails);
            
        } catch (error) {
            console.error('Error logging suspicious activity:', error);
            this._fallbackSecurityLog('SUSPICIOUS_ACTIVITY_LOG_ERROR', { activityType, error: error.message });
        }
    }

    /**
     * Get security audit logs with advanced filtering
     * Requirements: 8.3, 8.4
     * @param {Object} filters - Filter options
     * @returns {Array} Filtered security logs
     */
    getSecurityLogs(filters = {}) {
        try {
            const securityLogs = JSON.parse(localStorage.getItem('securityAuditLog') || '[]');
            
            let filteredLogs = securityLogs;
            
            // Filter by event type
            if (filters.eventType) {
                filteredLogs = filteredLogs.filter(log => log.eventType === filters.eventType);
            }
            
            // Filter by risk level
            if (filters.riskLevel) {
                filteredLogs = filteredLogs.filter(log => log.details.riskLevel === filters.riskLevel);
            }
            
            // Filter by user
            if (filters.userId) {
                filteredLogs = filteredLogs.filter(log => 
                    log.details.userInfo?.userId === filters.userId
                );
            }
            
            // Filter by date range
            if (filters.dateFrom) {
                filteredLogs = filteredLogs.filter(log => log.timestamp >= filters.dateFrom);
            }
            
            if (filters.dateTo) {
                filteredLogs = filteredLogs.filter(log => log.timestamp <= filters.dateTo);
            }
            
            // Filter by session
            if (filters.sessionId) {
                filteredLogs = filteredLogs.filter(log => 
                    log.details.sessionInfo?.sessionId === filters.sessionId
                );
            }
            
            // Sort by timestamp descending
            filteredLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            
            return filteredLogs;
            
        } catch (error) {
            console.error('Error getting security logs:', error);
            return [];
        }
    }

    /**
     * Export security logs for analysis
     * Requirements: 8.3, 8.4
     * @param {Object} filters - Filter options
     * @param {string} format - Export format ('json' or 'csv')
     * @returns {string} Exported data
     */
    exportSecurityLogs(filters = {}, format = 'json') {
        try {
            const logs = this.getSecurityLogs(filters);
            
            if (format === 'csv') {
                return this._exportSecurityLogsToCSV(logs);
            } else {
                return JSON.stringify(logs, null, 2);
            }
            
        } catch (error) {
            console.error('Error exporting security logs:', error);
            return '';
        }
    }

    /**
     * Update user context for security tracking
     * @param {Object} user - User object
     */
    updateUserContext(user) {
        const previousUser = this.currentUser;
        this.currentUser = user;
        
        // Log user context change
        this.logSessionEvent(this.securityEventTypes.USER_CONTEXT_CHANGE, {
            previousUser: previousUser ? {
                id: previousUser.id,
                name: previousUser.name,
                role: previousUser.role
            } : null,
            newUser: user ? {
                id: user.id,
                name: user.name,
                role: user.role
            } : null
        });
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
     * Initialize enhanced audit logger
     * @private
     */
    _initializeEnhancedAuditLogger() {
        try {
            if (typeof window !== 'undefined' && window._enhancedAuditLogger) {
                this.enhancedAuditLogger = window._enhancedAuditLogger;
            } else if (typeof window !== 'undefined' && window.EnhancedAuditLogger) {
                this.enhancedAuditLogger = new window.EnhancedAuditLogger();
            }
        } catch (error) {
            console.warn('Failed to initialize enhanced audit logger:', error);
        }
    }

    /**
     * Initialize session tracking
     * @private
     */
    _initializeSessionTracking() {
        try {
            // Log session start
            this.logSessionEvent(this.securityEventTypes.SESSION_START, {
                sessionId: this.sessionId,
                startTime: new Date().toISOString(),
                userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown'
            });
            
            // Setup session end tracking
            if (typeof window !== 'undefined') {
                window.addEventListener('beforeunload', () => {
                    this.logSessionEvent(this.securityEventTypes.SESSION_END, {
                        sessionId: this.sessionId,
                        endTime: new Date().toISOString()
                    });
                });
            }
        } catch (error) {
            console.error('Error initializing session tracking:', error);
        }
    }

    /**
     * Get user security information
     * @private
     */
    _getUserSecurityInfo() {
        if (!this.currentUser) {
            return {
                userId: null,
                userName: 'Anonymous',
                userRole: 'unknown',
                isAuthenticated: false
            };
        }
        
        return {
            userId: this.currentUser.id,
            userName: this.currentUser.name,
            userRole: this.currentUser.role,
            isAuthenticated: true,
            isActive: this.currentUser.active !== false
        };
    }

    /**
     * Get session information
     * @private
     */
    _getSessionInfo() {
        return {
            sessionId: this.sessionId,
            sessionStartTime: this._getSessionStartTime(),
            sessionDuration: this._getSessionDuration()
        };
    }

    /**
     * Get request information
     * @private
     */
    _getRequestInfo() {
        return {
            timestamp: new Date().toISOString(),
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
            url: typeof window !== 'undefined' ? window.location.href : 'Unknown',
            referrer: typeof document !== 'undefined' ? document.referrer : 'Unknown'
        };
    }

    /**
     * Assess risk level for security event
     * @private
     */
    _assessRiskLevel(eventType, context) {
        // Default risk levels for different event types
        const riskMapping = {
            [this.securityEventTypes.TAB_ACCESS_GRANTED]: this.riskLevels.LOW,
            [this.securityEventTypes.TAB_ACCESS_DENIED]: this.riskLevels.MEDIUM,
            [this.securityEventTypes.TAB_SWITCH_SUCCESS]: this.riskLevels.LOW,
            [this.securityEventTypes.TAB_SWITCH_DENIED]: this.riskLevels.MEDIUM,
            [this.securityEventTypes.PERMISSION_VIOLATION]: this.riskLevels.MEDIUM,
            [this.securityEventTypes.SESSION_START]: this.riskLevels.LOW,
            [this.securityEventTypes.SESSION_END]: this.riskLevels.LOW,
            [this.securityEventTypes.USER_CONTEXT_CHANGE]: this.riskLevels.LOW
        };
        
        let baseRisk = riskMapping[eventType] || this.riskLevels.MEDIUM;
        
        // Adjust risk based on context
        if (context.repeated) {
            baseRisk = this._elevateRiskLevel(baseRisk);
        }
        
        if (context.suspicious) {
            baseRisk = this.riskLevels.HIGH;
        }
        
        return baseRisk;
    }

    /**
     * Save security log to storage
     * @private
     */
    _saveSecurityLog(eventType, details) {
        try {
            const logEntry = {
                id: this._generateId(),
                eventType,
                details,
                timestamp: new Date().toISOString()
            };
            
            const securityLogs = JSON.parse(localStorage.getItem('securityAuditLog') || '[]');
            securityLogs.push(logEntry);
            
            // Keep only last 5000 entries to prevent storage overflow
            if (securityLogs.length > 5000) {
                securityLogs.splice(0, securityLogs.length - 5000);
            }
            
            localStorage.setItem('securityAuditLog', JSON.stringify(securityLogs));
        } catch (error) {
            console.error('Failed to save security log:', error);
        }
    }

    /**
     * Check for suspicious activity patterns
     * @private
     */
    _checkSuspiciousActivity(eventType, details) {
        try {
            // Check for repeated access denials
            if (eventType === this.securityEventTypes.TAB_ACCESS_DENIED) {
                const recentDenials = this._getRecentEvents(this.securityEventTypes.TAB_ACCESS_DENIED, 5 * 60 * 1000); // 5 minutes
                
                if (recentDenials.length >= 5) {
                    this.logSuspiciousActivity('REPEATED_ACCESS_DENIALS', {
                        denialCount: recentDenials.length,
                        timeWindow: '5 minutes',
                        userId: details.userInfo?.userId
                    }, this.riskLevels.HIGH);
                }
            }
            
            // Check for rapid tab switching
            if (eventType === this.securityEventTypes.TAB_SWITCH_SUCCESS) {
                const recentSwitches = this._getRecentEvents(this.securityEventTypes.TAB_SWITCH_SUCCESS, 1 * 60 * 1000); // 1 minute
                
                if (recentSwitches.length >= 10) {
                    this.logSuspiciousActivity('RAPID_TAB_SWITCHING', {
                        switchCount: recentSwitches.length,
                        timeWindow: '1 minute',
                        userId: details.userInfo?.userId
                    }, this.riskLevels.MEDIUM);
                }
            }
            
        } catch (error) {
            console.error('Error checking suspicious activity:', error);
        }
    }

    /**
     * Get recent events of specific type
     * @private
     */
    _getRecentEvents(eventType, timeWindow) {
        try {
            const now = Date.now();
            const cutoff = now - timeWindow;
            
            const securityLogs = JSON.parse(localStorage.getItem('securityAuditLog') || '[]');
            
            return securityLogs.filter(log => 
                log.eventType === eventType && 
                new Date(log.timestamp).getTime() >= cutoff &&
                log.details.userInfo?.userId === this.currentUser?.id
            );
        } catch (error) {
            console.error('Error getting recent events:', error);
            return [];
        }
    }

    /**
     * Generate session ID
     * @private
     */
    _generateSessionId() {
        return `sec_session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    }

    /**
     * Generate unique ID
     * @private
     */
    _generateId() {
        return `sec_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    }

    /**
     * Fallback security logging
     * @private
     */
    _fallbackSecurityLog(eventType, details) {
        try {
            console.warn(`Security log fallback: ${eventType}`, details);
            
            // Try to save basic log entry
            const basicEntry = {
                id: this._generateId(),
                eventType,
                details,
                timestamp: new Date().toISOString(),
                fallback: true
            };
            
            const securityLogs = JSON.parse(localStorage.getItem('securityAuditLog') || '[]');
            securityLogs.push(basicEntry);
            localStorage.setItem('securityAuditLog', JSON.stringify(securityLogs));
        } catch (error) {
            console.error('Fallback security logging failed:', error);
        }
    }

    /**
     * Export security logs to CSV
     * @private
     */
    _exportSecurityLogsToCSV(logs) {
        if (logs.length === 0) return '';
        
        const headers = ['Timestamp', 'Event Type', 'User', 'Risk Level', 'Details'];
        const csvRows = [headers.join(',')];
        
        logs.forEach(log => {
            const row = [
                log.timestamp,
                log.eventType,
                log.details.userInfo?.userName || 'Unknown',
                log.details.riskLevel || 'unknown',
                JSON.stringify(log.details).replace(/"/g, '""')
            ];
            csvRows.push(row.map(field => `"${field}"`).join(','));
        });
        
        return csvRows.join('\n');
    }

    /**
     * Additional helper methods for completeness
     * @private
     */
    _getSessionStartTime() {
        // Implementation would track session start time
        return new Date().toISOString();
    }

    _getSessionDuration() {
        // Implementation would calculate session duration
        return 0;
    }

    _getNavigationPattern(fromTab, toTab) {
        // Implementation would analyze navigation patterns
        return { from: fromTab, to: toTab, pattern: 'normal' };
    }

    _updateNavigationTracking(fromTab, toTab, result) {
        // Implementation would update navigation tracking
    }

    _assessSessionRisk(eventType, sessionData) {
        // Implementation would assess session-specific risks
        return this.riskLevels.LOW;
    }

    _updateSessionTracking(eventType, sessionData) {
        // Implementation would update session tracking
    }

    _mapRiskToSeverity(riskLevel) {
        const mapping = {
            [this.riskLevels.LOW]: 'info',
            [this.riskLevels.MEDIUM]: 'warning',
            [this.riskLevels.HIGH]: 'error',
            [this.riskLevels.CRITICAL]: 'critical'
        };
        return mapping[riskLevel] || 'info';
    }

    _checkPermissionViolationPattern(violationType, details) {
        // Implementation would check for violation patterns
    }

    _isHighRiskViolation(violationType, details) {
        // Implementation would determine if violation is high risk
        return false;
    }

    _alertAdministrators(details) {
        // Implementation would alert administrators
        console.warn('High-risk security event detected:', details);
    }

    _updateThreatTracking(activityType, details) {
        // Implementation would update threat tracking
    }

    _elevateRiskLevel(currentRisk) {
        const levels = [this.riskLevels.LOW, this.riskLevels.MEDIUM, this.riskLevels.HIGH, this.riskLevels.CRITICAL];
        const currentIndex = levels.indexOf(currentRisk);
        return levels[Math.min(currentIndex + 1, levels.length - 1)];
    }
}

// Initialize global security audit logger
if (typeof window !== 'undefined') {
    // Export class and functions
    window.SecurityAuditLogger = SecurityAuditLogger;
    
    // Create global security audit logger instance
    window._securityAuditLogger = new SecurityAuditLogger();
    
    // Listen for user context changes
    if (typeof addEventListener === 'function') {
        addEventListener('storage', function(e) {
            if (e.key === 'currentUser') {
                try {
                    const newUser = e.newValue ? JSON.parse(e.newValue) : null;
                    window._securityAuditLogger.updateUserContext(newUser);
                } catch (error) {
                    console.warn('Failed to update security audit user context:', error);
                }
            }
        });
    }
}

// ES6 export for modern environments
export { SecurityAuditLogger };

// CommonJS export for compatibility
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SecurityAuditLogger };
}