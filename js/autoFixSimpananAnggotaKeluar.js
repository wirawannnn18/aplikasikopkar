// Auto-Fix Module: Simpanan Anggota Keluar
// Automatically fixes simpanan data for anggota keluar on app load
// This ensures anggota keluar never appear in simpanan menus

/**
 * Auto-fix simpanan data for anggota keluar
 * Runs automatically when the app loads
 * Zero out all simpanan balances for anggota with statusKeanggotaan = 'Keluar'
 */
(function autoFixSimpananAnggotaKeluar() {
    try {
        // Only run if localStorage is available
        if (typeof localStorage === 'undefined') {
            return;
        }
        
        // Get data
        const anggota = JSON.parse(localStorage.getItem('anggota') || '[]');
        const anggotaKeluarIds = anggota
            .filter(a => a.statusKeanggotaan === 'Keluar')
            .map(a => a.id);
        
        // If no anggota keluar, nothing to fix
        if (anggotaKeluarIds.length === 0) {
            return;
        }
        
        let totalFixed = 0;
        const today = new Date().toISOString().split('T')[0];
        
        // Fix Simpanan Pokok
        const simpananPokok = JSON.parse(localStorage.getItem('simpananPokok') || '[]');
        let pokokFixed = false;
        const fixedSimpananPokok = simpananPokok.map(s => {
            if (anggotaKeluarIds.includes(s.anggotaId) && s.jumlah > 0) {
                pokokFixed = true;
                totalFixed++;
                return {
                    ...s,
                    saldoSebelumPengembalian: s.saldoSebelumPengembalian || s.jumlah,
                    jumlah: 0,
                    statusPengembalian: 'Dikembalikan',
                    tanggalPengembalian: s.tanggalPengembalian || today,
                    autoFixed: true,
                    autoFixedAt: new Date().toISOString()
                };
            }
            return s;
        });
        
        if (pokokFixed) {
            localStorage.setItem('simpananPokok', JSON.stringify(fixedSimpananPokok));
        }
        
        // Fix Simpanan Wajib
        const simpananWajib = JSON.parse(localStorage.getItem('simpananWajib') || '[]');
        let wajibFixed = false;
        const fixedSimpananWajib = simpananWajib.map(s => {
            if (anggotaKeluarIds.includes(s.anggotaId) && s.jumlah > 0) {
                wajibFixed = true;
                totalFixed++;
                return {
                    ...s,
                    saldoSebelumPengembalian: s.saldoSebelumPengembalian || s.jumlah,
                    jumlah: 0,
                    statusPengembalian: 'Dikembalikan',
                    tanggalPengembalian: s.tanggalPengembalian || today,
                    autoFixed: true,
                    autoFixedAt: new Date().toISOString()
                };
            }
            return s;
        });
        
        if (wajibFixed) {
            localStorage.setItem('simpananWajib', JSON.stringify(fixedSimpananWajib));
        }
        
        // Fix Simpanan Sukarela
        const simpananSukarela = JSON.parse(localStorage.getItem('simpananSukarela') || '[]');
        let sukarelaFixed = false;
        const fixedSimpananSukarela = simpananSukarela.map(s => {
            if (anggotaKeluarIds.includes(s.anggotaId) && s.jumlah > 0) {
                sukarelaFixed = true;
                totalFixed++;
                return {
                    ...s,
                    saldoSebelumPengembalian: s.saldoSebelumPengembalian || s.jumlah,
                    jumlah: 0,
                    statusPengembalian: 'Dikembalikan',
                    tanggalPengembalian: s.tanggalPengembalian || today,
                    autoFixed: true,
                    autoFixedAt: new Date().toISOString()
                };
            }
            return s;
        });
        
        if (sukarelaFixed) {
            localStorage.setItem('simpananSukarela', JSON.stringify(fixedSimpananSukarela));
        }
        
        // Log if any fixes were made
        if (totalFixed > 0) {
            console.log(`[Auto-Fix] ✅ Fixed ${totalFixed} simpanan records for ${anggotaKeluarIds.length} anggota keluar`);
            
            // Store fix log
            const fixLog = JSON.parse(localStorage.getItem('autoFixLog') || '[]');
            fixLog.push({
                timestamp: new Date().toISOString(),
                module: 'autoFixSimpananAnggotaKeluar',
                recordsFixed: totalFixed,
                anggotaKeluarCount: anggotaKeluarIds.length,
                details: {
                    simpananPokok: pokokFixed,
                    simpananWajib: wajibFixed,
                    simpananSukarela: sukarelaFixed
                }
            });
            
            // Keep only last 100 logs
            if (fixLog.length > 100) {
                fixLog.splice(0, fixLog.length - 100);
            }
            
            localStorage.setItem('autoFixLog', JSON.stringify(fixLog));
        }
        
    } catch (error) {
        console.error('[Auto-Fix] Error in autoFixSimpananAnggotaKeluar:', error);
    }
})();

// Export for manual trigger if needed
if (typeof window !== 'undefined') {
    window.autoFixSimpananAnggotaKeluar = function() {
        console.log('[Auto-Fix] Manual trigger requested, reloading page...');
        location.reload();
    };
}
