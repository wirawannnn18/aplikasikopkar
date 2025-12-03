/**
 * Spec Auditor
 * Audits all specs in .kiro/specs directory and analyzes completion status
 */

class SpecAuditor {
    constructor() {
        this.specsPath = '.kiro/specs';
        this.specs = [];
    }

    /**
     * Read all specs from .kiro/specs directory
     * Note: Since we're in browser, we'll need to manually list known specs
     * In a Node.js environment, this would use fs.readdir
     */
    async readAllSpecs() {
        // List of known specs (this would be dynamic in a server environment)
        const specNames = [
            'audit-perbaikan-aplikasi',
            'integrasi-menu-akuntansi',
            'tagihan-simpanan-wajib-kolektif',
            'batas-kredit-pos',
            'pengajuan-modal',
            'hapus-transaksi-pos',
            'backup-restore',
            'tutup-kasir',
            'pembatalan-tutup-kasir',
            'hapus-pembelian',
            'jurnal-pembelian',
            'edit-pembelian-items',
            'saldo-awal-balance',
            'upload-simpanan-pokok',
            'upload-simpanan-wajib',
            'hapus-simpanan-pokok',
            'filter-hapus-jurnal',
            'responsive-layout',
            'system-settings'
        ];

        this.specs = [];

        for (const specName of specNames) {
            try {
                const spec = await this._readSpec(specName);
                if (spec) {
                    this.specs.push(spec);
                }
            } catch (error) {
                console.warn(`Failed to read spec: ${specName}`, error);
            }
        }

        return this.specs;
    }

    /**
     * Read a single spec
     */
    async _readSpec(specName) {
        try {
            // In browser environment, we can't directly read files
            // This is a placeholder that would need server-side implementation
            // For now, we'll return a structure that can be populated
            
            const spec = {
                name: specName,
                path: `${this.specsPath}/${specName}`,
                requirements: null,
                design: null,
                tasks: [],
                completionPercentage: 0
            };

            // Try to fetch tasks.md if available
            // This would need to be implemented with actual file reading
            // For now, we'll mark it as needing implementation
            
            return spec;
        } catch (error) {
            console.error(`Error reading spec ${specName}:`, error);
            return null;
        }
    }

    /**
     * Analyze task completion from tasks.md content
     */
    analyzeTaskCompletion(tasksContent) {
        if (!tasksContent) {
            return {
                totalTasks: 0,
                completedTasks: 0,
                incompleteTasks: 0,
                optionalTasks: 0,
                completionPercentage: 0,
                tasks: []
            };
        }

        const lines = tasksContent.split('\n');
        const tasks = [];
        let totalTasks = 0;
        let completedTasks = 0;
        let optionalTasks = 0;

        const taskRegex = /^- \[([ x])\](\*)?\s+(\d+\.?\d*)\s+(.+)/;

        for (const line of lines) {
            const match = line.match(taskRegex);
            if (match) {
                const [, checked, optional, id, description] = match;
                const isCompleted = checked === 'x';
                const isOptional = optional === '*';

                tasks.push({
                    id,
                    description: description.trim(),
                    completed: isCompleted,
                    optional: isOptional
                });

                totalTasks++;
                if (isCompleted) completedTasks++;
                if (isOptional) optionalTasks++;
            }
        }

        const completionPercentage = totalTasks > 0 
            ? AuditUtils.calculatePercentage(completedTasks, totalTasks)
            : 0;

        return {
            totalTasks,
            completedTasks,
            incompleteTasks: totalTasks - completedTasks,
            optionalTasks,
            completionPercentage,
            tasks
        };
    }

    /**
     * Generate audit report
     */
    generateAuditReport(specs) {
        const totalSpecs = specs.length;
        const completedSpecs = specs.filter(s => s.completionPercentage === 100).length;
        const incompleteSpecs = specs.filter(s => s.completionPercentage < 100);

        // Calculate overall completion
        const totalCompletion = specs.reduce((sum, spec) => sum + spec.completionPercentage, 0);
        const overallCompletion = totalSpecs > 0 
            ? AuditUtils.calculatePercentage(totalCompletion, totalSpecs * 100)
            : 0;

        // Prioritize incomplete specs
        const priorityList = this.prioritizeIncompleteSpecs(incompleteSpecs);

        const report = {
            totalSpecs,
            completedSpecs,
            incompleteSpecs,
            overallCompletion,
            priorityList,
            generatedAt: AuditUtils.formatDate(),
            generatedBy: AuditUtils.getCurrentUser().username
        };

        return report;
    }

    /**
     * Prioritize incomplete specs
     * Priority based on:
     * 1. Critical specs (accounting, data integrity)
     * 2. Completion percentage (lower = higher priority)
     * 3. Dependencies
     */
    prioritizeIncompleteSpecs(specs) {
        const criticalSpecs = [
            'integrasi-menu-akuntansi',
            'audit-perbaikan-aplikasi',
            'backup-restore',
            'saldo-awal-balance'
        ];

        const prioritized = specs.map(spec => {
            let priority = 0;

            // Critical spec bonus
            if (criticalSpecs.includes(spec.name)) {
                priority += 100;
            }

            // Lower completion = higher priority
            priority += (100 - spec.completionPercentage);

            return {
                ...spec,
                priority
            };
        });

        // Sort by priority (highest first)
        prioritized.sort((a, b) => b.priority - a.priority);

        return prioritized;
    }

    /**
     * Get spec by name
     */
    getSpecByName(name) {
        return this.specs.find(spec => spec.name === name);
    }

    /**
     * Get incomplete specs
     */
    getIncompleteSpecs() {
        return this.specs.filter(spec => spec.completionPercentage < 100);
    }

    /**
     * Get completed specs
     */
    getCompletedSpecs() {
        return this.specs.filter(spec => spec.completionPercentage === 100);
    }

    /**
     * Get specs by completion range
     */
    getSpecsByCompletionRange(min, max) {
        return this.specs.filter(spec => 
            spec.completionPercentage >= min && spec.completionPercentage <= max
        );
    }

    /**
     * Export audit data
     */
    exportAuditData() {
        const report = this.generateAuditReport(this.specs);
        const dataStr = JSON.stringify(report, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `spec-audit-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
    }

    /**
     * Generate HTML report
     */
    generateHtmlReport() {
        const report = this.generateAuditReport(this.specs);
        
        let html = `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Laporan Audit Spec</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        h1 {
            color: #007bff;
            border-bottom: 3px solid #007bff;
            padding-bottom: 10px;
        }
        .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 30px 0;
        }
        .summary-card {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
        }
        .summary-value {
            font-size: 2.5rem;
            font-weight: 700;
            color: #007bff;
        }
        .summary-label {
            color: #666;
            margin-top: 5px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #dee2e6;
        }
        th {
            background: #f8f9fa;
            font-weight: 600;
        }
        .progress-bar {
            width: 100%;
            height: 24px;
            background: #f0f0f0;
            border-radius: 12px;
            overflow: hidden;
        }
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #007bff, #0056b3);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: 600;
            font-size: 0.85rem;
        }
        .badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 0.85rem;
            font-weight: 600;
        }
        .badge-success { background: #d4edda; color: #155724; }
        .badge-warning { background: #fff3cd; color: #856404; }
        .badge-danger { background: #f8d7da; color: #721c24; }
        .badge-high { background: #f8d7da; color: #721c24; }
        .badge-medium { background: #fff3cd; color: #856404; }
        .badge-low { background: #d1ecf1; color: #0c5460; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Laporan Audit Spec</h1>
        <p>Dibuat: ${new Date(report.generatedAt).toLocaleString('id-ID')}</p>
        <p>Oleh: ${report.generatedBy}</p>
        
        <div class="summary">
            <div class="summary-card">
                <div class="summary-value">${report.totalSpecs}</div>
                <div class="summary-label">Total Spec</div>
            </div>
            <div class="summary-card">
                <div class="summary-value">${report.completedSpecs}</div>
                <div class="summary-label">Spec Selesai</div>
            </div>
            <div class="summary-card">
                <div class="summary-value">${report.incompleteSpecs.length}</div>
                <div class="summary-label">Spec Belum Selesai</div>
            </div>
            <div class="summary-card">
                <div class="summary-value">${report.overallCompletion.toFixed(1)}%</div>
                <div class="summary-label">Completion Keseluruhan</div>
            </div>
        </div>

        <h2>Spec Belum Selesai (Berdasarkan Prioritas)</h2>
        <table>
            <thead>
                <tr>
                    <th>Spec</th>
                    <th>Completion</th>
                    <th>Prioritas</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
        `;

        report.priorityList.forEach(spec => {
            const priorityBadge = spec.priority >= 150 ? 'high' : spec.priority >= 100 ? 'medium' : 'low';
            const priorityLabel = spec.priority >= 150 ? 'Tinggi' : spec.priority >= 100 ? 'Sedang' : 'Rendah';
            const statusBadge = spec.completionPercentage >= 75 ? 'warning' : 'danger';
            
            html += `
                <tr>
                    <td>${spec.name}</td>
                    <td>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${spec.completionPercentage}%">
                                ${spec.completionPercentage.toFixed(1)}%
                            </div>
                        </div>
                    </td>
                    <td><span class="badge badge-${priorityBadge}">${priorityLabel}</span></td>
                    <td><span class="badge badge-${statusBadge}">Incomplete</span></td>
                </tr>
            `;
        });

        html += `
            </tbody>
        </table>

        <h2>Spec Selesai</h2>
        <table>
            <thead>
                <tr>
                    <th>Spec</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
        `;

        const completedSpecs = this.getCompletedSpecs();
        completedSpecs.forEach(spec => {
            html += `
                <tr>
                    <td>${spec.name}</td>
                    <td><span class="badge badge-success">Complete</span></td>
                </tr>
            `;
        });

        html += `
            </tbody>
        </table>
    </div>
</body>
</html>
        `;

        return html;
    }

    /**
     * Display audit report in UI
     */
    displayAuditReport(containerId = 'auditReportContainer') {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error('Audit report container not found');
            return;
        }

        const report = this.generateAuditReport(this.specs);
        const html = this._generateReportHtml(report);
        container.innerHTML = html;
    }

    _generateReportHtml(report) {
        let html = `
            <div class="audit-card">
                <div class="audit-card-header">
                    <h2 class="audit-card-title">Ringkasan Audit Spec</h2>
                </div>
                <div class="audit-card-body">
                    <div class="stat-grid">
                        <div class="stat-item">
                            <div class="stat-value">${report.totalSpecs}</div>
                            <div class="stat-label">Total Spec</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${report.completedSpecs}</div>
                            <div class="stat-label">Selesai</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${report.incompleteSpecs.length}</div>
                            <div class="stat-label">Belum Selesai</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${report.overallCompletion.toFixed(1)}%</div>
                            <div class="stat-label">Completion</div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="audit-card">
                <div class="audit-card-header">
                    <h2 class="audit-card-title">Spec Prioritas Tinggi</h2>
                </div>
                <div class="audit-card-body">
                    <table class="audit-table">
                        <thead>
                            <tr>
                                <th>Spec</th>
                                <th>Completion</th>
                                <th>Prioritas</th>
                            </tr>
                        </thead>
                        <tbody>
        `;

        report.priorityList.slice(0, 10).forEach(spec => {
            const priorityBadge = spec.priority >= 150 ? 'danger' : spec.priority >= 100 ? 'warning' : 'info';
            const priorityLabel = spec.priority >= 150 ? 'Tinggi' : spec.priority >= 100 ? 'Sedang' : 'Rendah';
            
            html += `
                <tr>
                    <td>${spec.name}</td>
                    <td>
                        <div class="progress-bar-container">
                            <div class="progress-bar" style="width: ${spec.completionPercentage}%">
                                ${spec.completionPercentage.toFixed(1)}%
                            </div>
                        </div>
                    </td>
                    <td><span class="status-badge ${priorityBadge}">${priorityLabel}</span></td>
                </tr>
            `;
        });

        html += `
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        return html;
    }
}

// Create global instance
const specAuditor = new SpecAuditor();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SpecAuditor;
}
