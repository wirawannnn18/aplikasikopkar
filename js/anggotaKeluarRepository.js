// Anggota Keluar Repository Module
// Handles data access and persistence for member exit features

/**
 * Get all anggota with status "Keluar"
 * @returns {array} Array of anggota keluar records
 */
function getAnggotaKeluar() {
    try {
        const anggota = JSON.parse(localStorage.getItem('anggota') || '[]');
        return anggota.filter(a => a.statusKeanggotaan === 'Keluar');
    } catch (error) {
        console.error('Error getting anggota keluar:', error);
        return [];
    }
}

/**
 * Save anggota keluar data
 * @param {object} data - Anggota data to save
 * @returns {boolean} Success status
 */
function saveAnggotaKeluar(data) {
    try {
        const anggota = JSON.parse(localStorage.getItem('anggota') || '[]');
        const index = anggota.findIndex(a => a.id === data.id);
        
        if (index !== -1) {
            anggota[index] = { ...anggota[index], ...data };
            localStorage.setItem('anggota', JSON.stringify(anggota));
            return true;
        }
        
        return false;
    } catch (error) {
        console.error('Error saving anggota keluar:', error);
        return false;
    }
}

/**
 * Get pengembalian records by anggota ID
 * @param {string} anggotaId - ID of the anggota
 * @returns {array} Array of pengembalian records
 */
function getPengembalianByAnggota(anggotaId) {
    try {
        const pengembalian = JSON.parse(localStorage.getItem('pengembalian') || '[]');
        return pengembalian.filter(p => p.anggotaId === anggotaId);
    } catch (error) {
        console.error('Error getting pengembalian:', error);
        return [];
    }
}

/**
 * Get all pengembalian records
 * @returns {array} Array of all pengembalian records
 */
function getAllPengembalian() {
    try {
        return JSON.parse(localStorage.getItem('pengembalian') || '[]');
    } catch (error) {
        console.error('Error getting all pengembalian:', error);
        return [];
    }
}

/**
 * Save pengembalian record
 * @param {object} data - Pengembalian data to save
 * @returns {object} Result with success status and pengembalian ID
 */
function savePengembalian(data) {
    try {
        const pengembalian = JSON.parse(localStorage.getItem('pengembalian') || '[]');
        
        // Generate ID if not provided
        if (!data.id) {
            data.id = generateId();
        }
        
        // Add timestamps
        if (!data.createdAt) {
            data.createdAt = new Date().toISOString();
        }
        
        pengembalian.push(data);
        localStorage.setItem('pengembalian', JSON.stringify(pengembalian));
        
        return {
            success: true,
            id: data.id
        };
    } catch (error) {
        console.error('Error saving pengembalian:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Update pengembalian record
 * @param {string} pengembalianId - ID of the pengembalian
 * @param {object} updates - Fields to update
 * @returns {boolean} Success status
 */
function updatePengembalian(pengembalianId, updates) {
    try {
        const pengembalian = JSON.parse(localStorage.getItem('pengembalian') || '[]');
        const index = pengembalian.findIndex(p => p.id === pengembalianId);
        
        if (index !== -1) {
            pengembalian[index] = { ...pengembalian[index], ...updates };
            localStorage.setItem('pengembalian', JSON.stringify(pengembalian));
            return true;
        }
        
        return false;
    } catch (error) {
        console.error('Error updating pengembalian:', error);
        return false;
    }
}

/**
 * Get pengembalian by ID
 * @param {string} pengembalianId - ID of the pengembalian
 * @returns {object|null} Pengembalian record or null
 */
function getPengembalianById(pengembalianId) {
    try {
        const pengembalian = JSON.parse(localStorage.getItem('pengembalian') || '[]');
        return pengembalian.find(p => p.id === pengembalianId) || null;
    } catch (error) {
        console.error('Error getting pengembalian by ID:', error);
        return null;
    }
}

/**
 * Update anggota status and metadata
 * @param {string} anggotaId - ID of the anggota
 * @param {string} status - New status
 * @param {object} metadata - Additional metadata to update
 * @returns {boolean} Success status
 */
function updateAnggotaStatus(anggotaId, status, metadata = {}) {
    try {
        const anggota = JSON.parse(localStorage.getItem('anggota') || '[]');
        const index = anggota.findIndex(a => a.id === anggotaId);
        
        if (index !== -1) {
            anggota[index] = {
                ...anggota[index],
                statusKeanggotaan: status,
                ...metadata
            };
            localStorage.setItem('anggota', JSON.stringify(anggota));
            return true;
        }
        
        return false;
    } catch (error) {
        console.error('Error updating anggota status:', error);
        return false;
    }
}

/**
 * Get anggota by ID
 * @param {string} anggotaId - ID of the anggota
 * @returns {object|null} Anggota record or null
 */
function getAnggotaById(anggotaId) {
    try {
        const anggota = JSON.parse(localStorage.getItem('anggota') || '[]');
        return anggota.find(a => a.id === anggotaId) || null;
    } catch (error) {
        console.error('Error getting anggota by ID:', error);
        return null;
    }
}

/**
 * Save audit log entry
 * @param {object} logEntry - Audit log entry
 * @returns {boolean} Success status
 */
function saveAuditLog(logEntry) {
    try {
        const auditLogs = JSON.parse(localStorage.getItem('auditLogsAnggotaKeluar') || '[]');
        
        // Generate ID if not provided
        if (!logEntry.id) {
            logEntry.id = generateId();
        }
        
        // Add timestamp if not provided
        if (!logEntry.timestamp) {
            logEntry.timestamp = new Date().toISOString();
        }
        
        auditLogs.push(logEntry);
        localStorage.setItem('auditLogsAnggotaKeluar', JSON.stringify(auditLogs));
        
        return true;
    } catch (error) {
        console.error('Error saving audit log:', error);
        return false;
    }
}

/**
 * Get audit logs for an anggota
 * @param {string} anggotaId - ID of the anggota
 * @returns {array} Array of audit log entries
 */
function getAuditLogsByAnggota(anggotaId) {
    try {
        const auditLogs = JSON.parse(localStorage.getItem('auditLogsAnggotaKeluar') || '[]');
        return auditLogs.filter(log => log.anggotaId === anggotaId);
    } catch (error) {
        console.error('Error getting audit logs:', error);
        return [];
    }
}

/**
 * Get all audit logs
 * @returns {array} Array of all audit log entries
 */
function getAllAuditLogs() {
    try {
        return JSON.parse(localStorage.getItem('auditLogsAnggotaKeluar') || '[]');
    } catch (error) {
        console.error('Error getting all audit logs:', error);
        return [];
    }
}
