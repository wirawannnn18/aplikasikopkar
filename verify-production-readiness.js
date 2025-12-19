/**
 * Production Readiness Verification Script
 * Comprehensive checks to ensure the Integrasi Pembayaran Laporan feature is ready for production
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ProductionReadinessVerifier {
    constructor() {
        this.results = {
            passed: 0,
            failed: 0,
            warnings: 0,
            checks: []
        };
    }

    // Logging methods
    log(message, level = 'INFO') {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] [${level}] ${message}`);
    }

    success(message) {
        this.log(message, 'SUCCESS');
        this.results.passed++;
    }

    error(message) {
        this.log(message, 'ERROR');
        this.results.failed++;
    }

    warning(message) {
        this.log(message, 'WARNING');
        this.results.warnings++;
    }

    addCheck(name, status, message, details = null) {
        this.results.checks.push({
            name,
            status,
            message,
            details,
            timestamp: new Date().toISOString()
        });
    }

    // File existence checks
    checkRequiredFiles() {
        this.log('Checking required files...');
        
        const requiredFiles = [
            // Core integration files
            'js/pembayaranHutangPiutangIntegrated.js',
            'js/shared/SharedPaymentServices.js',
            'js/shared/EnhancedAuditLogger.js',
            'js/shared/UnifiedTransactionModel.js',
            
            // Enhanced controllers
            'js/pembayaranHutangPiutangEnhanced.js',
            'js/import-tagihan/ImportTagihanEnhanced.js',
            
            // Unified components
            'js/shared/UnifiedTransactionHistoryView.js',
            'js/shared/UnifiedDashboardView.js',
            'js/shared/RealTimeUpdateManager.js',
            
            // Monitoring files
            'js/monitoring/ErrorTracker.js',
            'js/monitoring/PerformanceMonitor.js',
            
            // Security and validation
            'js/shared/TabPermissionManager.js',
            'js/shared/SecurityAuditLogger.js',
            'js/shared/DataConsistencyValidator.js',
            'js/shared/CrossModeErrorHandler.js',
            
            // Migration files
            'js/migration/TransactionMigration.js',
            'js/migration/UpdatedQueryFunctions.js',
            
            // Performance optimization
            'js/shared/LazyLoadingManager.js',
            'js/shared/DataQueryOptimizer.js',
            
            // Main HTML file
            'index.html',
            
            // Configuration files
            'vercel.json',
            'package.json',
            
            // Deployment files
            'DEPLOYMENT_CHECKLIST_INTEGRASI_PEMBAYARAN_LAPORAN.md',
            'ROLLBACK_PROCEDURES_INTEGRASI_PEMBAYARAN_LAPORAN.md',
            'MONITORING_ALERTING_INTEGRASI_PEMBAYARAN_LAPORAN.md'
        ];

        let missingFiles = [];
        let foundFiles = [];

        requiredFiles.forEach(file => {
            if (fs.existsSync(file)) {
                foundFiles.push(file);
            } else {
                missingFiles.push(file);
            }
        });

        if (missingFiles.length === 0) {
            this.success(`All ${requiredFiles.length} required files found`);
            this.addCheck('Required Files', 'PASS', 'All required files present', { foundFiles });
        } else {
            this.error(`Missing ${missingFiles.length} required files`);
            this.addCheck('Required Files', 'FAIL', `Missing files: ${missingFiles.join(', ')}`, { missingFiles });
        }

        return missingFiles.length === 0;
    }

    // JavaScript syntax validation
    checkJavaScriptSyntax() {
        this.log('Checking JavaScript syntax...');
        
        const jsFiles = this.getAllJavaScriptFiles();
        let syntaxErrors = [];
        let validFiles = [];

        jsFiles.forEach(file => {
            try {
                const content = fs.readFileSync(file, 'utf8');
                
                // Basic syntax checks
                if (this.hasSyntaxIssues(content, file)) {
                    syntaxErrors.push(file);
                } else {
                    validFiles.push(file);
                }
            } catch (error) {
                syntaxErrors.push(`${file}: ${error.message}`);
            }
        });

        if (syntaxErrors.length === 0) {
            this.success(`JavaScript syntax valid for ${validFiles.length} files`);
            this.addCheck('JavaScript Syntax', 'PASS', 'No syntax errors found', { validFiles });
        } else {
            this.error(`JavaScript syntax errors in ${syntaxErrors.length} files`);
            this.addCheck('JavaScript Syntax', 'FAIL', 'Syntax errors found', { syntaxErrors });
        }

        return syntaxErrors.length === 0;
    }

    getAllJavaScriptFiles() {
        const jsFiles = [];
        
        const scanDirectory = (dir) => {
            if (!fs.existsSync(dir)) return;
            
            const items = fs.readdirSync(dir);
            items.forEach(item => {
                const fullPath = path.join(dir, item);
                const stat = fs.statSync(fullPath);
                
                if (stat.isDirectory() && !['node_modules', '.git', 'backups'].includes(item)) {
                    scanDirectory(fullPath);
                } else if (stat.isFile() && item.endsWith('.js')) {
                    jsFiles.push(fullPath);
                }
            });
        };

        scanDirectory('js');
        return jsFiles;
    }

    hasSyntaxIssues(content, filename) {
        // Basic syntax checks
        const issues = [];
        
        // Check for unmatched brackets
        const brackets = { '(': ')', '[': ']', '{': '}' };
        const stack = [];
        
        for (let i = 0; i < content.length; i++) {
            const char = content[i];
            if (brackets[char]) {
                stack.push(char);
            } else if (Object.values(brackets).includes(char)) {
                const last = stack.pop();
                if (!last || brackets[last] !== char) {
                    issues.push(`Unmatched bracket at position ${i}`);
                }
            }
        }
        
        if (stack.length > 0) {
            issues.push(`Unclosed brackets: ${stack.join(', ')}`);
        }
        
        // Check for common syntax errors
        const commonErrors = [
            /function\s+\w+\s*\([^)]*\)\s*{[^}]*$/m, // Unclosed function
            /if\s*\([^)]*\)\s*{[^}]*$/m, // Unclosed if statement
            /for\s*\([^)]*\)\s*{[^}]*$/m, // Unclosed for loop
            /while\s*\([^)]*\)\s*{[^}]*$/m, // Unclosed while loop
        ];
        
        commonErrors.forEach((pattern, index) => {
            if (pattern.test(content)) {
                issues.push(`Potential unclosed block detected (pattern ${index + 1})`);
            }
        });
        
        return issues.length > 0;
    }

    // Configuration validation
    checkConfiguration() {
        this.log('Checking configuration files...');
        
        let configIssues = [];
        let validConfigs = [];

        // Check package.json
        if (fs.existsSync('package.json')) {
            try {
                const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
                
                // Check required scripts
                const requiredScripts = ['test', 'test:jest', 'test:integration'];
                const missingScripts = requiredScripts.filter(script => !packageJson.scripts || !packageJson.scripts[script]);
                
                if (missingScripts.length > 0) {
                    configIssues.push(`package.json missing scripts: ${missingScripts.join(', ')}`);
                } else {
                    validConfigs.push('package.json scripts');
                }
                
                // Check dependencies
                if (!packageJson.devDependencies || !packageJson.devDependencies.jest) {
                    configIssues.push('package.json missing Jest testing framework');
                } else {
                    validConfigs.push('package.json dependencies');
                }
            } catch (error) {
                configIssues.push(`package.json parse error: ${error.message}`);
            }
        } else {
            configIssues.push('package.json not found');
        }

        // Check vercel.json
        if (fs.existsSync('vercel.json')) {
            try {
                const vercelJson = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
                
                // Check security headers
                if (!vercelJson.headers || !Array.isArray(vercelJson.headers)) {
                    configIssues.push('vercel.json missing security headers configuration');
                } else {
                    const hasSecurityHeaders = vercelJson.headers.some(header => 
                        header.headers && header.headers.some(h => 
                            ['X-Content-Type-Options', 'X-Frame-Options', 'X-XSS-Protection'].includes(h.key)
                        )
                    );
                    
                    if (hasSecurityHeaders) {
                        validConfigs.push('vercel.json security headers');
                    } else {
                        configIssues.push('vercel.json missing required security headers');
                    }
                }
            } catch (error) {
                configIssues.push(`vercel.json parse error: ${error.message}`);
            }
        } else {
            this.warning('vercel.json not found (may not be needed for all deployments)');
        }

        if (configIssues.length === 0) {
            this.success('Configuration files valid');
            this.addCheck('Configuration', 'PASS', 'All configuration files valid', { validConfigs });
        } else {
            this.error('Configuration issues found');
            this.addCheck('Configuration', 'FAIL', 'Configuration issues detected', { configIssues });
        }

        return configIssues.length === 0;
    }

    // Test coverage verification
    checkTestCoverage() {
        this.log('Checking test coverage...');
        
        const testDirectories = ['__tests__'];
        let testFiles = [];
        let missingTests = [];

        // Find all test files
        testDirectories.forEach(dir => {
            if (fs.existsSync(dir)) {
                const files = this.getTestFiles(dir);
                testFiles.push(...files);
            }
        });

        // Check for required test categories
        const requiredTestCategories = [
            'integrationController.test.js',
            'sharedServicesIntegration.test.js',
            'endToEndWorkflows.test.js',
            'ComprehensiveIntegrationTests.test.js',
            'PerformanceTests.test.js'
        ];

        requiredTestCategories.forEach(category => {
            const found = testFiles.some(file => file.includes(category));
            if (!found) {
                missingTests.push(category);
            }
        });

        if (missingTests.length === 0) {
            this.success(`Test coverage complete with ${testFiles.length} test files`);
            this.addCheck('Test Coverage', 'PASS', 'All required test categories present', { testFiles });
        } else {
            this.error(`Missing test categories: ${missingTests.join(', ')}`);
            this.addCheck('Test Coverage', 'FAIL', 'Missing required test categories', { missingTests });
        }

        return missingTests.length === 0;
    }

    getTestFiles(dir) {
        const testFiles = [];
        
        const scanDir = (directory) => {
            if (!fs.existsSync(directory)) return;
            
            const items = fs.readdirSync(directory);
            items.forEach(item => {
                const fullPath = path.join(directory, item);
                const stat = fs.statSync(fullPath);
                
                if (stat.isDirectory()) {
                    scanDir(fullPath);
                } else if (item.endsWith('.test.js') || item.endsWith('.spec.js')) {
                    testFiles.push(fullPath);
                }
            });
        };

        scanDir(dir);
        return testFiles;
    }

    // Documentation completeness
    checkDocumentation() {
        this.log('Checking documentation completeness...');
        
        const requiredDocs = [
            'DEPLOYMENT_CHECKLIST_INTEGRASI_PEMBAYARAN_LAPORAN.md',
            'ROLLBACK_PROCEDURES_INTEGRASI_PEMBAYARAN_LAPORAN.md',
            'MONITORING_ALERTING_INTEGRASI_PEMBAYARAN_LAPORAN.md',
            'PANDUAN_PENGGUNA_INTEGRASI_PEMBAYARAN_LAPORAN.md',
            'TECHNICAL_DOCUMENTATION_INTEGRASI_PEMBAYARAN.md',
            'TROUBLESHOOTING_GUIDE_INTEGRASI_PEMBAYARAN.md'
        ];

        let missingDocs = [];
        let foundDocs = [];

        requiredDocs.forEach(doc => {
            if (fs.existsSync(doc)) {
                foundDocs.push(doc);
            } else {
                missingDocs.push(doc);
            }
        });

        if (missingDocs.length === 0) {
            this.success(`All ${requiredDocs.length} documentation files present`);
            this.addCheck('Documentation', 'PASS', 'All required documentation present', { foundDocs });
        } else {
            this.error(`Missing documentation: ${missingDocs.join(', ')}`);
            this.addCheck('Documentation', 'FAIL', 'Missing required documentation', { missingDocs });
        }

        return missingDocs.length === 0;
    }

    // Security validation
    checkSecurity() {
        this.log('Checking security implementation...');
        
        let securityIssues = [];
        let securityFeatures = [];

        // Check for security-related files
        const securityFiles = [
            'js/shared/TabPermissionManager.js',
            'js/shared/SecurityAuditLogger.js'
        ];

        securityFiles.forEach(file => {
            if (fs.existsSync(file)) {
                securityFeatures.push(file);
            } else {
                securityIssues.push(`Missing security file: ${file}`);
            }
        });

        // Check for security headers in vercel.json
        if (fs.existsSync('vercel.json')) {
            try {
                const vercelJson = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
                const securityHeaders = ['X-Content-Type-Options', 'X-Frame-Options', 'X-XSS-Protection'];
                
                if (vercelJson.headers) {
                    const hasAllHeaders = securityHeaders.every(header =>
                        vercelJson.headers.some(h => 
                            h.headers && h.headers.some(hh => hh.key === header)
                        )
                    );
                    
                    if (hasAllHeaders) {
                        securityFeatures.push('Security headers configured');
                    } else {
                        securityIssues.push('Missing security headers in vercel.json');
                    }
                }
            } catch (error) {
                securityIssues.push('Could not validate security headers');
            }
        }

        if (securityIssues.length === 0) {
            this.success('Security implementation complete');
            this.addCheck('Security', 'PASS', 'All security features implemented', { securityFeatures });
        } else {
            this.error('Security issues found');
            this.addCheck('Security', 'FAIL', 'Security implementation incomplete', { securityIssues });
        }

        return securityIssues.length === 0;
    }

    // Performance optimization validation
    checkPerformanceOptimization() {
        this.log('Checking performance optimization...');
        
        let performanceIssues = [];
        let performanceFeatures = [];

        // Check for performance-related files
        const performanceFiles = [
            'js/shared/LazyLoadingManager.js',
            'js/shared/DataQueryOptimizer.js',
            'js/monitoring/PerformanceMonitor.js'
        ];

        performanceFiles.forEach(file => {
            if (fs.existsSync(file)) {
                performanceFeatures.push(file);
            } else {
                performanceIssues.push(`Missing performance file: ${file}`);
            }
        });

        // Check for caching configuration in vercel.json
        if (fs.existsSync('vercel.json')) {
            try {
                const vercelJson = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
                
                if (vercelJson.headers && vercelJson.headers.some(h => 
                    h.headers && h.headers.some(hh => hh.key === 'Cache-Control')
                )) {
                    performanceFeatures.push('Caching headers configured');
                } else {
                    performanceIssues.push('Missing caching configuration');
                }
            } catch (error) {
                performanceIssues.push('Could not validate caching configuration');
            }
        }

        if (performanceIssues.length === 0) {
            this.success('Performance optimization complete');
            this.addCheck('Performance', 'PASS', 'All performance optimizations implemented', { performanceFeatures });
        } else {
            this.error('Performance optimization issues found');
            this.addCheck('Performance', 'FAIL', 'Performance optimization incomplete', { performanceIssues });
        }

        return performanceIssues.length === 0;
    }

    // Generate comprehensive report
    generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                totalChecks: this.results.checks.length,
                passed: this.results.passed,
                failed: this.results.failed,
                warnings: this.results.warnings,
                overallStatus: this.results.failed === 0 ? 'READY' : 'NOT READY'
            },
            checks: this.results.checks,
            recommendations: this.generateRecommendations()
        };

        // Write report to file
        fs.writeFileSync('production-readiness-report.json', JSON.stringify(report, null, 2));
        
        return report;
    }

    generateRecommendations() {
        const recommendations = [];
        
        this.results.checks.forEach(check => {
            if (check.status === 'FAIL') {
                switch (check.name) {
                    case 'Required Files':
                        recommendations.push('Install missing files before deployment');
                        break;
                    case 'JavaScript Syntax':
                        recommendations.push('Fix JavaScript syntax errors before deployment');
                        break;
                    case 'Configuration':
                        recommendations.push('Update configuration files to meet production standards');
                        break;
                    case 'Test Coverage':
                        recommendations.push('Implement missing test categories for comprehensive coverage');
                        break;
                    case 'Documentation':
                        recommendations.push('Complete all required documentation before deployment');
                        break;
                    case 'Security':
                        recommendations.push('Implement all security features before production deployment');
                        break;
                    case 'Performance':
                        recommendations.push('Complete performance optimization implementation');
                        break;
                }
            }
        });

        if (recommendations.length === 0) {
            recommendations.push('System is ready for production deployment');
        }

        return recommendations;
    }

    // Run all checks
    async runAllChecks() {
        this.log('Starting production readiness verification...');
        
        const checks = [
            () => this.checkRequiredFiles(),
            () => this.checkJavaScriptSyntax(),
            () => this.checkConfiguration(),
            () => this.checkTestCoverage(),
            () => this.checkDocumentation(),
            () => this.checkSecurity(),
            () => this.checkPerformanceOptimization()
        ];

        for (const check of checks) {
            try {
                await check();
            } catch (error) {
                this.error(`Check failed: ${error.message}`);
            }
        }

        const report = this.generateReport();
        
        this.log('\n=== PRODUCTION READINESS SUMMARY ===');
        this.log(`Total Checks: ${report.summary.totalChecks}`);
        this.log(`Passed: ${report.summary.passed}`);
        this.log(`Failed: ${report.summary.failed}`);
        this.log(`Warnings: ${report.summary.warnings}`);
        this.log(`Overall Status: ${report.summary.overallStatus}`);
        
        if (report.recommendations.length > 0) {
            this.log('\n=== RECOMMENDATIONS ===');
            report.recommendations.forEach((rec, index) => {
                this.log(`${index + 1}. ${rec}`);
            });
        }
        
        this.log(`\nDetailed report saved to: production-readiness-report.json`);
        
        return report.summary.overallStatus === 'READY';
    }
}

// Run verification if called directly
const isMainModule = import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}` || 
                     import.meta.url.endsWith(path.basename(process.argv[1]));

if (isMainModule) {
    const verifier = new ProductionReadinessVerifier();
    verifier.runAllChecks().then(isReady => {
        process.exit(isReady ? 0 : 1);
    }).catch(error => {
        console.error('Verification failed:', error);
        process.exit(1);
    });
}

// Browser compatibility - assign to window object
if (typeof window !== 'undefined') {
    window.ProductionReadinessVerifier = ProductionReadinessVerifier;
}

// Node.js compatibility
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProductionReadinessVerifier;
}