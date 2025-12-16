/**
 * Master Barang Komprehensif - Audit Viewer
 * Provides UI for viewing and managing audit logs
 */

import { BaseManager } from './BaseManager.js';
import { AuditLogger } from './AuditLogger.js';

export class AuditViewer extends BaseManager {
    constructor() {
        super();
        this.auditLogger = new AuditLogger();
        this.currentFilters = {};
        this.currentPage = 1;
        this.pageSize = 20;
    }

    /**
     * Initialize audit viewer UI
     */
    initialize() {
        this.createAuditViewerUI();
        this.setupEventHandlers();
        this.loadAuditLogs();
    }

    /**
     * Create audit viewer UI elements
     */
    createAuditViewerUI() {
        // Create audit viewer modal
        const modalHTML = `
            <div id="auditViewerModal" class="modal fade" tabindex="-1">
                <div class="modal-dialog modal-xl">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">
                                <i class="fas fa-history"></i> Audit Logs
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <!-- Filters -->
                            <div class="row mb-3">
                                <div class="col-md-3">
                                    <label class="form-label">Table:</label>
                                    <select id="auditFilterTable" class="form-select">
                                        <option value="">All Tables</option>
                                        <option value="barang">Barang</option>
                                        <option value="kategori">Kategori</option>
                                        <option value="satuan">Satuan</option>
                                    </select>
                                </div>
                                <div class="col-md-3">
                                    <label class="form-label">Action:</label>
                                    <select id="auditFilterAction" class="form-select">
                                        <option value="">All Actions</option>
                                        <option value="create">Create</option>
                                        <option value="update">Update</option>
                                        <option value="delete">Delete</option>
                                        <option value="import">Import</option>
                                        <option value="export">Export</option>
                                        <option value="bulk_operation">Bulk Operation</option>
                                    </select>
                                </div>
                                <div class="col-md-3">
                                    <label class="form-label">Date From:</label>
                                    <input type="date" id="auditFilterDateFrom" class="form-control">
                                </div>
                                <div class="col-md-3">
                                    <label class="form-label">Date To:</label>
                                    <input type="date" id="auditFilterDateTo" class="form-control">
                                </div>
                            </div>
                            
                            <div class="row mb-3">
                                <div class="col-md-6">
                                    <label class="form-label">User:</label>
                                    <input type="text" id="auditFilterUser" class="form-control" placeholder="Filter by user name">
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label">Record ID:</label>
                                    <input type="text" id="auditFilterRecordId" class="form-control" placeholder="Filter by record ID">
                                </div>
                            </div>

                            <div class="d-flex justify-content-between mb-3">
                                <div>
                                    <button type="button" id="applyAuditFilters" class="btn btn-primary">
                                        <i class="fas fa-filter"></i> Apply Filters
                                    </button>
                                    <button type="button" id="clearAuditFilters" class="btn btn-secondary">
                                        <i class="fas fa-times"></i> Clear
                                    </button>
                                </div>
                                <div>
                                    <button type="button" id="exportAuditLogs" class="btn btn-success">
                                        <i class="fas fa-download"></i> Export CSV
                                    </button>
                                    <button type="button" id="refreshAuditLogs" class="btn btn-info">
                                        <i class="fas fa-sync"></i> Refresh
                                    </button>
                                </div>
                            </div>

                            <!-- Audit logs table -->
                            <div class="table-responsive">
                                <table class="table table-striped table-hover">
                                    <thead class="table-dark">
                                        <tr>
                                            <th>Timestamp</th>
                                            <th>Table</th>
                                            <th>Action</th>
                                            <th>Record ID</th>
                                            <th>User</th>
                                            <th>Details</th>
                                        </tr>
                                    </thead>
                                    <tbody id="auditLogsTableBody">
                                        <!-- Audit logs will be inserted here -->
                                    </tbody>
                                </table>
                            </div>

                            <!-- Pagination -->
                            <div id="auditLogsPagination" class="d-flex justify-content-between align-items-center mt-3">
                                <div id="auditLogsInfo" class="text-muted">
                                    <!-- Info will be inserted here -->
                                </div>
                                <nav>
                                    <ul id="auditLogsPaginationList" class="pagination pagination-sm mb-0">
                                        <!-- Pagination will be inserted here -->
                                    </ul>
                                </nav>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Create audit log detail modal
        this.createAuditDetailModal();
    }

    /**
     * Create audit log detail modal
     */
    createAuditDetailModal() {
        const modalHTML = `
            <div id="auditDetailModal" class="modal fade" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">
                                <i class="fas fa-info-circle"></i> Audit Log Details
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div id="auditDetailContent">
                                <!-- Detail content will be inserted here -->
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    /**
     * Setup event handlers
     */
    setupEventHandlers() {
        // Filter buttons
        document.getElementById('applyAuditFilters')?.addEventListener('click', () => this.applyFilters());
        document.getElementById('clearAuditFilters')?.addEventListener('click', () => this.clearFilters());
        document.getElementById('refreshAuditLogs')?.addEventListener('click', () => this.loadAuditLogs());
        document.getElementById('exportAuditLogs')?.addEventListener('click', () => this.exportLogs());

        // Table row clicks for details
        document.addEventListener('click', (e) => {
            if (e.target.closest('.audit-log-row')) {
                const logId = e.target.closest('.audit-log-row').dataset.logId;
                this.showLogDetails(logId);
            }
        });
    }

    /**
     * Load audit logs with current filters and pagination
     */
    loadAuditLogs() {
        const filters = {
            ...this.currentFilters,
            page: this.currentPage,
            limit: this.pageSize
        };

        const result = this.auditLogger.getAuditLogs(filters);
        this.renderAuditLogs(result.data);
        this.renderPagination(result.pagination);
    }

    /**
     * Render audit logs in table
     */
    renderAuditLogs(logs) {
        const tbody = document.getElementById('auditLogsTableBody');
        if (!tbody) return;

        if (logs.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-muted py-4">
                        <i class="fas fa-inbox fa-2x mb-2"></i><br>
                        No audit logs found
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = logs.map(log => `
            <tr class="audit-log-row" data-log-id="${log.id}" style="cursor: pointer;">
                <td>
                    <small>${this.formatTimestamp(log.timestamp)}</small>
                </td>
                <td>
                    <span class="badge bg-secondary">${log.table_name}</span>
                </td>
                <td>
                    <span class="badge ${this.getActionBadgeClass(log.action)}">${log.action}</span>
                </td>
                <td>
                    <code class="small">${log.record_id}</code>
                </td>
                <td>
                    <small>${log.user_name}</small>
                </td>
                <td>
                    <small class="text-muted">${this.getLogSummary(log)}</small>
                </td>
            </tr>
        `).join('');
    }

    /**
     * Render pagination controls
     */
    renderPagination(pagination) {
        const info = document.getElementById('auditLogsInfo');
        const paginationList = document.getElementById('auditLogsPaginationList');
        
        if (!info || !paginationList) return;

        // Update info
        info.textContent = `Showing ${pagination.from} to ${pagination.to} of ${pagination.total} entries`;

        // Update pagination
        if (pagination.totalPages <= 1) {
            paginationList.innerHTML = '';
            return;
        }

        let paginationHTML = '';

        // Previous button
        if (pagination.currentPage > 1) {
            paginationHTML += `
                <li class="page-item">
                    <a class="page-link" href="#" data-page="${pagination.currentPage - 1}">Previous</a>
                </li>
            `;
        }

        // Page numbers
        const startPage = Math.max(1, pagination.currentPage - 2);
        const endPage = Math.min(pagination.totalPages, pagination.currentPage + 2);

        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `
                <li class="page-item ${i === pagination.currentPage ? 'active' : ''}">
                    <a class="page-link" href="#" data-page="${i}">${i}</a>
                </li>
            `;
        }

        // Next button
        if (pagination.currentPage < pagination.totalPages) {
            paginationHTML += `
                <li class="page-item">
                    <a class="page-link" href="#" data-page="${pagination.currentPage + 1}">Next</a>
                </li>
            `;
        }

        paginationList.innerHTML = paginationHTML;

        // Add click handlers for pagination
        paginationList.addEventListener('click', (e) => {
            e.preventDefault();
            if (e.target.classList.contains('page-link')) {
                const page = parseInt(e.target.dataset.page);
                if (page && page !== this.currentPage) {
                    this.currentPage = page;
                    this.loadAuditLogs();
                }
            }
        });
    }

    /**
     * Apply current filters
     */
    applyFilters() {
        this.currentFilters = {
            table_name: document.getElementById('auditFilterTable')?.value || '',
            action: document.getElementById('auditFilterAction')?.value || '',
            date_from: document.getElementById('auditFilterDateFrom')?.value || '',
            date_to: document.getElementById('auditFilterDateTo')?.value || '',
            user_name: document.getElementById('auditFilterUser')?.value || '',
            record_id: document.getElementById('auditFilterRecordId')?.value || ''
        };

        // Remove empty filters
        Object.keys(this.currentFilters).forEach(key => {
            if (!this.currentFilters[key]) {
                delete this.currentFilters[key];
            }
        });

        this.currentPage = 1;
        this.loadAuditLogs();
    }

    /**
     * Clear all filters
     */
    clearFilters() {
        document.getElementById('auditFilterTable').value = '';
        document.getElementById('auditFilterAction').value = '';
        document.getElementById('auditFilterDateFrom').value = '';
        document.getElementById('auditFilterDateTo').value = '';
        document.getElementById('auditFilterUser').value = '';
        document.getElementById('auditFilterRecordId').value = '';

        this.currentFilters = {};
        this.currentPage = 1;
        this.loadAuditLogs();
    }

    /**
     * Export audit logs to CSV
     */
    exportLogs() {
        const csvContent = this.auditLogger.exportToCSV(this.currentFilters);
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    /**
     * Show detailed view of audit log
     */
    showLogDetails(logId) {
        const log = this.auditLogger.getById(logId);
        if (!log) return;

        const detailContent = document.getElementById('auditDetailContent');
        if (!detailContent) return;

        detailContent.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <h6>Basic Information</h6>
                    <table class="table table-sm">
                        <tr><td><strong>ID:</strong></td><td>${log.id}</td></tr>
                        <tr><td><strong>Timestamp:</strong></td><td>${this.formatTimestamp(log.timestamp)}</td></tr>
                        <tr><td><strong>Table:</strong></td><td>${log.table_name}</td></tr>
                        <tr><td><strong>Action:</strong></td><td><span class="badge ${this.getActionBadgeClass(log.action)}">${log.action}</span></td></tr>
                        <tr><td><strong>Record ID:</strong></td><td><code>${log.record_id}</code></td></tr>
                    </table>
                </div>
                <div class="col-md-6">
                    <h6>User Information</h6>
                    <table class="table table-sm">
                        <tr><td><strong>User ID:</strong></td><td>${log.user_id}</td></tr>
                        <tr><td><strong>User Name:</strong></td><td>${log.user_name}</td></tr>
                        <tr><td><strong>IP Address:</strong></td><td>${log.ip_address}</td></tr>
                        <tr><td><strong>User Agent:</strong></td><td><small>${log.user_agent}</small></td></tr>
                    </table>
                </div>
            </div>

            ${log.old_data ? `
                <div class="mt-3">
                    <h6>Old Data</h6>
                    <pre class="bg-light p-2 rounded"><code>${JSON.stringify(log.old_data, null, 2)}</code></pre>
                </div>
            ` : ''}

            ${log.new_data ? `
                <div class="mt-3">
                    <h6>New Data</h6>
                    <pre class="bg-light p-2 rounded"><code>${JSON.stringify(log.new_data, null, 2)}</code></pre>
                </div>
            ` : ''}

            ${Object.keys(log.additional_info).length > 0 ? `
                <div class="mt-3">
                    <h6>Additional Information</h6>
                    <pre class="bg-light p-2 rounded"><code>${JSON.stringify(log.additional_info, null, 2)}</code></pre>
                </div>
            ` : ''}
        `;

        const modal = new bootstrap.Modal(document.getElementById('auditDetailModal'));
        modal.show();
    }

    /**
     * Show audit viewer modal
     */
    show() {
        const modal = new bootstrap.Modal(document.getElementById('auditViewerModal'));
        modal.show();
    }

    /**
     * Format timestamp for display
     */
    formatTimestamp(timestamp) {
        return new Date(timestamp).toLocaleString();
    }

    /**
     * Get badge class for action type
     */
    getActionBadgeClass(action) {
        const classes = {
            'create': 'bg-success',
            'update': 'bg-warning',
            'delete': 'bg-danger',
            'import': 'bg-info',
            'export': 'bg-primary',
            'bulk_operation': 'bg-dark'
        };
        return classes[action] || 'bg-secondary';
    }

    /**
     * Get summary text for log entry
     */
    getLogSummary(log) {
        switch (log.action) {
            case 'create':
                return 'New record created';
            case 'update':
                return 'Record updated';
            case 'delete':
                return 'Record deleted';
            case 'import':
                return `Imported ${log.additional_info.total_records || 0} records`;
            case 'export':
                return `Exported ${log.additional_info.total_records || 0} records`;
            case 'bulk_operation':
                return `${log.additional_info.operation_type || 'Bulk operation'} on ${log.additional_info.affected_records || 0} records`;
            default:
                return log.action;
        }
    }

    /**
     * Get record history for specific item
     */
    getRecordHistory(tableName, recordId) {
        return this.auditLogger.getRecordHistory(tableName, recordId);
    }

    /**
     * Get user activity summary
     */
    getUserActivitySummary(userId, days = 30) {
        return this.auditLogger.getUserActivitySummary(userId, days);
    }

    /**
     * Get system activity summary
     */
    getSystemActivitySummary(days = 7) {
        return this.auditLogger.getSystemActivitySummary(days);
    }
}