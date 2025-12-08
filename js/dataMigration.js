// Data Migration Module
// Handles migration of old data with statusKeanggotaan = 'Keluar' to new design
// Task 7: Create data migration script

/**
 * Migrate old data with statusKeanggotaan = 'Keluar'
 * This function should be run once when updating to new design
 * Task 7.1: Implement migrateAnggotaKeluarData() function
 */
function migrateAnggotaKeluarData() {
    try {
        console.log('Starting data migration for anggota keluar...');
        
        // Create backup before migration (Requirement 10.2)
        const backup = {
            anggota: localStorage.getItem('anggota'),
            simpananPokok: localStorage.getItem('simpananPokok'),
            simpananWajib: localStorage.getItem('simpananWajib'),
            simpananSukarela: localStorage.getItem('simpananSukarela'),
            penjualan: localStorage.getItem('penjualan'),
            pinjaman: localStorage.getItem('pinjaman'),
            pembayaranHutangPiutang: localStorage.getItem('pembayaranHutangPiutang'),
            timestamp: new Date().toISOString()
        };
        localStorage.setItem('migration_backup_anggota_keluar', JSON.stringify(backup));
        console.log('Backup created at key: migration_backup_anggota_keluar');
        
        // Get all anggota
        let anggotaList = JSON.parse(localStorage.getItem('anggota') || '[]');
        const anggotaKeluarList = anggotaList.filter(a => a.statusKeanggotaan === 'Keluar');
        
        console.log(`Found ${anggotaKeluarList.length} anggota with statusKeanggotaan = 'Keluar'`);
        
        if (anggotaKeluarList.length === 0) {
            console.log('No anggota keluar found, migration not needed');
            return {
                success: true,
                message: 'No migration needed',
                stats: {
                    totalFound: 0,
                    deleted: 0,
                    updated: 0,
                    skipped: 0
                }
            };
        }
        
        let deletedCount = 0;
        let updatedCount = 0;
        let skippedCount = 0;
        
        // Process each anggota keluar (Requirement 10.3)
        for (const anggota of anggotaKeluarList) {
            // Check if pengembalian is completed
            if (anggota.pengembalianStatus === 'Selesai') {
                // Validate deletion eligibility
                const validation = validateDeletionEligibility(anggota.id);
                if (validation.valid) {
                    // Delete anggota and related data
                    const deleteResult = autoDeleteAnggotaKeluar(anggota.id);
                    if (deleteResult.success) {
                        deletedCount++;
                        console.log(`✓ Deleted anggota: ${anggota.nama} (${anggota.nik})`);
                    } else {
                        skippedCount++;
                        console.warn(`✗ Failed to delete anggota: ${anggota.nama} (${anggota.nik})`, deleteResult.error);
                    }
                } else {
                    skippedCount++;
                    console.warn(`⊘ Skipped anggota (validation failed): ${anggota.nama} (${anggota.nik})`, validation.error);
                }
            } else {
                // Pengembalian not completed, update to status = 'Nonaktif' (Requirement 10.4)
                const index = anggotaList.findIndex(a => a.id === anggota.id);
                if (index !== -1) {
                    delete anggotaList[index].statusKeanggotaan;
                    anggotaList[index].status = 'Nonaktif';
                    updatedCount++;
                    console.log(`↻ Updated anggota to Nonaktif: ${anggota.nama} (${anggota.nik})`);
                }
            }
        }
        
        // Remove statusKeanggotaan field from all anggota (Requirement 10.5)
        anggotaList = anggotaList.map(a => {
            if (a.hasOwnProperty('statusKeanggotaan')) {
                const { statusKeanggotaan, ...rest } = a;
                return rest;
            }
            return a;
        });
        
        // Save updated anggota list
        localStorage.setItem('anggota', JSON.stringify(anggotaList));
        
        // Create migration audit log (Requirement 10.1)
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const auditLog = {
            id: generateId(),
            timestamp: new Date().toISOString(),
            userId: currentUser.id || 'system',
            userName: currentUser.username || 'System',
            action: 'DATA_MIGRATION_ANGGOTA_KELUAR',
            details: {
                migrationType: 'anggota_keluar_auto_delete',
                totalFound: anggotaKeluarList.length,
                deleted: deletedCount,
                updated: updatedCount,
                skipped: skippedCount,
                backupKey: 'migration_backup_anggota_keluar'
            },
            ipAddress: null,
            severity: 'INFO'
        };
        saveAuditLog(auditLog);
        
        console.log('Migration completed successfully');
        console.log(`Total: ${anggotaKeluarList.length}, Deleted: ${deletedCount}, Updated: ${updatedCount}, Skipped: ${skippedCount}`);
        
        return {
            success: true,
            message: 'Migration completed successfully',
            stats: {
                totalFound: anggotaKeluarList.length,
                deleted: deletedCount,
                updated: updatedCount,
                skipped: skippedCount
            }
        };
        
    } catch (error) {
        console.error('Error during migration:', error);
        
        // Attempt rollback on error
        try {
            const backup = JSON.parse(localStorage.getItem('migration_backup_anggota_keluar') || '{}');
            if (backup.anggota) {
                localStorage.setItem('anggota', backup.anggota);
                localStorage.setItem('simpananPokok', backup.simpananPokok || '[]');
                localStorage.setItem('simpananWajib', backup.simpananWajib || '[]');
                localStorage.setItem('simpananSukarela', backup.simpananSukarela || '[]');
                localStorage.setItem('penjualan', backup.penjualan || '[]');
                localStorage.setItem('pinjaman', backup.pinjaman || '[]');
                localStorage.setItem('pembayaranHutangPiutang', backup.pembayaranHutangPiutang || '[]');
                console.log('Rollback successful - data restored from backup');
            }
        } catch (rollbackError) {
            console.error('Rollback failed:', rollbackError);
        }
        
        return {
            success: false,
            error: {
                code: 'MIGRATION_ERROR',
                message: error.message
            }
        };
    }
}

/**
 * Check if migration has already been completed and run if needed
 * Task 7.2: Implement checkAndRunMigration() function
 */
function checkAndRunMigration() {
    try {
        // Check if migration already completed (Requirement 10.1)
        const migrationCompleted = localStorage.getItem('migration_anggota_keluar_completed');
        
        if (migrationCompleted === 'true') {
            console.log('Migration already completed, skipping...');
            return {
                success: true,
                message: 'Migration already completed',
                alreadyCompleted: true
            };
        }
        
        // Check if there are any anggota with statusKeanggotaan = 'Keluar'
        const anggotaList = JSON.parse(localStorage.getItem('anggota') || '[]');
        const hasAnggotaKeluar = anggotaList.some(a => a.statusKeanggotaan === 'Keluar');
        
        if (!hasAnggotaKeluar) {
            console.log('No anggota keluar found, marking migration as completed');
            localStorage.setItem('migration_anggota_keluar_completed', 'true');
            return {
                success: true,
                message: 'No migration needed',
                alreadyCompleted: false
            };
        }
        
        // Run migration
        console.log('Running migration...');
        const result = migrateAnggotaKeluarData();
        
        if (result.success) {
            // Mark migration as completed
            localStorage.setItem('migration_anggota_keluar_completed', 'true');
            localStorage.setItem('migration_anggota_keluar_date', new Date().toISOString());
            
            // Show notification to user
            if (typeof showNotification === 'function') {
                showNotification(
                    'success',
                    'Migrasi Data Berhasil',
                    `Migrasi data anggota keluar selesai. ${result.stats.deleted} anggota dihapus, ${result.stats.updated} anggota diupdate.`
                );
            } else {
                alert(`Migrasi data berhasil!\n\nTotal: ${result.stats.totalFound}\nDihapus: ${result.stats.deleted}\nDiupdate: ${result.stats.updated}\nDilewati: ${result.stats.skipped}`);
            }
            
            console.log('Migration marked as completed');
        }
        
        return result;
        
    } catch (error) {
        console.error('Error in checkAndRunMigration:', error);
        return {
            success: false,
            error: {
                code: 'CHECK_MIGRATION_ERROR',
                message: error.message
            }
        };
    }
}

/**
 * Reset migration flag (for testing purposes)
 * This allows re-running the migration
 */
function resetMigrationFlag() {
    localStorage.removeItem('migration_anggota_keluar_completed');
    localStorage.removeItem('migration_anggota_keluar_date');
    console.log('Migration flag reset');
}

/**
 * Get migration status
 * @returns {object} Migration status information
 */
function getMigrationStatus() {
    const completed = localStorage.getItem('migration_anggota_keluar_completed') === 'true';
    const date = localStorage.getItem('migration_anggota_keluar_date');
    const hasBackup = localStorage.getItem('migration_backup_anggota_keluar') !== null;
    
    return {
        completed: completed,
        date: date,
        hasBackup: hasBackup
    };
}
