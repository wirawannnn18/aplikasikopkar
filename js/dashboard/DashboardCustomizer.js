/**
 * Dashboard Customizer - Handles dashboard customization functionality
 * Provides drag-and-drop widget arrangement, resizing, and configuration
 * 
 * @class DashboardCustomizer
 */
class DashboardCustomizer {
    constructor(dashboardController) {
        this.dashboardController = dashboardController;
        this.isDragging = false;
        this.draggedWidget = null;
        this.resizeHandle = null;
        this.customizationMode = false;
        this.gridSize = 20; // Grid snap size in pixels
        this.minWidgetSize = { width: 200, height: 150 };
        
        this.init();
    }

    /**
     * Initialize the customizer
     */
    init() {
        this.createCustomizationToolbar();
        this.setupEventListeners();
        this.loadSavedLayout();
    }

    /**
     * Create customization toolbar
     */
    createCustomizationToolbar() {
        const toolbar = document.createElement('div');
        toolbar.id = 'dashboard-customization-toolbar';
        toolbar.className = 'customization-toolbar hidden';
        toolbar.innerHTML = `
            <div class="toolbar-content">
                <div class="toolbar-section">
                    <h4>Dashboard Customization</h4>
                </div>
                <div class="toolbar-section">
                    <button id="add-widget-btn" class="btn btn-primary btn-sm">
                        <i class="fas fa-plus"></i> Add Widget
                    </button>
                    <button id="reset-layout-btn" class="btn btn-secondary btn-sm">
                        <i class="fas fa-undo"></i> Reset Layout
                    </button>
                    <button id="save-layout-btn" class="btn btn-success btn-sm">
                        <i class="fas fa-save"></i> Save Layout
                    </button>
                </div>
                <div class="toolbar-section">
                    <button id="exit-customization-btn" class="btn btn-outline-secondary btn-sm">
                        <i class="fas fa-times"></i> Exit
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(toolbar);
    }

    /**
     * Setup event listeners for customization
     */
    setupEventListeners() {
        // Customization mode toggle
        document.addEventListener('click', (e) => {
            if (e.target.id === 'customize-dashboard-btn') {
                this.enterCustomizationMode();
            }
            if (e.target.id === 'exit-customization-btn') {
                this.exitCustomizationMode();
            }
            if (e.target.id === 'add-widget-btn') {
                this.showAddWidgetModal();
            }
            if (e.target.id === 'reset-layout-btn') {
                this.resetLayout();
            }
            if (e.target.id === 'save-layout-btn') {
                this.saveLayout();
            }
        });

        // Widget configuration
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('widget-config-btn')) {
                const widgetId = e.target.closest('.dashboard-widget').id;
                this.showWidgetConfigModal(widgetId);
            }
            if (e.target.classList.contains('widget-remove-btn')) {
                const widgetId = e.target.closest('.dashboard-widget').id;
                this.removeWidget(widgetId);
            }
        });

        // Drag and drop
        document.addEventListener('mousedown', this.handleMouseDown.bind(this));
        document.addEventListener('mousemove', this.handleMouseMove.bind(this));
        document.addEventListener('mouseup', this.handleMouseUp.bind(this));

        // Touch events for mobile
        document.addEventListener('touchstart', this.handleTouchStart.bind(this));
        document.addEventListener('touchmove', this.handleTouchMove.bind(this));
        document.addEventListener('touchend', this.handleTouchEnd.bind(this));
    }

    /**
     * Enter customization mode
     */
    enterCustomizationMode() {
        this.customizationMode = true;
        document.body.classList.add('customization-mode');
        
        // Show toolbar
        const toolbar = document.getElementById('dashboard-customization-toolbar');
        toolbar.classList.remove('hidden');
        
        // Add customization controls to widgets
        this.addCustomizationControls();
        
        // Show grid overlay
        this.showGridOverlay();
        
        console.log('Entered customization mode');
    }

    /**
     * Exit customization mode
     */
    exitCustomizationMode() {
        this.customizationMode = false;
        document.body.classList.remove('customization-mode');
        
        // Hide toolbar
        const toolbar = document.getElementById('dashboard-customization-toolbar');
        toolbar.classList.add('hidden');
        
        // Remove customization controls
        this.removeCustomizationControls();
        
        // Hide grid overlay
        this.hideGridOverlay();
        
        console.log('Exited customization mode');
    }

    /**
     * Add customization controls to widgets
     */
    addCustomizationControls() {
        const widgets = document.querySelectorAll('.dashboard-widget');
        widgets.forEach(widget => {
            if (!widget.querySelector('.widget-controls')) {
                const controls = document.createElement('div');
                controls.className = 'widget-controls';
                controls.innerHTML = `
                    <div class="widget-drag-handle" title="Drag to move">
                        <i class="fas fa-grip-vertical"></i>
                    </div>
                    <div class="widget-actions">
                        <button class="widget-config-btn" title="Configure">
                            <i class="fas fa-cog"></i>
                        </button>
                        <button class="widget-remove-btn" title="Remove">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="widget-resize-handle" title="Drag to resize">
                        <i class="fas fa-expand-arrows-alt"></i>
                    </div>
                `;
                widget.appendChild(controls);
            }
        });
    }

    /**
     * Remove customization controls from widgets
     */
    removeCustomizationControls() {
        const controls = document.querySelectorAll('.widget-controls');
        controls.forEach(control => control.remove());
    }

    /**
     * Show grid overlay for alignment
     */
    showGridOverlay() {
        let overlay = document.getElementById('grid-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'grid-overlay';
            overlay.className = 'grid-overlay';
            document.body.appendChild(overlay);
        }
        overlay.style.display = 'block';
    }

    /**
     * Hide grid overlay
     */
    hideGridOverlay() {
        const overlay = document.getElementById('grid-overlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }

    /**
     * Handle mouse down for drag start
     */
    handleMouseDown(e) {
        if (!this.customizationMode) return;

        const dragHandle = e.target.closest('.widget-drag-handle');
        const resizeHandle = e.target.closest('.widget-resize-handle');
        
        if (dragHandle) {
            this.startDrag(e, dragHandle.closest('.dashboard-widget'));
        } else if (resizeHandle) {
            this.startResize(e, resizeHandle.closest('.dashboard-widget'));
        }
    }

    /**
     * Handle mouse move for drag/resize
     */
    handleMouseMove(e) {
        if (this.isDragging && this.draggedWidget) {
            this.updateDrag(e);
        } else if (this.resizeHandle && this.draggedWidget) {
            this.updateResize(e);
        }
    }

    /**
     * Handle mouse up for drag/resize end
     */
    handleMouseUp(e) {
        if (this.isDragging) {
            this.endDrag(e);
        } else if (this.resizeHandle) {
            this.endResize(e);
        }
    }

    /**
     * Start dragging a widget
     */
    startDrag(e, widget) {
        this.isDragging = true;
        this.draggedWidget = widget;
        this.dragOffset = {
            x: e.clientX - widget.offsetLeft,
            y: e.clientY - widget.offsetTop
        };
        
        widget.classList.add('dragging');
        document.body.style.cursor = 'grabbing';
        e.preventDefault();
    }

    /**
     * Update widget position during drag
     */
    updateDrag(e) {
        if (!this.draggedWidget) return;
        
        const container = document.getElementById('dashboard-container');
        const containerRect = container.getBoundingClientRect();
        
        let newX = e.clientX - this.dragOffset.x;
        let newY = e.clientY - this.dragOffset.y;
        
        // Snap to grid
        newX = Math.round(newX / this.gridSize) * this.gridSize;
        newY = Math.round(newY / this.gridSize) * this.gridSize;
        
        // Keep within container bounds
        newX = Math.max(0, Math.min(newX, containerRect.width - this.draggedWidget.offsetWidth));
        newY = Math.max(0, Math.min(newY, containerRect.height - this.draggedWidget.offsetHeight));
        
        this.draggedWidget.style.left = newX + 'px';
        this.draggedWidget.style.top = newY + 'px';
        this.draggedWidget.style.position = 'absolute';
    }

    /**
     * End dragging
     */
    endDrag(e) {
        if (this.draggedWidget) {
            this.draggedWidget.classList.remove('dragging');
            this.draggedWidget = null;
        }
        
        this.isDragging = false;
        document.body.style.cursor = '';
    }

    /**
     * Start resizing a widget
     */
    startResize(e, widget) {
        this.resizeHandle = true;
        this.draggedWidget = widget;
        this.resizeStart = {
            x: e.clientX,
            y: e.clientY,
            width: widget.offsetWidth,
            height: widget.offsetHeight
        };
        
        widget.classList.add('resizing');
        document.body.style.cursor = 'nw-resize';
        e.preventDefault();
    }

    /**
     * Update widget size during resize
     */
    updateResize(e) {
        if (!this.draggedWidget || !this.resizeStart) return;
        
        const deltaX = e.clientX - this.resizeStart.x;
        const deltaY = e.clientY - this.resizeStart.y;
        
        let newWidth = this.resizeStart.width + deltaX;
        let newHeight = this.resizeStart.height + deltaY;
        
        // Snap to grid
        newWidth = Math.round(newWidth / this.gridSize) * this.gridSize;
        newHeight = Math.round(newHeight / this.gridSize) * this.gridSize;
        
        // Enforce minimum size
        newWidth = Math.max(this.minWidgetSize.width, newWidth);
        newHeight = Math.max(this.minWidgetSize.height, newHeight);
        
        this.draggedWidget.style.width = newWidth + 'px';
        this.draggedWidget.style.height = newHeight + 'px';
    }

    /**
     * End resizing
     */
    endResize(e) {
        if (this.draggedWidget) {
            this.draggedWidget.classList.remove('resizing');
            
            // Trigger widget refresh to adjust content
            const widgetId = this.draggedWidget.id;
            if (this.dashboardController.widgetManager) {
                this.dashboardController.widgetManager.refreshWidget(widgetId);
            }
            
            this.draggedWidget = null;
        }
        
        this.resizeHandle = false;
        this.resizeStart = null;
        document.body.style.cursor = '';
    }

    /**
     * Touch event handlers for mobile support
     */
    handleTouchStart(e) {
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousedown', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.handleMouseDown(mouseEvent);
        }
    }

    handleTouchMove(e) {
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousemove', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.handleMouseMove(mouseEvent);
            e.preventDefault();
        }
    }

    handleTouchEnd(e) {
        const mouseEvent = new MouseEvent('mouseup', {});
        this.handleMouseUp(mouseEvent);
    }

    /**
     * Show add widget modal
     */
    showAddWidgetModal() {
        const modal = this.createAddWidgetModal();
        document.body.appendChild(modal);
        
        // Show modal
        setTimeout(() => modal.classList.add('show'), 10);
    }

    /**
     * Create add widget modal
     */
    createAddWidgetModal() {
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'add-widget-modal';
        modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Add Widget</h5>
                        <button type="button" class="btn-close" onclick="this.closest('.modal').remove()"></button>
                    </div>
                    <div class="modal-body">
                        <div class="widget-types">
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <div class="widget-type-card" data-type="kpi">
                                        <i class="fas fa-tachometer-alt"></i>
                                        <h6>KPI Widget</h6>
                                        <p>Display key performance indicators</p>
                                    </div>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <div class="widget-type-card" data-type="chart">
                                        <i class="fas fa-chart-line"></i>
                                        <h6>Chart Widget</h6>
                                        <p>Various chart visualizations</p>
                                    </div>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <div class="widget-type-card" data-type="table">
                                        <i class="fas fa-table"></i>
                                        <h6>Table Widget</h6>
                                        <p>Tabular data display</p>
                                    </div>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <div class="widget-type-card" data-type="gauge">
                                        <i class="fas fa-gauge"></i>
                                        <h6>Gauge Widget</h6>
                                        <p>Progress and performance meters</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">Cancel</button>
                        <button type="button" class="btn btn-primary" id="confirm-add-widget">Add Widget</button>
                    </div>
                </div>
            </div>
        `;

        // Add event listeners
        modal.addEventListener('click', (e) => {
            if (e.target.classList.contains('widget-type-card')) {
                // Remove previous selection
                modal.querySelectorAll('.widget-type-card').forEach(card => 
                    card.classList.remove('selected'));
                
                // Select current
                e.target.classList.add('selected');
            }
            
            if (e.target.id === 'confirm-add-widget') {
                const selected = modal.querySelector('.widget-type-card.selected');
                if (selected) {
                    const widgetType = selected.dataset.type;
                    this.addWidget(widgetType);
                    modal.remove();
                }
            }
        });

        return modal;
    }

    /**
     * Add a new widget to the dashboard
     */
    async addWidget(type) {
        try {
            const widgetConfig = {
                type: type,
                title: `New ${type.charAt(0).toUpperCase() + type.slice(1)} Widget`,
                position: { x: 20, y: 20 },
                size: { width: 300, height: 200 }
            };

            if (this.dashboardController.widgetManager) {
                const widget = await this.dashboardController.widgetManager.createWidget(type, widgetConfig);
                
                // Add customization controls if in customization mode
                if (this.customizationMode) {
                    setTimeout(() => {
                        this.addCustomizationControls();
                    }, 100);
                }
                
                console.log(`Added ${type} widget:`, widget);
            }
        } catch (error) {
            console.error('Error adding widget:', error);
            alert('Failed to add widget. Please try again.');
        }
    }

    /**
     * Show widget configuration modal
     */
    showWidgetConfigModal(widgetId) {
        const widget = document.getElementById(widgetId);
        if (!widget) return;

        const modal = this.createWidgetConfigModal(widgetId);
        document.body.appendChild(modal);
        
        // Show modal
        setTimeout(() => modal.classList.add('show'), 10);
    }

    /**
     * Create widget configuration modal
     */
    createWidgetConfigModal(widgetId) {
        const widget = document.getElementById(widgetId);
        const currentTitle = widget.querySelector('.widget-title')?.textContent || 'Widget';
        
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'widget-config-modal';
        modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Configure Widget</h5>
                        <button type="button" class="btn-close" onclick="this.closest('.modal').remove()"></button>
                    </div>
                    <div class="modal-body">
                        <form id="widget-config-form">
                            <div class="mb-3">
                                <label for="widget-title" class="form-label">Title</label>
                                <input type="text" class="form-control" id="widget-title" value="${currentTitle}">
                            </div>
                            <div class="mb-3">
                                <label for="widget-refresh" class="form-label">Refresh Interval (minutes)</label>
                                <select class="form-control" id="widget-refresh">
                                    <option value="1">1 minute</option>
                                    <option value="5" selected>5 minutes</option>
                                    <option value="10">10 minutes</option>
                                    <option value="30">30 minutes</option>
                                    <option value="60">1 hour</option>
                                </select>
                            </div>
                            <div class="mb-3">
                                <label for="widget-theme" class="form-label">Theme</label>
                                <select class="form-control" id="widget-theme">
                                    <option value="default">Default</option>
                                    <option value="dark">Dark</option>
                                    <option value="light">Light</option>
                                    <option value="colorful">Colorful</option>
                                </select>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">Cancel</button>
                        <button type="button" class="btn btn-primary" id="save-widget-config">Save Changes</button>
                    </div>
                </div>
            </div>
        `;

        // Add save handler
        modal.addEventListener('click', (e) => {
            if (e.target.id === 'save-widget-config') {
                this.saveWidgetConfig(widgetId, modal);
            }
        });

        return modal;
    }

    /**
     * Save widget configuration
     */
    saveWidgetConfig(widgetId, modal) {
        const form = modal.querySelector('#widget-config-form');
        const formData = new FormData(form);
        
        const config = {
            title: modal.querySelector('#widget-title').value,
            refreshInterval: parseInt(modal.querySelector('#widget-refresh').value),
            theme: modal.querySelector('#widget-theme').value
        };

        try {
            // Update widget
            const widget = document.getElementById(widgetId);
            const titleElement = widget.querySelector('.widget-title');
            if (titleElement) {
                titleElement.textContent = config.title;
            }

            // Apply theme
            widget.className = widget.className.replace(/theme-\w+/g, '');
            widget.classList.add(`theme-${config.theme}`);

            // Update refresh interval if widget manager exists
            if (this.dashboardController.widgetManager) {
                this.dashboardController.widgetManager.updateWidgetConfig(widgetId, config);
            }

            modal.remove();
            console.log('Widget configuration saved:', config);
        } catch (error) {
            console.error('Error saving widget configuration:', error);
            alert('Failed to save configuration. Please try again.');
        }
    }

    /**
     * Remove a widget
     */
    removeWidget(widgetId) {
        if (confirm('Are you sure you want to remove this widget?')) {
            const widget = document.getElementById(widgetId);
            if (widget) {
                widget.remove();
                
                // Update widget manager if exists
                if (this.dashboardController.widgetManager) {
                    this.dashboardController.widgetManager.removeWidget(widgetId);
                }
                
                console.log('Widget removed:', widgetId);
            }
        }
    }

    /**
     * Reset layout to default
     */
    resetLayout() {
        if (confirm('Are you sure you want to reset the layout to default? This will remove all customizations.')) {
            // Remove all widgets
            const widgets = document.querySelectorAll('.dashboard-widget');
            widgets.forEach(widget => widget.remove());
            
            // Load default layout
            if (this.dashboardController) {
                this.dashboardController.loadDefaultLayout();
            }
            
            console.log('Layout reset to default');
        }
    }

    /**
     * Save current layout
     */
    saveLayout() {
        try {
            const layout = this.getCurrentLayout();
            
            // Save to localStorage
            const userId = this.dashboardController.currentUser?.id || 'default';
            const layoutKey = `dashboard_layout_${userId}`;
            localStorage.setItem(layoutKey, JSON.stringify(layout));
            
            // Show success message
            this.showNotification('Layout saved successfully!', 'success');
            
            console.log('Layout saved:', layout);
        } catch (error) {
            console.error('Error saving layout:', error);
            this.showNotification('Failed to save layout', 'error');
        }
    }

    /**
     * Load saved layout
     */
    loadSavedLayout() {
        try {
            const userId = this.dashboardController.currentUser?.id || 'default';
            const layoutKey = `dashboard_layout_${userId}`;
            const savedLayout = localStorage.getItem(layoutKey);
            
            if (savedLayout) {
                const layout = JSON.parse(savedLayout);
                this.applyLayout(layout);
                console.log('Saved layout loaded:', layout);
            }
        } catch (error) {
            console.error('Error loading saved layout:', error);
        }
    }

    /**
     * Get current layout configuration
     */
    getCurrentLayout() {
        const widgets = document.querySelectorAll('.dashboard-widget');
        const layout = [];
        
        widgets.forEach(widget => {
            const rect = widget.getBoundingClientRect();
            const container = document.getElementById('dashboard-container').getBoundingClientRect();
            
            layout.push({
                id: widget.id,
                type: widget.dataset.type || 'unknown',
                position: {
                    x: widget.offsetLeft,
                    y: widget.offsetTop
                },
                size: {
                    width: widget.offsetWidth,
                    height: widget.offsetHeight
                },
                config: {
                    title: widget.querySelector('.widget-title')?.textContent || '',
                    theme: this.getWidgetTheme(widget)
                }
            });
        });
        
        return layout;
    }

    /**
     * Apply layout configuration
     */
    applyLayout(layout) {
        layout.forEach(item => {
            const widget = document.getElementById(item.id);
            if (widget) {
                // Apply position
                widget.style.position = 'absolute';
                widget.style.left = item.position.x + 'px';
                widget.style.top = item.position.y + 'px';
                
                // Apply size
                widget.style.width = item.size.width + 'px';
                widget.style.height = item.size.height + 'px';
                
                // Apply configuration
                if (item.config) {
                    const titleElement = widget.querySelector('.widget-title');
                    if (titleElement && item.config.title) {
                        titleElement.textContent = item.config.title;
                    }
                    
                    if (item.config.theme) {
                        widget.className = widget.className.replace(/theme-\w+/g, '');
                        widget.classList.add(`theme-${item.config.theme}`);
                    }
                }
            }
        });
    }

    /**
     * Get widget theme
     */
    getWidgetTheme(widget) {
        const classes = widget.className.split(' ');
        const themeClass = classes.find(cls => cls.startsWith('theme-'));
        return themeClass ? themeClass.replace('theme-', '') : 'default';
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
     * Get customization state
     */
    isCustomizationMode() {
        return this.customizationMode;
    }

    /**
     * Cleanup resources
     */
    destroy() {
        this.exitCustomizationMode();
        
        // Remove toolbar
        const toolbar = document.getElementById('dashboard-customization-toolbar');
        if (toolbar) {
            toolbar.remove();
        }
        
        // Remove grid overlay
        const overlay = document.getElementById('grid-overlay');
        if (overlay) {
            overlay.remove();
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DashboardCustomizer;
}