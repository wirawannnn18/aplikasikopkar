/**
 * Role-Based Access Control for Dashboard
 * Manages user roles, permissions, and dashboard access control
 * 
 * @class RoleBasedAccessControl
 */
class RoleBasedAccessControl {
    constructor(dashboardController) {
        this.dashboardController = dashboardController;
        this.currentUser = null;
        this.roles = new Map();
        this.permissions = new Map();
        this.roleTemplates = new Map();
        
        this.init();
    }

    /**
     * Initialize RBAC system
     */
    init() {
        this.defineDefaultRoles();
        this.definePermissions();
        this.createRoleTemplates();
        this.loadUserRole();
    }

    /**
     * Define default roles and their hierarchies
     */
    defineDefaultRoles() {
        // Define role hierarchy (higher level includes lower level permissions)
        this.roles.set('super_admin', {
            name: 'Super Administrator',
            level: 100,
            description: 'Full system access with all permissions',
            inherits: []
        });

        this.roles.set('admin', {
            name: 'Administrator',
            level: 80,
            description: 'Administrative access with most permissions',
            inherits: ['manager']
        });

        this.roles.set('manager', {
            name: 'Manager',
            level: 60,
            description: 'Management access with reporting and analytics',
            inherits: ['supervisor']
        });

        this.roles.set('supervisor', {
            name: 'Supervisor',
            level: 40,
            description: 'Supervisory access with limited administrative functions',
            inherits: ['staff']
        });

        this.roles.set('staff', {
            name: 'Staff',
            level: 20,
            description: 'Basic staff access with operational functions',
            inherits: ['viewer']
        });

        this.roles.set('viewer', {
            name: 'Viewer',
            level: 10,
            description: 'Read-only access to basic information',
            inherits: []
        });
    }

    /**
     * Define permissions for different dashboard features
     */
    definePermissions() {
        // Dashboard permissions
        this.permissions.set('dashboard.view', {
            name: 'View Dashboard',
            description: 'Access to view dashboard',
            roles: ['viewer', 'staff', 'supervisor', 'manager', 'admin', 'super_admin']
        });

        this.permissions.set('dashboard.customize', {
            name: 'Customize Dashboard',
            description: 'Ability to customize dashboard layout',
            roles: ['staff', 'supervisor', 'manager', 'admin', 'super_admin']
        });

        this.permissions.set('dashboard.admin', {
            name: 'Dashboard Administration',
            description: 'Full dashboard administration rights',
            roles: ['admin', 'super_admin']
        });

        // Widget permissions
        this.permissions.set('widgets.view_basic', {
            name: 'View Basic Widgets',
            description: 'Access to basic KPI and summary widgets',
            roles: ['viewer', 'staff', 'supervisor', 'manager', 'admin', 'super_admin']
        });

        this.permissions.set('widgets.view_financial', {
            name: 'View Financial Widgets',
            description: 'Access to financial analytics and reports',
            roles: ['supervisor', 'manager', 'admin', 'super_admin']
        });

        this.permissions.set('widgets.view_sensitive', {
            name: 'View Sensitive Widgets',
            description: 'Access to sensitive financial and member data',
            roles: ['manager', 'admin', 'super_admin']
        });

        this.permissions.set('widgets.create', {
            name: 'Create Widgets',
            description: 'Ability to create new widgets',
            roles: ['supervisor', 'manager', 'admin', 'super_admin']
        });

        this.permissions.set('widgets.delete', {
            name: 'Delete Widgets',
            description: 'Ability to delete widgets',
            roles: ['manager', 'admin', 'super_admin']
        });

        // Analytics permissions
        this.permissions.set('analytics.basic', {
            name: 'Basic Analytics',
            description: 'Access to basic analytics and trends',
            roles: ['staff', 'supervisor', 'manager', 'admin', 'super_admin']
        });

        this.permissions.set('analytics.advanced', {
            name: 'Advanced Analytics',
            description: 'Access to advanced analytics and forecasting',
            roles: ['supervisor', 'manager', 'admin', 'super_admin']
        });

        this.permissions.set('analytics.export', {
            name: 'Export Analytics',
            description: 'Ability to export reports and data',
            roles: ['supervisor', 'manager', 'admin', 'super_admin']
        });

        // Member data permissions
        this.permissions.set('members.view_summary', {
            name: 'View Member Summary',
            description: 'Access to member count and basic statistics',
            roles: ['viewer', 'staff', 'supervisor', 'manager', 'admin', 'super_admin']
        });

        this.permissions.set('members.view_details', {
            name: 'View Member Details',
            description: 'Access to detailed member information',
            roles: ['staff', 'supervisor', 'manager', 'admin', 'super_admin']
        });

        this.permissions.set('members.view_financial', {
            name: 'View Member Financial Data',
            description: 'Access to member financial information',
            roles: ['supervisor', 'manager', 'admin', 'super_admin']
        });

        // System permissions
        this.permissions.set('system.settings', {
            name: 'System Settings',
            description: 'Access to system configuration',
            roles: ['admin', 'super_admin']
        });

        this.permissions.set('system.user_management', {
            name: 'User Management',
            description: 'Manage user accounts and roles',
            roles: ['admin', 'super_admin']
        });

        this.permissions.set('system.audit', {
            name: 'System Audit',
            description: 'Access to system audit logs',
            roles: ['admin', 'super_admin']
        });
    }

    /**
     * Create role-specific dashboard templates
     */
    createRoleTemplates() {
        // Super Admin Template
        this.roleTemplates.set('super_admin', {
            name: 'Super Administrator Dashboard',
            widgets: [
                { type: 'kpi', config: { metric: 'system_health', position: { x: 0, y: 0 } } },
                { type: 'chart', config: { metric: 'user_activity', position: { x: 1, y: 0 } } },
                { type: 'table', config: { metric: 'audit_log', position: { x: 0, y: 1 } } },
                { type: 'kpi', config: { metric: 'total_members', position: { x: 2, y: 0 } } },
                { type: 'chart', config: { metric: 'financial_overview', position: { x: 1, y: 1 } } },
                { type: 'gauge', config: { metric: 'system_performance', position: { x: 2, y: 1 } } }
            ],
            layout: 'grid',
            theme: 'admin'
        });

        // Admin Template
        this.roleTemplates.set('admin', {
            name: 'Administrator Dashboard',
            widgets: [
                { type: 'kpi', config: { metric: 'total_members', position: { x: 0, y: 0 } } },
                { type: 'kpi', config: { metric: 'total_savings', position: { x: 1, y: 0 } } },
                { type: 'kpi', config: { metric: 'total_loans', position: { x: 2, y: 0 } } },
                { type: 'chart', config: { metric: 'monthly_growth', position: { x: 0, y: 1 } } },
                { type: 'chart', config: { metric: 'financial_ratios', position: { x: 1, y: 1 } } },
                { type: 'table', config: { metric: 'recent_transactions', position: { x: 0, y: 2 } } }
            ],
            layout: 'grid',
            theme: 'professional'
        });

        // Manager Template
        this.roleTemplates.set('manager', {
            name: 'Manager Dashboard',
            widgets: [
                { type: 'kpi', config: { metric: 'member_growth', position: { x: 0, y: 0 } } },
                { type: 'kpi', config: { metric: 'revenue_monthly', position: { x: 1, y: 0 } } },
                { type: 'chart', config: { metric: 'savings_trends', position: { x: 0, y: 1 } } },
                { type: 'chart', config: { metric: 'loan_portfolio', position: { x: 1, y: 1 } } },
                { type: 'gauge', config: { metric: 'financial_health', position: { x: 2, y: 0 } } }
            ],
            layout: 'grid',
            theme: 'business'
        });

        // Supervisor Template
        this.roleTemplates.set('supervisor', {
            name: 'Supervisor Dashboard',
            widgets: [
                { type: 'kpi', config: { metric: 'active_members', position: { x: 0, y: 0 } } },
                { type: 'kpi', config: { metric: 'daily_transactions', position: { x: 1, y: 0 } } },
                { type: 'chart', config: { metric: 'member_activity', position: { x: 0, y: 1 } } },
                { type: 'table', config: { metric: 'pending_approvals', position: { x: 1, y: 1 } } }
            ],
            layout: 'grid',
            theme: 'standard'
        });

        // Staff Template
        this.roleTemplates.set('staff', {
            name: 'Staff Dashboard',
            widgets: [
                { type: 'kpi', config: { metric: 'todays_transactions', position: { x: 0, y: 0 } } },
                { type: 'kpi', config: { metric: 'pending_tasks', position: { x: 1, y: 0 } } },
                { type: 'table', config: { metric: 'recent_activities', position: { x: 0, y: 1 } } }
            ],
            layout: 'simple',
            theme: 'clean'
        });

        // Viewer Template
        this.roleTemplates.set('viewer', {
            name: 'Viewer Dashboard',
            widgets: [
                { type: 'kpi', config: { metric: 'member_count', position: { x: 0, y: 0 } } },
                { type: 'chart', config: { metric: 'basic_trends', position: { x: 0, y: 1 } } }
            ],
            layout: 'simple',
            theme: 'minimal'
        });
    }

    /**
     * Load current user role
     */
    loadUserRole() {
        // Try to get user from localStorage or session
        const userData = localStorage.getItem('currentUser');
        if (userData) {
            try {
                this.currentUser = JSON.parse(userData);
            } catch (error) {
                console.error('Error parsing user data:', error);
                this.setDefaultUser();
            }
        } else {
            this.setDefaultUser();
        }

        console.log('Current user loaded:', this.currentUser);
    }

    /**
     * Set default user for testing
     */
    setDefaultUser() {
        this.currentUser = {
            id: 'default-user',
            name: 'Test User',
            role: 'manager',
            permissions: this.getRolePermissions('manager')
        };
    }

    /**
     * Set current user
     */
    setUser(user) {
        this.currentUser = {
            ...user,
            permissions: this.getRolePermissions(user.role)
        };
        
        // Save to localStorage
        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
        
        console.log('User set:', this.currentUser);
        
        // Apply role-based restrictions
        this.applyRoleRestrictions();
    }

    /**
     * Get permissions for a role
     */
    getRolePermissions(roleName) {
        const permissions = [];
        const role = this.roles.get(roleName);
        
        if (!role) {
            console.warn('Role not found:', roleName);
            return permissions;
        }

        // Get permissions for this role and inherited roles
        const rolesToCheck = [roleName, ...role.inherits];
        
        for (const [permissionKey, permission] of this.permissions) {
            if (permission.roles.some(r => rolesToCheck.includes(r))) {
                permissions.push(permissionKey);
            }
        }

        return permissions;
    }

    /**
     * Check if user has permission
     */
    hasPermission(permission) {
        if (!this.currentUser) {
            return false;
        }

        return this.currentUser.permissions.includes(permission);
    }

    /**
     * Check if user has role
     */
    hasRole(roleName) {
        if (!this.currentUser) {
            return false;
        }

        const userRole = this.roles.get(this.currentUser.role);
        const targetRole = this.roles.get(roleName);
        
        if (!userRole || !targetRole) {
            return false;
        }

        // Check if user role level is equal or higher
        return userRole.level >= targetRole.level;
    }

    /**
     * Get role template for current user
     */
    getRoleTemplate() {
        if (!this.currentUser) {
            return this.roleTemplates.get('viewer');
        }

        return this.roleTemplates.get(this.currentUser.role) || this.roleTemplates.get('viewer');
    }

    /**
     * Apply role-based restrictions to dashboard
     */
    applyRoleRestrictions() {
        this.restrictWidgetAccess();
        this.restrictCustomizationFeatures();
        this.restrictMenuItems();
        this.applyRoleTemplate();
    }

    /**
     * Restrict widget access based on permissions
     */
    restrictWidgetAccess() {
        const widgets = document.querySelectorAll('.dashboard-widget');
        
        widgets.forEach(widget => {
            const widgetType = widget.dataset.type;
            const widgetMetric = widget.dataset.metric;
            
            // Check widget-specific permissions
            let hasAccess = true;
            
            if (widgetMetric && widgetMetric.includes('financial')) {
                hasAccess = this.hasPermission('widgets.view_financial');
            } else if (widgetMetric && widgetMetric.includes('sensitive')) {
                hasAccess = this.hasPermission('widgets.view_sensitive');
            } else {
                hasAccess = this.hasPermission('widgets.view_basic');
            }
            
            if (!hasAccess) {
                widget.style.display = 'none';
                console.log('Widget hidden due to permissions:', widget.id);
            } else {
                widget.style.display = '';
            }
        });
    }

    /**
     * Restrict customization features
     */
    restrictCustomizationFeatures() {
        const customizeBtn = document.getElementById('customize-dashboard-btn');
        
        if (customizeBtn) {
            if (this.hasPermission('dashboard.customize')) {
                customizeBtn.style.display = '';
            } else {
                customizeBtn.style.display = 'none';
            }
        }

        // Restrict widget creation/deletion in customization mode
        if (this.dashboardController.customizer) {
            const addWidgetBtn = document.getElementById('add-widget-btn');
            if (addWidgetBtn) {
                if (this.hasPermission('widgets.create')) {
                    addWidgetBtn.style.display = '';
                } else {
                    addWidgetBtn.style.display = 'none';
                }
            }
        }
    }

    /**
     * Restrict menu items based on permissions
     */
    restrictMenuItems() {
        // Hide/show menu items based on permissions
        const menuItems = [
            { selector: '.menu-analytics', permission: 'analytics.basic' },
            { selector: '.menu-advanced-analytics', permission: 'analytics.advanced' },
            { selector: '.menu-export', permission: 'analytics.export' },
            { selector: '.menu-settings', permission: 'system.settings' },
            { selector: '.menu-user-management', permission: 'system.user_management' },
            { selector: '.menu-audit', permission: 'system.audit' }
        ];

        menuItems.forEach(item => {
            const elements = document.querySelectorAll(item.selector);
            elements.forEach(element => {
                if (this.hasPermission(item.permission)) {
                    element.style.display = '';
                } else {
                    element.style.display = 'none';
                }
            });
        });
    }

    /**
     * Apply role-specific template
     */
    applyRoleTemplate() {
        const template = this.getRoleTemplate();
        if (!template) return;

        // Apply theme
        document.body.className = document.body.className.replace(/theme-\w+/g, '');
        document.body.classList.add(`theme-${template.theme}`);

        // Store template for dashboard controller
        if (this.dashboardController) {
            this.dashboardController.currentTemplate = template;
        }

        console.log('Applied role template:', template.name);
    }

    /**
     * Create role selection interface
     */
    createRoleSelector() {
        const selector = document.createElement('div');
        selector.className = 'role-selector';
        selector.innerHTML = `
            <div class="role-selector-content">
                <h6>Select Role (Testing)</h6>
                <select id="role-select" class="form-select form-select-sm">
                    ${Array.from(this.roles.entries()).map(([key, role]) => 
                        `<option value="${key}" ${this.currentUser?.role === key ? 'selected' : ''}>
                            ${role.name}
                        </option>`
                    ).join('')}
                </select>
                <div class="role-info mt-2">
                    <small id="role-description" class="text-muted"></small>
                </div>
            </div>
        `;

        // Add event listener
        selector.addEventListener('change', (e) => {
            if (e.target.id === 'role-select') {
                const newRole = e.target.value;
                this.switchRole(newRole);
            }
        });

        // Update description
        const updateDescription = () => {
            const select = selector.querySelector('#role-select');
            const description = selector.querySelector('#role-description');
            const role = this.roles.get(select.value);
            if (role && description) {
                description.textContent = role.description;
            }
        };

        selector.addEventListener('change', updateDescription);
        setTimeout(updateDescription, 100);

        return selector;
    }

    /**
     * Switch user role (for testing)
     */
    switchRole(newRole) {
        if (!this.roles.has(newRole)) {
            console.error('Invalid role:', newRole);
            return;
        }

        const role = this.roles.get(newRole);
        this.setUser({
            id: this.currentUser?.id || 'test-user',
            name: this.currentUser?.name || 'Test User',
            role: newRole
        });

        // Refresh dashboard
        if (this.dashboardController) {
            this.dashboardController.refresh();
        }

        console.log('Switched to role:', role.name);
    }

    /**
     * Get current user info
     */
    getCurrentUser() {
        return this.currentUser;
    }

    /**
     * Get available roles
     */
    getAvailableRoles() {
        return Array.from(this.roles.entries()).map(([key, role]) => ({
            key,
            ...role
        }));
    }

    /**
     * Get user permissions
     */
    getUserPermissions() {
        return this.currentUser?.permissions || [];
    }

    /**
     * Check widget visibility
     */
    isWidgetVisible(widgetConfig) {
        const { type, metric, sensitivity } = widgetConfig;
        
        // Basic widgets
        if (type === 'kpi' && !metric?.includes('financial')) {
            return this.hasPermission('widgets.view_basic');
        }
        
        // Financial widgets
        if (metric?.includes('financial') || type === 'financial') {
            return this.hasPermission('widgets.view_financial');
        }
        
        // Sensitive widgets
        if (sensitivity === 'high' || metric?.includes('sensitive')) {
            return this.hasPermission('widgets.view_sensitive');
        }
        
        return this.hasPermission('widgets.view_basic');
    }

    /**
     * Filter widgets based on permissions
     */
    filterWidgetsByPermissions(widgets) {
        return widgets.filter(widget => this.isWidgetVisible(widget));
    }

    /**
     * Cleanup
     */
    destroy() {
        // Remove role selector if exists
        const selector = document.querySelector('.role-selector');
        if (selector) {
            selector.remove();
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RoleBasedAccessControl;
}