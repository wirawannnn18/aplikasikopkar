// Koperasi Module

// ===== Date Helper Functions =====

/**
 * Convert ISO date (YYYY-MM-DD) to display format (DD/MM/YYYY)
 * @param {string} isoDate - Date in ISO 8601 format (YYYY-MM-DD)
 * @returns {string} Date in DD/MM/YYYY format, or empty string if invalid
 */
function formatDateToDisplay(isoDate) {
    if (!isoDate || typeof isoDate !== 'string') {
        return '';
    }
    
    try {
        const parts = isoDate.split('T')[0].split('-');
        if (parts.length !== 3) {
            return '';
        }
        
        const year = parts[0];
        const month = parts[1];
        const day = parts[2];
        
        // Validate date components
        if (!year || !month || !day) {
            return '';
        }
        
        return `${day}/${month}/${year}`;
    } catch (error) {
        return '';
    }
}

/**
 * Convert display format (DD/MM/YYYY) to ISO date (YYYY-MM-DD)
 * @param {string} displayDate - Date in DD/MM/YYYY format
 * @returns {string} Date in ISO 8601 format (YYYY-MM-DD), or empty string if invalid
 */
function formatDateToISO(displayDate) {
    if (!displayDate || typeof displayDate !== 'string') {
        return '';
    }
    
    try {
        const parts = displayDate.split('/');
        if (parts.length !== 3) {
            return '';
        }
        
        const dayStr = parts[0].padStart(2, '0');
        const monthStr = parts[1].padStart(2, '0');
        const year = parts[2];
        
        // Validate date components
        if (!dayStr || !monthStr || !year) {
            return '';
        }
        
        // Parse to numbers for validation
        const yearNum = parseInt(year, 10);
        const monthNum = parseInt(monthStr, 10);
        const dayNum = parseInt(dayStr, 10);
        
        // Validate using isValidDate helper
        if (!isValidDate(yearNum, monthNum, dayNum)) {
            return '';
        }
        
        return `${year}-${monthStr}-${dayStr}`;
    } catch (error) {
        return '';
    }
}

/**
 * Get current date in ISO 8601 format (YYYY-MM-DD)
 * @returns {string} Current date in ISO format
 */
function getCurrentDateISO() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Parse date string in various formats (DD/MM/YYYY, YYYY-MM-DD, DD-MM-YYYY)
 * @param {string} dateString - Date string in various formats
 * @returns {string} Date in ISO 8601 format (YYYY-MM-DD), or empty string if invalid
 */
function parseDateFlexible(dateString) {
    if (!dateString || typeof dateString !== 'string') {
        return '';
    }
    
    const trimmed = dateString.trim();
    
    // Try ISO format (YYYY-MM-DD)
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        const parts = trimmed.split('-');
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        const day = parseInt(parts[2], 10);
        
        // Validate date
        if (isValidDate(year, month, day)) {
            return trimmed;
        }
        return '';
    }
    
    // Try DD/MM/YYYY format
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) {
        return formatDateToISO(trimmed);
    }
    
    // Try DD-MM-YYYY format
    if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(trimmed)) {
        const parts = trimmed.split('-');
        const day = parts[0];
        const month = parts[1];
        const year = parts[2];
        return formatDateToISO(`${day}/${month}/${year}`);
    }
    
    return '';
}

/**
 * Validate if a date is valid and within acceptable range
 * @param {number} year - Year
 * @param {number} month - Month (1-12)
 * @param {number} day - Day
 * @returns {boolean} True if date is valid
 */
function isValidDate(year, month, day) {
    // Check year range (not before 1900, not in the future)
    const currentYear = new Date().getFullYear();
    if (year < 1900 || year > currentYear) {
        return false;
    }
    
    // Check month range
    if (month < 1 || month > 12) {
        return false;
    }
    
    // Check day range
    if (day < 1 || day > 31) {
        return false;
    }
    
    // Create date and check if it's valid
    const date = new Date(year, month - 1, day);
    if (isNaN(date.getTime())) {
        return false;
    }
    
    // Check if date is not in the future
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date > today) {
        return false;
    }
    
    // Verify the date components match (handles invalid dates like Feb 31)
    if (date.getFullYear() !== year || 
        date.getMonth() !== month - 1 || 
        date.getDate() !== day) {
        return false;
    }
    
    return true;
}

// ===== End Date Helper Functions =====

// ===== Anggota Filtering Functions =====
//
// This section contains core filtering functions for the Anggota Keluar feature.
// These functions implement the business logic for hiding exited members while
// preserving data integrity for audit and historical purposes.
//
// KEY PRINCIPLES:
// 1. Data Preservation - Never delete anggota data from localStorage
// 2. View Filtering - Apply filtering at display/render time only
// 3. Transaction Safety - Validate anggota eligibility before transactions
// 4. Error Resilience - Handle all edge cases gracefully with safe fallbacks
// 5. User Experience - Provide clear, actionable error messages in Indonesian
//
// FILTERING HIERARCHY:
// - filterActiveAnggota() - For Master Anggota display (includes Nonaktif/Cuti)
// - filterTransactableAnggota() - For transaction dropdowns (Aktif only)
// - validateAnggotaForTransaction() - For individual transaction validation
//

/**
 * Filter anggota to exclude those who have left the koperasi
 * 
 * This function is used to hide exited members from Master Anggota displays
 * while preserving their data in localStorage for audit and historical purposes.
 * 
 * FILTERING LOGIC:
 * - Excludes anggota with statusKeanggotaan === 'Keluar' (old system)
 * - Excludes anggota with tanggalKeluar set (new system)
 * - Excludes anggota with pengembalianStatus set (exit process)
 * - INCLUDES anggota with status 'Nonaktif' or 'Cuti' (they appear in Master Anggota)
 * 
 * ERROR HANDLING:
 * - Validates input using validateArray() helper
 * - Logs errors with comprehensive context
 * - Shows user-friendly error messages
 * - Returns safe fallback (empty array) on errors
 * - Handles individual entry validation errors
 * 
 * VALIDATION RULES:
 * - Input must be an array
 * - Individual entries must be objects with required fields
 * - Missing or invalid entries are excluded with logging
 * 
 * @param {Array<Object>} anggotaList - Array of anggota objects with properties:
 *   @param {string} anggotaList[].id - Required: Unique anggota identifier
 *   @param {string} anggotaList[].statusKeanggotaan - Membership status ('Aktif'|'Keluar')
 *   @param {string} [anggotaList[].tanggalKeluar] - Exit date (ISO format)
 *   @param {string} [anggotaList[].pengembalianStatus] - Return process status
 *   @param {string} [anggotaList[].status] - Activity status ('Aktif'|'Nonaktif'|'Cuti')
 * 
 * @returns {Array<Object>} Filtered array excluding anggota who have left the koperasi
 *   Returns empty array if input is invalid or on errors
 * 
 * @throws {Error} Logs errors but does not throw - returns safe fallback instead
 * 
 * @example
 * // Basic usage - filter Master Anggota display
 * const allAnggota = JSON.parse(localStorage.getItem('anggota') || '[]');
 * const activeAnggota = filterActiveAnggota(allAnggota);
 * // Result: Members who haven't left (includes Nonaktif and Cuti for Master Anggota)
 * 
 * @example
 * // Error handling - invalid input
 * const result = filterActiveAnggota(null);
 * // Result: [] (empty array), error logged and user notified
 * 
 * @example
 * // Mixed data handling
 * const mixedData = [
 *   { id: '1', statusKeanggotaan: 'Aktif', status: 'Aktif' },      // ✅ Included
 *   { id: '2', statusKeanggotaan: 'Aktif', status: 'Nonaktif' },  // ✅ Included (shown in Master)
 *   { id: '3', statusKeanggotaan: 'Keluar' },                     // ❌ Excluded (left)
 *   { id: '4', tanggalKeluar: '2024-01-15' },                     // ❌ Excluded (new exit system)
 *   null,                                                         // ❌ Excluded (invalid entry)
 * ];
 * const filtered = filterActiveAnggota(mixedData);
 * // Result: [{ id: '1', ... }, { id: '2', ... }]
 * 
 * @since 1.0.0 - Initial implementation
 * @since 1.1.0 - Added comprehensive error handling and validation
 * 
 * @see {@link filterTransactableAnggota} For transaction-eligible members only
 * @see {@link validateAnggotaForTransaction} For individual member validation
 */
function filterActiveAnggota(anggotaList) {
    try {
        // Enhanced input validation with comprehensive error handling
        // VALIDATION RULES:
        // 1. Input must be an array type (not null, undefined, string, object, etc.)
        // 2. Use validateArray() helper if available for consistent validation
        // 3. Provide safe fallback (empty array) for invalid inputs
        // 4. Log validation failures for debugging and monitoring
        const validation = typeof validateArray === 'function' 
            ? validateArray(anggotaList, 'anggotaList')
            : { valid: Array.isArray(anggotaList), array: anggotaList, fallback: [] };
            
        if (!validation.valid) {
            // ERROR HANDLING PATTERN:
            // 1. Log detailed error information for debugging (technical details)
            // 2. Show user-friendly error message (Indonesian, actionable)
            // 3. Return safe fallback to prevent crashes (empty array)
            // 4. Never throw exceptions - always graceful degradation
            
            if (typeof logError === 'function') {
                logError('filterActiveAnggota', 'Invalid input type', { 
                    inputType: typeof anggotaList,
                    inputValue: anggotaList,
                    expectedType: 'Array'
                });
            }
            
            if (typeof showUserError === 'function') {
                showUserError('invalid_format', 'filterActiveAnggota', { 
                    function: 'filterActiveAnggota',
                    input: typeof anggotaList 
                });
            }
            
            return validation.fallback || [];
        }
        
        const arrayToProcess = validation.array || anggotaList;
        
        // Handle empty array gracefully
        if (arrayToProcess.length === 0) {
            return [];
        }
        
        // Filter out only anggota who have PERMANENTLY LEFT the koperasi
        // This preserves Nonaktif and Cuti members in Master Anggota display
        const filtered = arrayToProcess.filter(a => {
            try {
                // Handle null or undefined entries with detailed logging
                if (!a || typeof a !== 'object') {
                    if (typeof logError === 'function') {
                        logError('filterActiveAnggota', 'Invalid anggota entry found', { 
                            entry: a,
                            entryType: typeof a,
                            isNull: a === null,
                            isUndefined: a === undefined
                        });
                    }
                    return false;
                }
                
                // Validate required fields
                if (!a.id) {
                    if (typeof logError === 'function') {
                        logError('filterActiveAnggota', 'Anggota missing required ID field', { anggota: a });
                    }
                    return false;
                }
                
                // FILTERING LOGIC FOR MASTER ANGGOTA DISPLAY:
                // The goal is to hide only members who have PERMANENTLY LEFT the koperasi
                // while preserving inactive and leave members for administrative purposes
                
                // Check OLD system: statusKeanggotaan === 'Keluar'
                // This is the legacy field used to mark exited members
                if (a.statusKeanggotaan === 'Keluar') {
                    return false; // Exclude - permanently left (old system)
                }
                
                // Check NEW system: has tanggalKeluar (exit date set)
                // This indicates the member has gone through the exit process
                if (a.tanggalKeluar) {
                    return false; // Exclude - permanently left (new system)
                }
                
                // Check NEW system: has pengembalianStatus (went through exit process)
                // This indicates pencairan process is in progress or completed
                if (a.pengembalianStatus) {
                    return false; // Exclude - in exit process or completed
                }
                
                // Include all others (Aktif, Nonaktif, Cuti)
                // IMPORTANT: Nonaktif and Cuti members are shown in Master Anggota
                // but will be filtered out from transaction dropdowns by filterTransactableAnggota()
                return true;
            } catch (filterError) {
                if (typeof logError === 'function') {
                    logError('filterActiveAnggota', 'Error processing individual anggota', { 
                        anggota: a,
                        error: filterError.message
                    });
                }
                return false; // Exclude problematic entries
            }
        });
        
        return filtered;
    } catch (error) {
        if (typeof logError === 'function') {
            logError('filterActiveAnggota', error, { 
                inputLength: anggotaList ? anggotaList.length : 'unknown',
                inputType: typeof anggotaList,
                stackTrace: error.stack
            });
        }
        
        if (typeof showUserError === 'function') {
            showUserError('system_error', 'filterActiveAnggota');
        }
        
        console.error('Critical error in filterActiveAnggota:', error);
        
        // Return empty array as safe fallback
        return [];
    }
}

/**
 * Get count of active anggota (excluding those with statusKeanggotaan === 'Keluar')
 * This is a convenience function for displaying member counts in badges and counters.
 * 
 * @returns {number} Count of active anggota
 * 
 * @example
 * const activeCount = getActiveAnggotaCount();
 * console.log(`Total active members: ${activeCount}`);
 */
function getActiveAnggotaCount() {
    const anggota = JSON.parse(localStorage.getItem('anggota') || '[]');
    return filterActiveAnggota(anggota).length;
}

/**
 * Filter anggota to include only those who can participate in transactions
 * This function filters anggota to include only those with:
 * - status === 'Aktif' (active status)
 * - statusKeanggotaan !== 'Keluar' (not exited)
 * 
 * Use this function for transaction dropdowns and searches to ensure
 * only eligible members can perform transactions.
 * 
 * @param {Array} anggotaList - Array of anggota objects
 * @returns {Array} Filtered array of anggota who can transact
 * 
 * @example
 * const allAnggota = JSON.parse(localStorage.getItem('anggota') || '[]');
 * const transactableAnggota = filterTransactableAnggota(allAnggota);
 * // transactableAnggota now contains only members with status === 'Aktif' AND statusKeanggotaan !== 'Keluar'
 */
function filterTransactableAnggota(anggotaList) {
    try {
        // Enhanced input validation with comprehensive error handling
        const validation = typeof validateArray === 'function' 
            ? validateArray(anggotaList, 'anggotaList')
            : { valid: Array.isArray(anggotaList), array: anggotaList, fallback: [] };
            
        if (!validation.valid) {
            if (typeof logError === 'function') {
                logError('filterTransactableAnggota', 'Invalid input type', { 
                    inputType: typeof anggotaList,
                    inputValue: anggotaList,
                    expectedType: 'Array'
                });
            }
            
            if (typeof showUserError === 'function') {
                showUserError('invalid_format', 'filterTransactableAnggota', { 
                    function: 'filterTransactableAnggota',
                    input: typeof anggotaList 
                });
            }
            
            return validation.fallback || [];
        }
        
        const arrayToProcess = validation.array || anggotaList;
        
        // Handle empty array gracefully
        if (arrayToProcess.length === 0) {
            return [];
        }
        
        // Filter to include only active members who haven't left
        const filtered = arrayToProcess.filter(a => {
            try {
                // Handle null or undefined entries with detailed logging
                if (!a || typeof a !== 'object') {
                    if (typeof logError === 'function') {
                        logError('filterTransactableAnggota', 'Invalid anggota entry found', { 
                            entry: a,
                            entryType: typeof a,
                            isNull: a === null,
                            isUndefined: a === undefined
                        });
                    }
                    return false;
                }
                
                // Validate required fields for transaction eligibility
                if (!a.id) {
                    if (typeof logError === 'function') {
                        logError('filterTransactableAnggota', 'Anggota missing required ID field', { anggota: a });
                    }
                    return false;
                }
                
                if (!a.status) {
                    if (typeof logError === 'function') {
                        logError('filterTransactableAnggota', 'Anggota missing status field', { 
                            anggotaId: a.id,
                            anggota: a 
                        });
                    }
                    return false;
                }
                
                // Must have Aktif status
                if (a.status !== 'Aktif') {
                    return false; // Exclude non-aktif and cuti
                }
                
                // Must not have Keluar statusKeanggotaan
                if (a.statusKeanggotaan === 'Keluar') {
                    return false; // Exclude keluar
                }
                
                // Check NEW system: has tanggalKeluar
                if (a.tanggalKeluar) {
                    return false; // Exclude
                }
                
                // Check NEW system: has pengembalianStatus (means they went through exit process)
                if (a.pengembalianStatus) {
                    return false; // Exclude
                }
                
                return true; // Include (active and eligible for transactions)
            } catch (filterError) {
                if (typeof logError === 'function') {
                    logError('filterTransactableAnggota', 'Error processing individual anggota', { 
                        anggota: a,
                        error: filterError.message
                    });
                }
                return false; // Exclude problematic entries
            }
        });
        
        return filtered;
    } catch (error) {
        if (typeof logError === 'function') {
            logError('filterTransactableAnggota', error, { 
                inputLength: anggotaList ? anggotaList.length : 'unknown',
                inputType: typeof anggotaList,
                stackTrace: error.stack
            });
        }
        
        if (typeof showUserError === 'function') {
            showUserError('system_error', 'filterTransactableAnggota');
        }
        
        console.error('Critical error in filterTransactableAnggota:', error);
        
        // Return empty array as safe fallback
        return [];
    }
}

/**
 * Validate if anggota can participate in transactions
 * This function validates that anggota meets all requirements for performing transactions:
 * - Must exist in the system
 * - Must have status === 'Aktif' (not Nonaktif or Cuti)
 * - Must not have statusKeanggotaan === 'Keluar'
 * - Must not have tanggalKeluar (new exit system)
 * - Must not have pengembalianStatus (exit process in progress)
 * 
 * @param {string} anggotaId - ID of the anggota to validate
 * @returns {Object} Validation result with structure:
 *   - valid: boolean indicating if anggota can transact
 *   - error: string error message if validation fails
 *   - anggota: object anggota data if validation succeeds
 * 
 * @example
 * const validation = validateAnggotaForTransaction('A001');
 * if (validation.valid) {
 *     // Proceed with transaction
 *     console.log('Transaction allowed for:', validation.anggota.nama);
 * } else {
 *     // Show error message
 *     alert(validation.error);
 * }
 */
function validateAnggotaForTransaction(anggotaId) {
    try {
        // Enhanced input validation with comprehensive error handling
        if (typeof validateAnggotaId === 'function') {
            const inputValidation = validateAnggotaId(anggotaId);
            if (!inputValidation.valid) {
                if (typeof logError === 'function') {
                    logError('validateAnggotaForTransaction', inputValidation.error, { 
                        anggotaId,
                        validationMessage: inputValidation.message
                    });
                }
                
                if (typeof showUserError === 'function') {
                    showUserError(inputValidation.error, 'validateAnggotaForTransaction');
                }
                
                return {
                    valid: false,
                    error: inputValidation.message || getUserFriendlyMessage('required_field_empty')
                };
            }
        } else {
            // Fallback validation with enhanced checks
            if (!anggotaId) {
                const errorMsg = 'ID anggota tidak boleh kosong';
                if (typeof logError === 'function') {
                    logError('validateAnggotaForTransaction', 'Empty anggotaId', { anggotaId });
                }
                return { valid: false, error: errorMsg };
            }
            
            if (typeof anggotaId !== 'string') {
                const errorMsg = 'ID anggota harus berupa string';
                if (typeof logError === 'function') {
                    logError('validateAnggotaForTransaction', 'Invalid anggotaId type', { 
                        anggotaId,
                        type: typeof anggotaId 
                    });
                }
                return { valid: false, error: errorMsg };
            }
            
            if (anggotaId.trim().length === 0) {
                const errorMsg = 'ID anggota tidak boleh kosong';
                if (typeof logError === 'function') {
                    logError('validateAnggotaForTransaction', 'Empty anggotaId after trim', { anggotaId });
                }
                return { valid: false, error: errorMsg };
            }
        }

        // Get anggota data with comprehensive error handling
        let anggotaList;
        try {
            if (typeof safeGetLocalStorage === 'function') {
                anggotaList = safeGetLocalStorage('anggota', []);
            } else {
                const rawData = localStorage.getItem('anggota');
                if (rawData === null) {
                    if (typeof logError === 'function') {
                        logError('validateAnggotaForTransaction', 'No anggota data in localStorage', { anggotaId });
                    }
                    return {
                        valid: false,
                        error: getUserFriendlyMessage('data_not_found', 'Data anggota tidak ditemukan')
                    };
                }
                anggotaList = JSON.parse(rawData);
            }
        } catch (parseError) {
            if (typeof logError === 'function') {
                logError('validateAnggotaForTransaction', 'Failed to parse anggota data', { 
                    anggotaId,
                    parseError: parseError.message
                });
            }
            
            if (typeof showUserError === 'function') {
                showUserError('data_corrupted', 'validateAnggotaForTransaction');
            }
            
            return {
                valid: false,
                error: getUserFriendlyMessage('data_corrupted')
            };
        }
        
        // Validate anggota list structure
        if (!Array.isArray(anggotaList)) {
            if (typeof logError === 'function') {
                logError('validateAnggotaForTransaction', 'Invalid anggota data structure', { 
                    anggotaId,
                    dataType: typeof anggotaList,
                    isArray: Array.isArray(anggotaList)
                });
            }
            
            if (typeof showUserError === 'function') {
                showUserError('data_corrupted', 'validateAnggotaForTransaction');
            }
            
            return {
                valid: false,
                error: getUserFriendlyMessage('data_corrupted')
            };
        }
        
        // Find anggota with enhanced error handling
        let anggota;
        try {
            anggota = anggotaList.find(a => a && a.id === anggotaId);
        } catch (findError) {
            if (typeof logError === 'function') {
                logError('validateAnggotaForTransaction', 'Error finding anggota', { 
                    anggotaId,
                    findError: findError.message,
                    anggotaListLength: anggotaList.length
                });
            }
            return {
                valid: false,
                error: getUserFriendlyMessage('system_error')
            };
        }
        
        // Check if anggota exists
        if (!anggota) {
            if (typeof logError === 'function') {
                logError('validateAnggotaForTransaction', 'Anggota not found', { 
                    anggotaId,
                    totalAnggota: anggotaList.length,
                    availableIds: anggotaList.slice(0, 5).map(a => a?.id).filter(Boolean)
                });
            }
            
            if (typeof showUserError === 'function') {
                showUserError('anggota_not_found', 'validateAnggotaForTransaction');
            }
            
            return {
                valid: false,
                error: getUserFriendlyMessage('anggota_not_found')
            };
        }
        
        // Validate anggota object structure
        if (!anggota.nama) {
            if (typeof logError === 'function') {
                logError('validateAnggotaForTransaction', 'Invalid anggota structure', { 
                    anggotaId,
                    anggota: anggota 
                });
            }
            return {
                valid: false,
                error: 'Data anggota tidak lengkap'
            };
        }
        
        // Check if anggota has left the koperasi (old system)
        if (anggota.statusKeanggotaan === 'Keluar') {
            return {
                valid: false,
                error: `Anggota ${anggota.nama} sudah keluar dari koperasi dan tidak dapat melakukan transaksi`
            };
        }
        
        // Check if anggota is non-aktif
        if (anggota.status === 'Nonaktif') {
            return {
                valid: false,
                error: `Anggota ${anggota.nama} berstatus non-aktif dan tidak dapat melakukan transaksi`
            };
        }
        
        // Check if anggota is on leave (cuti)
        if (anggota.status === 'Cuti') {
            return {
                valid: false,
                error: `Anggota ${anggota.nama} sedang cuti dan tidak dapat melakukan transaksi`
            };
        }
        
        // Check if anggota has tanggalKeluar (new exit system)
        if (anggota.tanggalKeluar) {
            const formattedDate = typeof formatDateToDisplay === 'function' 
                ? formatDateToDisplay(anggota.tanggalKeluar) 
                : anggota.tanggalKeluar;
            return {
                valid: false,
                error: `Anggota ${anggota.nama} sudah keluar dari koperasi pada ${formattedDate} dan tidak dapat melakukan transaksi`
            };
        }
        
        // Check if anggota has pengembalianStatus (exit process in progress)
        if (anggota.pengembalianStatus) {
            return {
                valid: false,
                error: `Anggota ${anggota.nama} sedang dalam proses keluar (status: ${anggota.pengembalianStatus}) dan tidak dapat melakukan transaksi`
            };
        }
        
        // Validation passed - anggota can perform transactions
        return {
            valid: true,
            anggota: anggota
        };
        
    } catch (error) {
        if (typeof logError === 'function') {
            logError('validateAnggotaForTransaction', error, { anggotaId });
        }
        console.error('Error validating anggota for transaction:', error);
        return {
            valid: false,
            error: 'Terjadi kesalahan saat validasi anggota'
        };
    }
}

// ===== End Anggota Filtering Functions =====

function renderKoperasi() {
    const content = document.getElementById('mainContent');
    const koperasi = JSON.parse(localStorage.getItem('koperasi'));
    
    content.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2 style="color: #2d6a4f; font-weight: 700;">
                <i class="bi bi-building me-2"></i>Data Koperasi
            </h2>
        </div>
        <div class="row">
            <div class="col-md-4">
                <div class="card">
                    <div class="card-header">
                        <i class="bi bi-image me-2"></i>Logo Koperasi
                    </div>
                    <div class="card-body text-center">
                        <div id="logoPreview" class="mb-3" style="min-height: 200px; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #f8f9fa 0%, #e9f5f0 100%); border-radius: 15px; border: 3px dashed #95d5b2;">
                            ${koperasi.logo ? 
                                `<img src="${koperasi.logo}" alt="Logo Koperasi" style="max-width: 100%; max-height: 200px; object-fit: contain;">` : 
                                `<div style="color: #95d5b2;">
                                    <i class="bi bi-image" style="font-size: 4rem;"></i>
                                    <p class="mt-2 mb-0">Belum ada logo</p>
                                </div>`
                            }
                        </div>
                        <input type="file" id="logoInput" accept="image/*" class="form-control mb-2" onchange="previewLogo(event)">
                        <small class="text-muted">Format: JPG, PNG, GIF (Max 2MB)</small>
                    </div>
                </div>
            </div>
            <div class="col-md-8">
                <div class="card">
                    <div class="card-header">
                        <i class="bi bi-pencil-square me-2"></i>Informasi Koperasi
                    </div>
                    <div class="card-body">
                        <form id="koperasiForm">
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label class="form-label">
                                            <i class="bi bi-building me-1"></i>Nama Koperasi
                                        </label>
                                        <input type="text" class="form-control" id="namaKoperasi" value="${koperasi.nama}" required>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label class="form-label">
                                            <i class="bi bi-telephone me-1"></i>Telepon
                                        </label>
                                        <input type="text" class="form-control" id="teleponKoperasi" value="${koperasi.telepon}">
                                    </div>
                                </div>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">
                                    <i class="bi bi-geo-alt me-1"></i>Alamat
                                </label>
                                <textarea class="form-control" id="alamatKoperasi" rows="3">${koperasi.alamat}</textarea>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">
                                    <i class="bi bi-cash-stack me-1"></i>Modal Awal
                                </label>
                                <input type="number" class="form-control" id="modalAwal" value="${koperasi.modalAwal}">
                            </div>
                            <button type="submit" class="btn btn-primary">
                                <i class="bi bi-save me-2"></i>Simpan Data
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('koperasiForm').addEventListener('submit', saveKoperasi);
}

function previewLogo(event) {
    const file = event.target.files[0];
    if (file) {
        // Check file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            showAlert('Ukuran file terlalu besar! Maksimal 2MB', 'warning');
            event.target.value = '';
            return;
        }
        
        // Check file type
        if (!file.type.startsWith('image/')) {
            showAlert('File harus berupa gambar!', 'warning');
            event.target.value = '';
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            const logoPreview = document.getElementById('logoPreview');
            logoPreview.innerHTML = `<img src="${e.target.result}" alt="Logo Preview" style="max-width: 100%; max-height: 200px; object-fit: contain;">`;
            
            // Save to localStorage
            const koperasi = JSON.parse(localStorage.getItem('koperasi'));
            koperasi.logo = e.target.result;
            localStorage.setItem('koperasi', JSON.stringify(koperasi));
            showAlert('Logo berhasil diupload', 'success');
        };
        reader.readAsDataURL(file);
    }
}

function saveKoperasi(e) {
    e.preventDefault();
    const koperasiLama = JSON.parse(localStorage.getItem('koperasi'));
    const modalAwalLama = koperasiLama.modalAwal || 0;
    const modalAwalBaru = parseFloat(document.getElementById('modalAwal').value) || 0;
    
    const koperasi = {
        nama: document.getElementById('namaKoperasi').value,
        telepon: document.getElementById('teleponKoperasi').value,
        alamat: document.getElementById('alamatKoperasi').value,
        modalAwal: modalAwalBaru,
        logo: koperasiLama.logo || '' // Keep existing logo
    };
    
    // Jika modal awal berubah, catat di jurnal
    if (modalAwalBaru !== modalAwalLama) {
        const selisih = modalAwalBaru - modalAwalLama;
        if (selisih !== 0) {
            // Jurnal untuk perubahan modal awal
            addJurnal('Perubahan Modal Awal Koperasi', [
                { akun: '1-1000', debit: selisih > 0 ? selisih : 0, kredit: selisih < 0 ? Math.abs(selisih) : 0 },  // Kas
                { akun: '3-1000', debit: selisih < 0 ? Math.abs(selisih) : 0, kredit: selisih > 0 ? selisih : 0 }   // Modal Koperasi
            ]);
        }
    }
    
    localStorage.setItem('koperasi', JSON.stringify(koperasi));
    showAlert('Data koperasi berhasil disimpan dan jurnal telah diupdate');
    renderKoperasi();
}

// Sorting state for anggota table
let anggotaSortState = {
    column: null,
    direction: 'asc'
};

function renderAnggota() {
    // Run migration to fix status for anggota keluar (Task 2: Fix Status Anggota Keluar)
    if (typeof migrateAnggotaKeluarStatus === 'function') {
        const migrationResult = migrateAnggotaKeluarStatus();
        if (migrationResult.success && migrationResult.fixed > 0) {
            console.log(`✓ Status migration: Fixed ${migrationResult.fixed} anggota records`);
        }
    }
    
    const content = document.getElementById('mainContent');
    const allAnggota = JSON.parse(localStorage.getItem('anggota') || '[]');
    
    // Filter out anggota keluar from Master Anggota display
    // Data is preserved in localStorage for audit purposes
    const anggota = filterActiveAnggota(allAnggota);
    const totalActive = anggota.length;
    
    content.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2 style="color: #2d6a4f; font-weight: 700;">
                <i class="bi bi-people me-2"></i>Master Anggota
            </h2>
            <span class="badge" style="background: linear-gradient(135deg, #2d6a4f 0%, #52b788 100%); font-size: 1rem;">
                Total: ${totalActive} Anggota
            </span>
        </div>
        
        <div class="mb-3">
            <button class="btn btn-primary" onclick="showAnggotaModal()">
                <i class="bi bi-plus-circle me-1"></i> Tambah Anggota
            </button>
            <button class="btn btn-success" onclick="showImportModal()">
                <i class="bi bi-file-earmark-arrow-up me-1"></i> Import Data
            </button>
            <button class="btn btn-info" onclick="downloadTemplateAnggota()">
                <i class="bi bi-download me-1"></i> Download Template
            </button>
            <button class="btn btn-secondary" onclick="exportAnggota()">
                <i class="bi bi-file-earmark-arrow-down me-1"></i> Export Data
            </button>
        </div>
        
        <!-- Filter dan Pencarian -->
        <div class="card mb-3">
            <div class="card-body">
                <div class="row g-3">
                    <div class="col-md-4">
                        <label class="form-label">
                            <i class="bi bi-search me-1"></i>Pencarian
                        </label>
                        <input type="text" class="form-control" id="searchAnggota" 
                            placeholder="Cari NIK, Nama, atau No. Kartu..." 
                            onkeyup="filterAnggota()">
                    </div>
                    <div class="col-md-3">
                        <label class="form-label">
                            <i class="bi bi-building me-1"></i>Departemen
                        </label>
                        <select class="form-select" id="filterDepartemen" onchange="filterAnggota()">
                            <option value="">Semua Departemen</option>
                            ${getDepartemenOptions()}
                        </select>
                    </div>
                    <div class="col-md-2">
                        <label class="form-label">
                            <i class="bi bi-shield-check me-1"></i>Tipe
                        </label>
                        <select class="form-select" id="filterTipe" onchange="filterAnggota()">
                            <option value="">Semua Tipe</option>
                            <option value="Anggota">Anggota</option>
                            <option value="Non-Anggota">Non-Anggota</option>
                            <option value="Umum">Umum</option>
                        </select>
                    </div>
                    <div class="col-md-2">
                        <label class="form-label">
                            <i class="bi bi-toggle-on me-1"></i>Status
                        </label>
                        <select class="form-select" id="filterStatus" onchange="filterAnggota()">
                            <option value="">Semua Status</option>
                            <option value="Aktif">Aktif</option>
                            <option value="Nonaktif">Nonaktif</option>
                            <option value="Cuti">Cuti</option>
                        </select>
                    </div>
                    <div class="col-md-1">
                        <label class="form-label">&nbsp;</label>
                        <button class="btn btn-warning w-100" onclick="resetFilterAnggota()" title="Reset Filter">
                            <i class="bi bi-arrow-clockwise"></i>
                        </button>
                    </div>
                </div>
                <!-- Date Range Filter Row -->
                <div class="row g-3 mt-2">
                    <div class="col-md-3">
                        <label class="form-label">
                            <i class="bi bi-calendar-range me-1"></i>Tanggal Pendaftaran Dari
                        </label>
                        <input type="date" class="form-control" id="filterTanggalDari" onchange="filterAnggota()">
                    </div>
                    <div class="col-md-3">
                        <label class="form-label">
                            <i class="bi bi-calendar-range me-1"></i>Tanggal Pendaftaran Sampai
                        </label>
                        <input type="date" class="form-control" id="filterTanggalSampai" onchange="filterAnggota()">
                    </div>
                    <div class="col-md-6">
                        <label class="form-label">&nbsp;</label>
                        <div class="alert alert-info mb-0 py-2">
                            <small>
                                <i class="bi bi-info-circle me-1"></i>
                                Filter berdasarkan rentang tanggal pendaftaran anggota
                            </small>
                        </div>
                    </div>
                </div>
                <div class="mt-2">
                    <small class="text-muted">
                        <i class="bi bi-info-circle me-1"></i>
                        Menampilkan <strong id="countFiltered">${totalActive}</strong> dari <strong>${totalActive}</strong> anggota
                    </small>
                </div>
            </div>
        </div>
        
        <div class="card">
            <div class="card-header">
                <i class="bi bi-table me-2"></i>Daftar Anggota
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-striped table-hover" id="tableAnggota">
                        <thead>
                            <tr>
                                <th>NIK</th>
                                <th>Nama</th>
                                <th>No. Kartu</th>
                                <th>Departemen</th>
                                <th>Tipe Keanggotaan</th>
                                <th>Status</th>
                                <th style="cursor: pointer;" onclick="sortAnggotaByDate()" title="Klik untuk mengurutkan">
                                    Tanggal Pendaftaran
                                    <i class="bi bi-arrow-down-up ms-1" id="sortIndicator"></i>
                                </th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody id="tbodyAnggota">
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        
        <!-- Modal -->
        <div class="modal fade" id="anggotaModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Form Anggota</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="anggotaForm">
                            <input type="hidden" id="anggotaId">
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label class="form-label">
                                            <i class="bi bi-person-badge me-1"></i>NIK
                                        </label>
                                        <input type="text" class="form-control" id="nik" required>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label class="form-label">
                                            <i class="bi bi-card-text me-1"></i>No. Kartu Anggota
                                        </label>
                                        <input type="text" class="form-control" id="noKartu" required>
                                    </div>
                                </div>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">
                                    <i class="bi bi-person me-1"></i>Nama Lengkap
                                </label>
                                <input type="text" class="form-control" id="nama" required>
                            </div>
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label class="form-label">
                                            <i class="bi bi-building me-1"></i>Departemen
                                        </label>
                                        <select class="form-select" id="departemen" required>
                                            <option value="">-- Pilih Departemen --</option>
                                            ${getDepartemenOptions()}
                                        </select>
                                        <small class="text-muted">
                                            <i class="bi bi-info-circle me-1"></i>
                                            Kelola departemen di <a href="#" onclick="navigateTo('departemen'); return false;">Master Departemen</a>
                                        </small>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label class="form-label">
                                            <i class="bi bi-shield-check me-1"></i>Tipe Keanggotaan
                                        </label>
                                        <select class="form-select" id="tipeAnggota" required onchange="showTipeInfo()">
                                            <option value="">-- Pilih Tipe --</option>
                                            <option value="Anggota">Anggota Koperasi</option>
                                            <option value="Non-Anggota">Non-Anggota (Karyawan)</option>
                                            <option value="Umum">Umum (Bukan Karyawan)</option>
                                        </select>
                                        <small class="text-muted" id="tipeInfo"></small>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label class="form-label">
                                            <i class="bi bi-toggle-on me-1"></i>Status
                                        </label>
                                        <select class="form-select" id="status" required>
                                            <option value="Aktif">Aktif</option>
                                            <option value="Nonaktif">Nonaktif</option>
                                            <option value="Cuti">Cuti</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label class="form-label">
                                            <i class="bi bi-telephone me-1"></i>Telepon
                                        </label>
                                        <input type="text" class="form-control" id="telepon">
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label class="form-label">
                                            <i class="bi bi-envelope me-1"></i>Email
                                        </label>
                                        <input type="email" class="form-control" id="email">
                                    </div>
                                </div>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">
                                    <i class="bi bi-geo-alt me-1"></i>Alamat
                                </label>
                                <textarea class="form-control" id="alamat" rows="3"></textarea>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">
                                    <i class="bi bi-calendar-check me-1"></i>Tanggal Pendaftaran
                                </label>
                                <input type="date" class="form-control" id="tanggalDaftar" required>
                                <small class="text-muted">
                                    <i class="bi bi-info-circle me-1"></i>
                                    Masukkan tanggal pendaftaran anggota (untuk data historis, gunakan tanggal pendaftaran asli)
                                </small>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Batal</button>
                        <button type="button" class="btn btn-primary" onclick="saveAnggota()">Simpan</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Initial render table
    renderTableAnggota();
}

// Render Table Anggota
function renderTableAnggota(filteredData = null) {
    let anggota = filteredData || JSON.parse(localStorage.getItem('anggota') || '[]');
    
    // Filter out anggota keluar from table display
    // This ensures anggota with statusKeanggotaan === 'Keluar' are not shown
    anggota = filterActiveAnggota(anggota);
    
    const tbody = document.getElementById('tbodyAnggota');
    
    if (!tbody) return;
    
    if (anggota.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center">
                    <i class="bi bi-inbox me-2"></i>Tidak ada data anggota
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = anggota.map(a => {
        const tipeBadge = a.tipeAnggota === 'Anggota' ? 'bg-primary' : 
                         a.tipeAnggota === 'Non-Anggota' ? 'bg-info' : 'bg-secondary';
        
        // Task 3: Enhance display logic - fallback for status
        // If tanggalKeluar exists, force status to 'Nonaktif' (defensive programming)
        const actualStatus = a.tanggalKeluar ? 'Nonaktif' : (a.status || 'Aktif');
        const statusBadge = actualStatus === 'Aktif' ? 'bg-success' : 
                           actualStatus === 'Nonaktif' ? 'bg-secondary' : 'bg-warning';
        
        // Handle tanggalDaftar: format as DD/MM/YYYY or show "-" for legacy data
        let tanggalDaftarDisplay = '-';
        if (a.tanggalDaftar) {
            tanggalDaftarDisplay = formatDateToDisplay(a.tanggalDaftar);
            // If formatDateToDisplay returns empty string, show "-"
            if (!tanggalDaftarDisplay) {
                tanggalDaftarDisplay = '-';
            }
        }
        
        // Check if anggota has status "Keluar"
        const isKeluar = a.statusKeanggotaan === 'Keluar';
        const statusKeluarBadge = isKeluar ? '<span class="badge bg-danger ms-2">Keluar</span>' : '';
        
        // Show "Anggota Keluar" button only for active members (not already keluar)
        const anggotaKeluarButton = !isKeluar ? `
            <button class="btn btn-sm btn-warning" onclick="showAnggotaKeluarModal('${a.id}')" title="Anggota Keluar">
                <i class="bi bi-box-arrow-right"></i>
            </button>
        ` : '';
        
        // Show "Proses Pengembalian" button for anggota keluar with pending status
        const pengembalianButton = (isKeluar && a.pengembalianStatus !== 'Selesai') ? `
            <button class="btn btn-sm btn-success" onclick="showPengembalianModal('${a.id}')" title="Proses Pengembalian">
                <i class="bi bi-cash-coin"></i>
            </button>
        ` : '';
        
        // Show "Batalkan Status Keluar" button for anggota keluar with pending status
        const cancelKeluarButton = (isKeluar && a.pengembalianStatus !== 'Selesai') ? `
            <button class="btn btn-sm btn-danger" onclick="showCancelKeluarModal('${a.id}')" title="Batalkan Status Keluar">
                <i class="bi bi-x-circle"></i>
            </button>
        ` : '';
        
        // Apply different row styling for exited members
        const rowClass = isKeluar ? 'table-secondary' : '';
        
        return `
            <tr class="${rowClass}">
                <td>${a.nik}</td>
                <td>
                    ${a.nama}
                    ${a.tipeAnggota === 'Anggota' ? '<i class="bi bi-star-fill text-warning" title="Anggota Koperasi"></i>' : ''}
                    ${statusKeluarBadge}
                </td>
                <td>${a.noKartu}</td>
                <td>${a.departemen || '-'}</td>
                <td>
                    <span class="badge ${tipeBadge}">
                        ${a.tipeAnggota || 'Umum'}
                    </span>
                </td>
                <td>
                    <span class="badge ${statusBadge}">
                        ${actualStatus}
                    </span>
                </td>
                <td>${tanggalDaftarDisplay}</td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="viewAnggota('${a.id}')" title="Detail">
                        <i class="bi bi-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-warning" onclick="editAnggota('${a.id}')" title="Edit" ${isKeluar ? 'disabled' : ''}>
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteAnggota('${a.id}')" title="Hapus" ${isKeluar ? 'disabled' : ''}>
                        <i class="bi bi-trash"></i>
                    </button>
                    ${anggotaKeluarButton}
                    ${pengembalianButton}
                    ${cancelKeluarButton}
                </td>
            </tr>
        `;
    }).join('');
}

// Filter Anggota
function filterAnggota() {
    const allAnggota = JSON.parse(localStorage.getItem('anggota') || '[]');
    let anggota = filterActiveAnggota(allAnggota);
    const searchText = document.getElementById('searchAnggota').value.toLowerCase();
    const filterDept = document.getElementById('filterDepartemen').value;
    const filterTipe = document.getElementById('filterTipe').value;
    const filterStatus = document.getElementById('filterStatus').value;
    const filterTanggalDari = document.getElementById('filterTanggalDari')?.value || '';
    const filterTanggalSampai = document.getElementById('filterTanggalSampai')?.value || '';
    
    let filtered = anggota.filter(a => {
        // Filter already applied via filterActiveAnggota() - anggota keluar excluded
        
        // Search filter
        const matchSearch = !searchText || 
            a.nik.toLowerCase().includes(searchText) ||
            a.nama.toLowerCase().includes(searchText) ||
            a.noKartu.toLowerCase().includes(searchText);
        
        // Departemen filter
        const matchDept = !filterDept || a.departemen === filterDept;
        
        // Tipe filter
        const matchTipe = !filterTipe || a.tipeAnggota === filterTipe;
        
        // Task 4: Fix filter logic for status
        // Use same fallback logic as display: if tanggalKeluar exists, treat as 'Nonaktif'
        const actualStatus = a.tanggalKeluar ? 'Nonaktif' : (a.status || 'Aktif');
        const matchStatus = !filterStatus || actualStatus === filterStatus;
        
        // Date range filter
        let matchDateRange = true;
        if (filterTanggalDari || filterTanggalSampai) {
            // Handle legacy data: if no tanggalDaftar, treat as earliest date (1900-01-01)
            const memberDate = a.tanggalDaftar || '1900-01-01';
            
            if (filterTanggalDari && filterTanggalSampai) {
                // Both dates specified: check if member date is within range
                matchDateRange = memberDate >= filterTanggalDari && memberDate <= filterTanggalSampai;
            } else if (filterTanggalDari) {
                // Only start date specified: check if member date is on or after start date
                matchDateRange = memberDate >= filterTanggalDari;
            } else if (filterTanggalSampai) {
                // Only end date specified: check if member date is on or before end date
                matchDateRange = memberDate <= filterTanggalSampai;
            }
        }
        
        return matchSearch && matchDept && matchTipe && matchStatus && matchDateRange;
    });
    
    // Update count
    const countElement = document.getElementById('countFiltered');
    if (countElement) {
        countElement.textContent = filtered.length;
    }
    
    // Render filtered table
    renderTableAnggota(filtered);
}

// Reset Filter
function resetFilterAnggota() {
    document.getElementById('searchAnggota').value = '';
    document.getElementById('filterDepartemen').value = '';
    document.getElementById('filterTipe').value = '';
    document.getElementById('filterStatus').value = '';
    const filterTanggalDari = document.getElementById('filterTanggalDari');
    const filterTanggalSampai = document.getElementById('filterTanggalSampai');
    if (filterTanggalDari) filterTanggalDari.value = '';
    if (filterTanggalSampai) filterTanggalSampai.value = '';
    filterAnggota();
}

// Sort Anggota by Tanggal Pendaftaran
function sortAnggotaByDate() {
    // Toggle sort direction
    if (anggotaSortState.column === 'tanggalDaftar') {
        anggotaSortState.direction = anggotaSortState.direction === 'asc' ? 'desc' : 'asc';
    } else {
        anggotaSortState.column = 'tanggalDaftar';
        anggotaSortState.direction = 'asc';
    }
    
    // Get current filtered data
    const allAnggota = JSON.parse(localStorage.getItem('anggota') || '[]');
    let anggota = filterActiveAnggota(allAnggota);
    const searchText = document.getElementById('searchAnggota').value.toLowerCase();
    const filterDept = document.getElementById('filterDepartemen').value;
    const filterTipe = document.getElementById('filterTipe').value;
    const filterStatus = document.getElementById('filterStatus').value;
    
    // Apply filters first
    let filtered = anggota.filter(a => {
        // Filter already applied via filterActiveAnggota() - anggota keluar excluded
        
        const matchSearch = !searchText || 
            a.nik.toLowerCase().includes(searchText) ||
            a.nama.toLowerCase().includes(searchText) ||
            a.noKartu.toLowerCase().includes(searchText);
        
        const matchDept = !filterDept || a.departemen === filterDept;
        const matchTipe = !filterTipe || a.tipeAnggota === filterTipe;
        const matchStatus = !filterStatus || a.status === filterStatus;
        
        return matchSearch && matchDept && matchTipe && matchStatus;
    });
    
    // Sort by tanggalDaftar
    filtered.sort((a, b) => {
        // Handle legacy data: treat null/undefined as earliest date (1900-01-01)
        const dateA = new Date(a.tanggalDaftar || '1900-01-01');
        const dateB = new Date(b.tanggalDaftar || '1900-01-01');
        
        if (anggotaSortState.direction === 'asc') {
            return dateA - dateB;
        } else {
            return dateB - dateA;
        }
    });
    
    // Update sort indicator
    const sortIndicator = document.getElementById('sortIndicator');
    if (sortIndicator) {
        if (anggotaSortState.direction === 'asc') {
            sortIndicator.className = 'bi bi-arrow-up ms-1';
        } else {
            sortIndicator.className = 'bi bi-arrow-down ms-1';
        }
    }
    
    // Render sorted table
    renderTableAnggota(filtered);
}

function showAnggotaModal() {
    document.getElementById('anggotaForm').reset();
    document.getElementById('anggotaId').value = '';
    document.getElementById('status').value = 'Aktif';
    document.getElementById('tipeInfo').textContent = '';
    
    // Set default tanggalDaftar to today for new member
    const todayISO = getCurrentDateISO();
    document.getElementById('tanggalDaftar').value = todayISO;
    
    new bootstrap.Modal(document.getElementById('anggotaModal')).show();
}

function getTipeKeanggotaanInfo(tipe) {
    const info = {
        'Anggota': '<div class="alert alert-primary mt-2"><small><strong>Hak Anggota:</strong><br>✓ Transaksi Cash & Kasbon<br>✓ Mendapat SHU<br>✓ Simpan Pinjam</small></div>',
        'Non-Anggota': '<div class="alert alert-info mt-2"><small><strong>Hak Non-Anggota:</strong><br>✓ Transaksi Cash & Kasbon<br>✗ Tidak Mendapat SHU<br>✗ Tidak Bisa Simpan Pinjam</small></div>',
        'Umum': '<div class="alert alert-secondary mt-2"><small><strong>Hak Umum:</strong><br>✓ Hanya Transaksi Cash<br>✗ Tidak Mendapat SHU<br>✗ Tidak Bisa Simpan Pinjam</small></div>'
    };
    return info[tipe] || '';
}

function viewAnggota(id) {
    const anggota = JSON.parse(localStorage.getItem('anggota') || '[]');
    const item = anggota.find(a => a.id === id);
    
    if (item) {
        const modalHTML = `
            <div class="modal fade" id="viewAnggotaModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">
                                <i class="bi bi-person-circle me-2"></i>Detail Anggota
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                <div class="col-12 text-center mb-4">
                                    <i class="bi bi-person-circle" style="font-size: 5rem; color: #2d6a4f;"></i>
                                    <h4 class="mt-2" style="color: #2d6a4f;">
                                        ${item.nama}
                                        ${item.tipeAnggota === 'Anggota' ? '<i class="bi bi-star-fill text-warning"></i>' : ''}
                                    </h4>
                                    <div class="mb-2">
                                        <span class="badge ${item.tipeAnggota === 'Anggota' ? 'bg-primary' : item.tipeAnggota === 'Non-Anggota' ? 'bg-info' : 'bg-secondary'}" style="font-size: 1rem;">
                                            ${item.tipeAnggota || 'Umum'}
                                        </span>
                                        <span class="badge ${item.status === 'Aktif' ? 'bg-success' : item.status === 'Nonaktif' ? 'bg-secondary' : 'bg-warning'}" style="font-size: 1rem;">
                                            ${item.status || 'Aktif'}
                                        </span>
                                    </div>
                                    ${getTipeKeanggotaanInfo(item.tipeAnggota)}
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-6">
                                    <table class="table table-borderless">
                                        <tr>
                                            <td width="40%"><strong><i class="bi bi-person-badge me-2"></i>NIK:</strong></td>
                                            <td>${item.nik}</td>
                                        </tr>
                                        <tr>
                                            <td><strong><i class="bi bi-card-text me-2"></i>No. Kartu:</strong></td>
                                            <td>${item.noKartu}</td>
                                        </tr>
                                        <tr>
                                            <td><strong><i class="bi bi-building me-2"></i>Departemen:</strong></td>
                                            <td>
                                                ${item.departemen ? `
                                                    <span class="badge bg-primary">${item.departemen}</span>
                                                    <a href="#" onclick="lihatDepartemenDetail('${item.departemen}'); return false;" class="ms-2" title="Lihat Departemen">
                                                        <i class="bi bi-box-arrow-up-right"></i>
                                                    </a>
                                                ` : '-'}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td><strong><i class="bi bi-telephone me-2"></i>Telepon:</strong></td>
                                            <td>${item.telepon || '-'}</td>
                                        </tr>
                                    </table>
                                </div>
                                <div class="col-md-6">
                                    <table class="table table-borderless">
                                        <tr>
                                            <td width="40%"><strong><i class="bi bi-calendar-check me-2"></i>Tanggal Pendaftaran:</strong></td>
                                            <td>${item.tanggalDaftar ? formatDateToDisplay(item.tanggalDaftar) || 'Tidak tercatat' : 'Tidak tercatat'}</td>
                                        </tr>
                                        <tr>
                                            <td width="40%"><strong><i class="bi bi-envelope me-2"></i>Email:</strong></td>
                                            <td>${item.email || '-'}</td>
                                        </tr>
                                        <tr>
                                            <td><strong><i class="bi bi-geo-alt me-2"></i>Alamat:</strong></td>
                                            <td>${item.alamat || '-'}</td>
                                        </tr>
                                    </table>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Tutup</button>
                            <button type="button" class="btn btn-warning" onclick="bootstrap.Modal.getInstance(document.getElementById('viewAnggotaModal')).hide(); editAnggota('${id}');">
                                <i class="bi bi-pencil me-1"></i>Edit
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Remove existing modal if any
        const existingModal = document.getElementById('viewAnggotaModal');
        if (existingModal) existingModal.remove();
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        new bootstrap.Modal(document.getElementById('viewAnggotaModal')).show();
    }
}

function editAnggota(id) {
    const anggota = JSON.parse(localStorage.getItem('anggota') || '[]');
    const item = anggota.find(a => a.id === id);
    if (item) {
        document.getElementById('anggotaId').value = item.id;
        document.getElementById('nik').value = item.nik;
        document.getElementById('nama').value = item.nama;
        document.getElementById('noKartu').value = item.noKartu;
        document.getElementById('departemen').value = item.departemen || '';
        document.getElementById('tipeAnggota').value = item.tipeAnggota || 'Umum';
        document.getElementById('status').value = item.status || 'Aktif';
        document.getElementById('telepon').value = item.telepon || '';
        document.getElementById('email').value = item.email || '';
        document.getElementById('alamat').value = item.alamat || '';
        
        // Handle tanggalDaftar: set in ISO format for date input
        // For legacy data without tanggalDaftar, use today's date
        const tanggalDaftarISO = item.tanggalDaftar || getCurrentDateISO();
        document.getElementById('tanggalDaftar').value = tanggalDaftarISO;
        
        showTipeInfo();
        
        // Cek apakah departemen masih valid
        if (item.departemen) {
            const departemen = JSON.parse(localStorage.getItem('departemen') || '[]');
            const dept = departemen.find(d => d.nama === item.departemen);
            if (!dept) {
                showAlert(`Peringatan: Departemen "${item.departemen}" tidak ditemukan di master departemen. Silakan pilih departemen yang baru.`, 'warning');
            } else if (!dept.aktif) {
                showAlert(`Peringatan: Departemen "${item.departemen}" sudah nonaktif. Pertimbangkan untuk memindahkan ke departemen lain.`, 'warning');
            }
        }
        
        new bootstrap.Modal(document.getElementById('anggotaModal')).show();
    }
}

function showTipeInfo() {
    const tipe = document.getElementById('tipeAnggota').value;
    const infoElement = document.getElementById('tipeInfo');
    
    const info = {
        'Anggota': '✓ Bisa transaksi cash & kasbon | ✓ Dapat SHU | ✓ Simpan pinjam',
        'Non-Anggota': '✓ Bisa transaksi cash & kasbon | ✗ Tidak dapat SHU | ✗ Tidak bisa simpan pinjam',
        'Umum': '✓ Hanya transaksi cash | ✗ Tidak dapat SHU | ✗ Tidak bisa simpan pinjam'
    };
    
    infoElement.textContent = info[tipe] || '';
}

function saveAnggota() {
    const anggota = JSON.parse(localStorage.getItem('anggota') || '[]');
    const id = document.getElementById('anggotaId').value;
    
    // Get tanggalDaftar from form input
    const tanggalDaftarInput = document.getElementById('tanggalDaftar').value;
    
    const data = {
        id: id || generateId(),
        nik: document.getElementById('nik').value,
        nama: document.getElementById('nama').value,
        noKartu: document.getElementById('noKartu').value,
        departemen: document.getElementById('departemen').value,
        tipeAnggota: document.getElementById('tipeAnggota').value,
        status: document.getElementById('status').value,
        telepon: document.getElementById('telepon').value,
        email: document.getElementById('email').value,
        alamat: document.getElementById('alamat').value,
        tanggalDaftar: tanggalDaftarInput || getCurrentDateISO() // Use input or default to today
    };
    
    if (id) {
        // Editing existing member
        const index = anggota.findIndex(a => a.id === id);
        // Keep existing statusKartu and riwayatKartu
        data.statusKartu = anggota[index].statusKartu;
        data.riwayatKartu = anggota[index].riwayatKartu;
        data.tanggalUbahKartu = anggota[index].tanggalUbahKartu;
        data.catatanKartu = anggota[index].catatanKartu;
        
        anggota[index] = data;
    } else {
        // New member: set default statusKartu to nonaktif
        data.statusKartu = 'nonaktif';
        data.riwayatKartu = [];
        data.tanggalUbahKartu = new Date().toISOString();
        data.catatanKartu = 'Kartu baru dibuat';
        
        anggota.push(data);
    }
    
    localStorage.setItem('anggota', JSON.stringify(anggota));
    bootstrap.Modal.getInstance(document.getElementById('anggotaModal')).hide();
    showAlert('Data anggota berhasil disimpan');
    filterAnggota(); // Re-apply filter after save
}

function deleteAnggota(id) {
    if (confirm('Yakin ingin menghapus anggota ini?')) {
        let anggota = JSON.parse(localStorage.getItem('anggota') || '[]');
        anggota = anggota.filter(a => a.id !== id);
        localStorage.setItem('anggota', JSON.stringify(anggota));
        showAlert('Data anggota berhasil dihapus', 'info');
        filterAnggota(); // Re-apply filter after delete
    }
}

function renderSimpanan() {
    const content = document.getElementById('mainContent');
    content.innerHTML = `
        <h2>Simpanan Anggota</h2>
        <ul class="nav nav-tabs" id="simpananTab" role="tablist">
            <li class="nav-item">
                <button class="nav-link active" data-bs-toggle="tab" data-bs-target="#pokok">Simpanan Pokok</button>
            </li>
            <li class="nav-item">
                <button class="nav-link" data-bs-toggle="tab" data-bs-target="#wajib">Simpanan Wajib</button>
            </li>
            <li class="nav-item">
                <button class="nav-link" data-bs-toggle="tab" data-bs-target="#sukarela">Simpanan Sukarela</button>
            </li>
        </ul>
        <div class="tab-content mt-3">
            <div class="tab-pane fade show active" id="pokok">
                ${renderSimpananPokok()}
            </div>
            <div class="tab-pane fade" id="wajib">
                ${renderSimpananWajib()}
            </div>
            <div class="tab-pane fade" id="sukarela">
                ${renderSimpananSukarela()}
            </div>
        </div>
    `;
}

function renderSimpananPokok() {
    const anggota = JSON.parse(localStorage.getItem('anggota') || '[]');
    const simpanan = JSON.parse(localStorage.getItem('simpananPokok') || '[]');
    
    return `
        <button class="btn btn-primary mb-3" onclick="showSimpananPokokModal()">Tambah Simpanan Pokok</button>
        <table class="table">
            <thead>
                <tr><th>Anggota</th><th>Jumlah</th><th>Tanggal</th></tr>
            </thead>
            <tbody>
                ${simpanan.map(s => {
                    const ang = anggota.find(a => a.id === s.anggotaId);
                    return `<tr><td>${ang?.nama || '-'}</td><td>${formatRupiah(s.jumlah)}</td><td>${formatDate(s.tanggal)}</td></tr>`;
                }).join('')}
            </tbody>
        </table>
    `;
}

function renderSimpananWajib() {
    return `<p>Fitur simpanan wajib - implementasi serupa dengan simpanan pokok</p>`;
}

function renderSimpananSukarela() {
    return `<p>Fitur simpanan sukarela - implementasi serupa dengan simpanan pokok</p>`;
}

function renderPinjaman() {
    const content = document.getElementById('mainContent');
    content.innerHTML = `<h2>Pinjaman Anggota</h2><p>Fitur pinjaman dalam pengembangan</p>`;
}


// Import/Export Anggota Functions

function showImportModal() {
    const modalHTML = `
        <div class="modal fade" id="importModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="bi bi-file-earmark-arrow-up me-2"></i>Import Data Anggota
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="alert alert-info">
                            <strong><i class="bi bi-info-circle me-2"></i>Petunjuk Import:</strong>
                            <ol class="mb-0 mt-2">
                                <li>Download template Excel/CSV terlebih dahulu</li>
                                <li>Isi data anggota sesuai format template</li>
                                <li>Upload file yang sudah diisi</li>
                                <li>Sistem akan memvalidasi dan mengimpor data</li>
                            </ol>
                        </div>
                        
                        <div class="mb-3">
                            <label class="form-label"><strong>Pilih File (Excel/CSV)</strong></label>
                            <input type="file" class="form-control" id="importFile" accept=".csv,.xlsx,.xls">
                            <small class="text-muted">Format: CSV, Excel (.xlsx, .xls)</small>
                        </div>
                        
                        <div class="mb-3">
                            <label class="form-label"><strong>Atau Paste Data CSV:</strong></label>
                            <textarea class="form-control" id="pasteData" rows="10" placeholder="NIK,Nama,No. Kartu,Departemen,Tipe Keanggotaan,Status,Telepon,Email,Alamat&#10;123456,John Doe,KTA001,Produksi,Anggota,Aktif,08123456789,john@email.com,Jl. Contoh No. 1"></textarea>
                            <small class="text-muted">Format: NIK,Nama,No. Kartu,Departemen,Tipe Keanggotaan,Status,Telepon,Email,Alamat<br>
                            Tipe Keanggotaan: Anggota / Non-Anggota / Umum</small>
                        </div>
                        
                        <div id="importPreview" style="display:none;">
                            <h6>Preview Data (5 baris pertama):</h6>
                            <div class="table-responsive">
                                <table class="table table-sm table-bordered">
                                    <thead>
                                        <tr>
                                            <th>NIK</th>
                                            <th>Nama</th>
                                            <th>No. Kartu</th>
                                            <th>Departemen</th>
                                            <th>Tipe</th>
                                            <th>Status</th>
                                            <th>Telepon</th>
                                            <th>Tanggal Pendaftaran</th>
                                        </tr>
                                    </thead>
                                    <tbody id="previewBody"></tbody>
                                </table>
                            </div>
                            <div class="alert alert-success">
                                <strong>Total data yang akan diimport: <span id="totalImport">0</span> anggota</strong>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Batal</button>
                        <button type="button" class="btn btn-info" onclick="previewImport()">
                            <i class="bi bi-eye me-1"></i>Preview
                        </button>
                        <button type="button" class="btn btn-success" onclick="processImport()">
                            <i class="bi bi-check-circle me-1"></i>Import Data
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    const existingModal = document.getElementById('importModal');
    if (existingModal) existingModal.remove();
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Add file change listener
    document.getElementById('importFile').addEventListener('change', handleFileSelect);
    
    new bootstrap.Modal(document.getElementById('importModal')).show();
}

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const content = e.target.result;
        document.getElementById('pasteData').value = content;
    };
    reader.readAsText(file);
}

let importData = [];

function previewImport() {
    const csvData = document.getElementById('pasteData').value.trim();
    
    if (!csvData) {
        showAlert('Masukkan data CSV atau pilih file!', 'warning');
        return;
    }
    
    // Parse CSV
    const lines = csvData.split('\n');
    importData = [];
    
    // Check if header exists and find column indices
    const firstLine = lines[0].toLowerCase();
    const hasHeader = firstLine.includes('nik');
    const startIndex = hasHeader ? 1 : 0;
    
    // Determine if tanggalDaftar column exists in header
    let tanggalDaftarIndex = -1;
    if (hasHeader) {
        const headerParts = lines[0].split(',').map(p => p.trim().replace(/^"|"$/g, '').toLowerCase());
        tanggalDaftarIndex = headerParts.findIndex(h => 
            h.includes('tanggal') && (h.includes('daftar') || h.includes('pendaftaran'))
        );
    }
    
    // Get today's date as default
    const todayISO = getCurrentDateISO();
    
    for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const parts = line.split(',').map(p => p.trim().replace(/^"|"$/g, ''));
        if (parts.length >= 3) {
            // Parse tanggalDaftar if column exists
            let tanggalDaftar = todayISO; // Default to today
            if (tanggalDaftarIndex >= 0 && parts[tanggalDaftarIndex]) {
                // Use parseDateFlexible to support various formats
                const parsedDate = parseDateFlexible(parts[tanggalDaftarIndex]);
                if (parsedDate) {
                    tanggalDaftar = parsedDate;
                }
                // If parsing fails, keep default (today)
            }
            
            importData.push({
                nik: parts[0],
                nama: parts[1],
                noKartu: parts[2],
                departemen: parts[3] || '',
                tipeAnggota: parts[4] || 'Umum',
                status: parts[5] || 'Aktif',
                telepon: parts[6] || '',
                email: parts[7] || '',
                alamat: parts[8] || '',
                tanggalDaftar: tanggalDaftar
            });
        }
    }
    
    if (importData.length === 0) {
        showAlert('Tidak ada data valid untuk diimport!', 'warning');
        return;
    }
    
    // Show preview
    const previewBody = document.getElementById('previewBody');
    previewBody.innerHTML = importData.slice(0, 5).map(item => {
        const tipeBadge = item.tipeAnggota === 'Anggota' ? 'bg-primary' : 
                         item.tipeAnggota === 'Non-Anggota' ? 'bg-info' : 'bg-secondary';
        // Format tanggalDaftar for display
        const tanggalDisplay = formatDateToDisplay(item.tanggalDaftar);
        return `
        <tr>
            <td>${item.nik}</td>
            <td>${item.nama}</td>
            <td>${item.noKartu}</td>
            <td>${item.departemen}</td>
            <td><span class="badge ${tipeBadge}">${item.tipeAnggota}</span></td>
            <td><span class="badge ${item.status === 'Aktif' ? 'bg-success' : 'bg-secondary'}">${item.status}</span></td>
            <td>${item.telepon}</td>
            <td>${tanggalDisplay}</td>
        </tr>
    `;
    }).join('');
    
    document.getElementById('totalImport').textContent = importData.length;
    document.getElementById('importPreview').style.display = 'block';
    
    showAlert(`Preview berhasil! Ditemukan ${importData.length} data anggota`, 'success');
}

function processImport() {
    if (importData.length === 0) {
        showAlert('Lakukan preview terlebih dahulu!', 'warning');
        return;
    }
    
    const anggota = JSON.parse(localStorage.getItem('anggota') || '[]');
    let imported = 0;
    let skipped = 0;
    
    importData.forEach(item => {
        // Check duplicate NIK
        const exists = anggota.find(a => a.nik === item.nik);
        if (exists) {
            skipped++;
        } else {
            anggota.push({
                id: generateId(),
                nik: item.nik,
                nama: item.nama,
                noKartu: item.noKartu,
                departemen: item.departemen,
                tipeAnggota: item.tipeAnggota,
                status: item.status,
                telepon: item.telepon,
                email: item.email,
                alamat: item.alamat,
                tanggalDaftar: item.tanggalDaftar || getCurrentDateISO(),
                statusKartu: 'nonaktif',
                riwayatKartu: [],
                tanggalUbahKartu: new Date().toISOString(),
                catatanKartu: 'Imported member'
            });
            imported++;
        }
    });
    
    localStorage.setItem('anggota', JSON.stringify(anggota));
    
    bootstrap.Modal.getInstance(document.getElementById('importModal')).hide();
    
    showAlert(`Import selesai! ${imported} data berhasil diimport, ${skipped} data dilewati (duplikat)`, 'success');
    renderAnggota();
}

function downloadTemplateAnggota() {
    const template = `NIK,Nama,No. Kartu,Departemen,Tipe Keanggotaan,Status,Telepon,Email,Alamat,Tanggal Pendaftaran
123456,John Doe,KTA001,Produksi,Anggota,Aktif,08123456789,john@email.com,Jl. Contoh No. 1,15/01/2024
234567,Jane Smith,KTA002,Keuangan,Non-Anggota,Aktif,08234567890,jane@email.com,Jl. Contoh No. 2,20/02/2024
345678,Bob Johnson,KTA003,IT,Umum,Aktif,08345678901,bob@email.com,Jl. Contoh No. 3,10/03/2024

CATATAN:
- Format Tanggal Pendaftaran: DD/MM/YYYY (contoh: 15/01/2024)
- Format alternatif yang didukung: YYYY-MM-DD atau DD-MM-YYYY
- Jika kolom Tanggal Pendaftaran kosong, sistem akan menggunakan tanggal import sebagai default`;
    
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'template_anggota.csv');
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showAlert('Template berhasil didownload!', 'success');
}

function exportAnggota() {
    const allAnggota = JSON.parse(localStorage.getItem('anggota') || '[]');
    // Export only active anggota (excluding keluar)
    const anggota = filterActiveAnggota(allAnggota);
    
    if (anggota.length === 0) {
        showAlert('Tidak ada data anggota untuk diexport!', 'warning');
        return;
    }
    
    // Create CSV content with Tanggal Pendaftaran column
    let csv = 'NIK,Nama,No. Kartu,Departemen,Tipe Keanggotaan,Status,Telepon,Email,Alamat,Tanggal Pendaftaran\n';
    anggota.forEach(a => {
        // Format tanggalDaftar as DD/MM/YYYY or "-" for legacy data
        let tanggalDaftarDisplay = '-';
        if (a.tanggalDaftar) {
            tanggalDaftarDisplay = formatDateToDisplay(a.tanggalDaftar);
            // If formatDateToDisplay returns empty string, use "-"
            if (!tanggalDaftarDisplay) {
                tanggalDaftarDisplay = '-';
            }
        }
        
        csv += `${a.nik},"${a.nama}",${a.noKartu},${a.departemen || ''},${a.tipeAnggota || 'Umum'},${a.status || 'Aktif'},${a.telepon || ''},${a.email || ''},"${a.alamat || ''}",${tanggalDaftarDisplay}\n`;
    });
    
    // Download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    const today = new Date().toISOString().split('T')[0];
    link.setAttribute('href', url);
    link.setAttribute('download', `data_anggota_aktif_${today}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showAlert(`${anggota.length} data anggota berhasil diexport!`, 'success');
}


// Aktivasi Kartu Anggota
function renderAktivasiKartu() {
    const content = document.getElementById('mainContent');
    const anggota = JSON.parse(localStorage.getItem('anggota') || '[]');
    
    // Filter anggota berdasarkan status kartu
    const kartuAktif = anggota.filter(a => a.statusKartu === 'aktif');
    const kartuNonaktif = anggota.filter(a => a.statusKartu === 'nonaktif' || !a.statusKartu);
    const kartuBlokir = anggota.filter(a => a.statusKartu === 'blokir');
    
    content.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2 style="color: #2d6a4f; font-weight: 700;">
                <i class="bi bi-credit-card-2-front me-2"></i>Aktivasi Kartu Anggota
            </h2>
        </div>
        
        <div class="row mb-4">
            <div class="col-md-4">
                <div class="card" style="background: linear-gradient(135deg, #52b788 0%, #40916c 100%); color: white;">
                    <div class="card-body text-center">
                        <i class="bi bi-check-circle" style="font-size: 3rem;"></i>
                        <h3 class="mt-2">${kartuAktif.length}</h3>
                        <p class="mb-0">Kartu Aktif</p>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card" style="background: linear-gradient(135deg, #ffd60a 0%, #ffc300 100%); color: #1b4332;">
                    <div class="card-body text-center">
                        <i class="bi bi-x-circle" style="font-size: 3rem;"></i>
                        <h3 class="mt-2">${kartuNonaktif.length}</h3>
                        <p class="mb-0">Kartu Nonaktif</p>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card" style="background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); color: white;">
                    <div class="card-body text-center">
                        <i class="bi bi-shield-x" style="font-size: 3rem;"></i>
                        <h3 class="mt-2">${kartuBlokir.length}</h3>
                        <p class="mb-0">Kartu Diblokir</p>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="card">
            <div class="card-header">
                <ul class="nav nav-tabs card-header-tabs" id="kartuTab" role="tablist">
                    <li class="nav-item">
                        <button class="nav-link active" id="semua-tab" data-bs-toggle="tab" data-bs-target="#semua" type="button">
                            <i class="bi bi-list-ul me-1"></i>Semua (${anggota.length})
                        </button>
                    </li>
                    <li class="nav-item">
                        <button class="nav-link" id="aktif-tab" data-bs-toggle="tab" data-bs-target="#aktif" type="button">
                            <i class="bi bi-check-circle me-1"></i>Aktif (${kartuAktif.length})
                        </button>
                    </li>
                    <li class="nav-item">
                        <button class="nav-link" id="nonaktif-tab" data-bs-toggle="tab" data-bs-target="#nonaktif" type="button">
                            <i class="bi bi-x-circle me-1"></i>Nonaktif (${kartuNonaktif.length})
                        </button>
                    </li>
                    <li class="nav-item">
                        <button class="nav-link" id="blokir-tab" data-bs-toggle="tab" data-bs-target="#blokir" type="button">
                            <i class="bi bi-shield-x me-1"></i>Blokir (${kartuBlokir.length})
                        </button>
                    </li>
                </ul>
            </div>
            <div class="card-body">
                <div class="tab-content" id="kartuTabContent">
                    <!-- Tab Semua -->
                    <div class="tab-pane fade show active" id="semua" role="tabpanel">
                        ${renderKartuTable(anggota)}
                    </div>
                    
                    <!-- Tab Aktif -->
                    <div class="tab-pane fade" id="aktif" role="tabpanel">
                        ${renderKartuTable(kartuAktif)}
                    </div>
                    
                    <!-- Tab Nonaktif -->
                    <div class="tab-pane fade" id="nonaktif" role="tabpanel">
                        ${renderKartuTable(kartuNonaktif)}
                    </div>
                    
                    <!-- Tab Blokir -->
                    <div class="tab-pane fade" id="blokir" role="tabpanel">
                        ${renderKartuTable(kartuBlokir)}
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Modal Aktivasi -->
        <div class="modal fade" id="aktivasiModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="bi bi-credit-card-2-front me-2"></i>Aktivasi Kartu
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body" id="aktivasiModalBody">
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Batal</button>
                        <button type="button" class="btn btn-success" id="btnAktifkan" onclick="prosesAktivasiKartu('aktif')">
                            <i class="bi bi-check-circle me-1"></i>Aktifkan
                        </button>
                        <button type="button" class="btn btn-warning" id="btnNonaktifkan" onclick="prosesAktivasiKartu('nonaktif')">
                            <i class="bi bi-x-circle me-1"></i>Nonaktifkan
                        </button>
                        <button type="button" class="btn btn-danger" id="btnBlokir" onclick="prosesAktivasiKartu('blokir')">
                            <i class="bi bi-shield-x me-1"></i>Blokir
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderKartuTable(data) {
    if (data.length === 0) {
        return '<div class="alert alert-info"><i class="bi bi-info-circle me-2"></i>Tidak ada data</div>';
    }
    
    return `
        <div class="table-responsive">
            <table class="table table-hover">
                <thead>
                    <tr>
                        <th>NIK</th>
                        <th>Nama</th>
                        <th>No. Kartu</th>
                        <th>Tipe</th>
                        <th>Status Kartu</th>
                        <th>Terakhir Diubah</th>
                        <th>Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.map(a => {
                        const statusKartu = a.statusKartu || 'nonaktif';
                        const statusBadge = statusKartu === 'aktif' ? 'bg-success' : 
                                           statusKartu === 'blokir' ? 'bg-danger' : 'bg-warning';
                        const statusIcon = statusKartu === 'aktif' ? 'check-circle' : 
                                          statusKartu === 'blokir' ? 'shield-x' : 'x-circle';
                        const statusText = statusKartu === 'aktif' ? 'Aktif' : 
                                          statusKartu === 'blokir' ? 'Diblokir' : 'Nonaktif';
                        
                        return `
                            <tr>
                                <td>${a.nik}</td>
                                <td>
                                    ${a.nama}
                                    ${a.tipeAnggota === 'Anggota' ? '<i class="bi bi-star-fill text-warning" title="Anggota Koperasi"></i>' : ''}
                                </td>
                                <td><strong>${a.noKartu}</strong></td>
                                <td>
                                    <span class="badge ${a.tipeAnggota === 'Anggota' ? 'bg-primary' : a.tipeAnggota === 'Non-Anggota' ? 'bg-info' : 'bg-secondary'}">
                                        ${a.tipeAnggota || 'Umum'}
                                    </span>
                                </td>
                                <td>
                                    <span class="badge ${statusBadge}">
                                        <i class="bi bi-${statusIcon} me-1"></i>${statusText}
                                    </span>
                                </td>
                                <td>${a.tanggalUbahKartu ? new Date(a.tanggalUbahKartu).toLocaleString('id-ID') : '-'}</td>
                                <td>
                                    <button class="btn btn-sm btn-primary" onclick="showAktivasiModal('${a.id}')" title="Kelola Kartu">
                                        <i class="bi bi-credit-card"></i> Kelola
                                    </button>
                                    <button class="btn btn-sm btn-success" onclick="printKartuAnggota('${a.id}')" title="Cetak Kartu">
                                        <i class="bi bi-printer"></i> Cetak
                                    </button>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;
}

let currentAnggotaId = null;

function showAktivasiModal(anggotaId) {
    const anggota = JSON.parse(localStorage.getItem('anggota') || '[]');
    const member = anggota.find(a => a.id === anggotaId);
    
    if (!member) return;
    
    currentAnggotaId = anggotaId;
    const statusKartu = member.statusKartu || 'nonaktif';
    
    const modalBody = document.getElementById('aktivasiModalBody');
    modalBody.innerHTML = `
        <div class="text-center mb-3">
            <i class="bi bi-person-circle" style="font-size: 4rem; color: #2d6a4f;"></i>
            <h4 class="mt-2" style="color: #2d6a4f;">${member.nama}</h4>
            <p class="mb-1"><strong>NIK:</strong> ${member.nik}</p>
            <p class="mb-1"><strong>No. Kartu:</strong> ${member.noKartu}</p>
            <p class="mb-1"><strong>Tipe:</strong> ${member.tipeAnggota || 'Umum'}</p>
        </div>
        
        <div class="alert ${statusKartu === 'aktif' ? 'alert-success' : statusKartu === 'blokir' ? 'alert-danger' : 'alert-warning'}">
            <strong><i class="bi bi-info-circle me-2"></i>Status Kartu Saat Ini:</strong>
            <h5 class="mt-2 mb-0">
                <i class="bi bi-${statusKartu === 'aktif' ? 'check-circle' : statusKartu === 'blokir' ? 'shield-x' : 'x-circle'} me-2"></i>
                ${statusKartu === 'aktif' ? 'AKTIF' : statusKartu === 'blokir' ? 'DIBLOKIR' : 'NONAKTIF'}
            </h5>
        </div>
        
        <div class="mb-3">
            <label class="form-label"><strong>Catatan Perubahan Status:</strong></label>
            <textarea class="form-control" id="catatanAktivasi" rows="3" placeholder="Masukkan alasan perubahan status (opsional)"></textarea>
        </div>
        
        <div class="alert alert-info">
            <strong><i class="bi bi-info-circle me-2"></i>Keterangan:</strong>
            <ul class="mb-0 mt-2">
                <li><strong>Aktif:</strong> Kartu dapat digunakan untuk transaksi</li>
                <li><strong>Nonaktif:</strong> Kartu tidak dapat digunakan sementara</li>
                <li><strong>Blokir:</strong> Kartu diblokir permanen (kartu hilang/rusak)</li>
            </ul>
        </div>
    `;
    
    // Show/hide buttons based on current status
    const btnAktifkan = document.getElementById('btnAktifkan');
    const btnNonaktifkan = document.getElementById('btnNonaktifkan');
    const btnBlokir = document.getElementById('btnBlokir');
    
    btnAktifkan.style.display = statusKartu === 'aktif' ? 'none' : 'inline-block';
    btnNonaktifkan.style.display = statusKartu === 'nonaktif' ? 'none' : 'inline-block';
    btnBlokir.style.display = statusKartu === 'blokir' ? 'none' : 'inline-block';
    
    new bootstrap.Modal(document.getElementById('aktivasiModal')).show();
}

function prosesAktivasiKartu(statusBaru) {
    if (!currentAnggotaId) return;
    
    const anggota = JSON.parse(localStorage.getItem('anggota') || '[]');
    const index = anggota.findIndex(a => a.id === currentAnggotaId);
    
    if (index === -1) return;
    
    const catatan = document.getElementById('catatanAktivasi').value;
    const statusLama = anggota[index].statusKartu || 'nonaktif';
    
    // Confirm action
    const confirmMsg = `Yakin ingin mengubah status kartu menjadi ${statusBaru.toUpperCase()}?`;
    if (!confirm(confirmMsg)) return;
    
    // Update status
    anggota[index].statusKartu = statusBaru;
    anggota[index].tanggalUbahKartu = new Date().toISOString();
    anggota[index].catatanKartu = catatan;
    
    // Save history
    if (!anggota[index].riwayatKartu) {
        anggota[index].riwayatKartu = [];
    }
    
    anggota[index].riwayatKartu.push({
        tanggal: new Date().toISOString(),
        statusLama: statusLama,
        statusBaru: statusBaru,
        catatan: catatan,
        oleh: currentUser.name
    });
    
    localStorage.setItem('anggota', JSON.stringify(anggota));
    
    // Close modal
    bootstrap.Modal.getInstance(document.getElementById('aktivasiModal')).hide();
    
    // Show success message
    const statusText = statusBaru === 'aktif' ? 'diaktifkan' : 
                      statusBaru === 'blokir' ? 'diblokir' : 'dinonaktifkan';
    showAlert(`Kartu berhasil ${statusText}!`, 'success');
    
    // Refresh page
    renderAktivasiKartu();
}


// Cetak Kartu Anggota
function printKartuAnggota(anggotaId) {
    const anggota = JSON.parse(localStorage.getItem('anggota') || '[]');
    const member = anggota.find(a => a.id === anggotaId);
    const koperasi = JSON.parse(localStorage.getItem('koperasi'));
    
    if (!member) {
        showAlert('Data anggota tidak ditemukan!', 'error');
        return;
    }
    
    const statusKartu = member.statusKartu || 'nonaktif';
    const statusColor = statusKartu === 'aktif' ? '#52b788' : 
                       statusKartu === 'blokir' ? '#dc3545' : '#ffc300';
    
    const printWindow = window.open('', '', 'width=800,height=600');
    printWindow.document.write(`
        <html>
        <head>
            <title>Kartu Anggota - ${member.nama}</title>
            <style>
                @page {
                    size: 85.6mm 53.98mm; /* ID Card size */
                    margin: 0;
                }
                
                body {
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 20px;
                    background: #f0f0f0;
                }
                
                .card-container {
                    width: 85.6mm;
                    height: 53.98mm;
                    margin: 0 auto;
                    position: relative;
                    page-break-after: always;
                }
                
                .card {
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(135deg, #1b4332 0%, #2d6a4f 50%, #52b788 100%);
                    border-radius: 10px;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                    position: relative;
                    overflow: hidden;
                }
                
                .card::before {
                    content: '';
                    position: absolute;
                    top: -50%;
                    right: -50%;
                    width: 200%;
                    height: 200%;
                    background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
                    animation: shine 3s infinite;
                }
                
                @keyframes shine {
                    0%, 100% { transform: rotate(0deg); }
                    50% { transform: rotate(180deg); }
                }
                
                .card-header {
                    background: rgba(255, 255, 255, 0.95);
                    padding: 8px 15px;
                    text-align: center;
                    border-bottom: 3px solid #ffd60a;
                }
                
                .card-header .logo {
                    max-width: 40px;
                    max-height: 40px;
                    margin-bottom: 5px;
                }
                
                .card-header h3 {
                    margin: 0;
                    font-size: 14px;
                    color: #1b4332;
                    font-weight: 700;
                }
                
                .card-header p {
                    margin: 2px 0 0 0;
                    font-size: 9px;
                    color: #2d6a4f;
                }
                
                .card-body {
                    padding: 15px;
                    color: white;
                    position: relative;
                    z-index: 1;
                }
                
                .photo-section {
                    float: left;
                    width: 80px;
                    margin-right: 15px;
                }
                
                .photo-placeholder {
                    width: 80px;
                    height: 100px;
                    background: rgba(255, 255, 255, 0.9);
                    border: 3px solid #ffd60a;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 40px;
                    color: #2d6a4f;
                }
                
                .info-section {
                    overflow: hidden;
                }
                
                .info-row {
                    margin-bottom: 6px;
                    font-size: 11px;
                }
                
                .info-label {
                    font-weight: 600;
                    color: #ffd60a;
                    display: inline-block;
                    width: 70px;
                }
                
                .info-value {
                    color: white;
                    font-weight: 500;
                }
                
                .card-number {
                    background: rgba(255, 255, 255, 0.2);
                    padding: 8px;
                    border-radius: 5px;
                    text-align: center;
                    margin-top: 10px;
                    clear: both;
                    border: 2px solid #ffd60a;
                }
                
                .card-number-label {
                    font-size: 9px;
                    color: #ffd60a;
                    margin-bottom: 3px;
                }
                
                .card-number-value {
                    font-size: 18px;
                    font-weight: 700;
                    letter-spacing: 2px;
                    color: white;
                    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
                }
                
                .status-badge {
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    background: ${statusColor};
                    color: white;
                    padding: 4px 10px;
                    border-radius: 15px;
                    font-size: 9px;
                    font-weight: 700;
                    text-transform: uppercase;
                    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
                    z-index: 2;
                }
                
                .card-footer {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    background: rgba(27, 67, 50, 0.9);
                    padding: 5px;
                    text-align: center;
                    font-size: 8px;
                    color: #ffd60a;
                }
                
                .print-button {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    padding: 10px 20px;
                    background: #2d6a4f;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 14px;
                    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
                    z-index: 1000;
                }
                
                .print-button:hover {
                    background: #1b4332;
                }
                
                @media print {
                    body {
                        background: white;
                        padding: 0;
                    }
                    
                    .print-button {
                        display: none;
                    }
                    
                    .card-container {
                        margin: 0;
                    }
                }
                
                /* Back side of card */
                .card-back {
                    background: linear-gradient(135deg, #52b788 0%, #2d6a4f 50%, #1b4332 100%);
                }
                
                .card-back .info-text {
                    padding: 20px;
                    color: white;
                    font-size: 10px;
                    line-height: 1.6;
                }
                
                .card-back .info-text h4 {
                    color: #ffd60a;
                    font-size: 12px;
                    margin: 0 0 10px 0;
                    text-align: center;
                }
                
                .card-back .info-text ul {
                    margin: 10px 0;
                    padding-left: 20px;
                }
                
                .card-back .signature {
                    position: absolute;
                    bottom: 40px;
                    left: 20px;
                    right: 20px;
                }
                
                .card-back .signature-line {
                    border-top: 1px solid white;
                    margin-top: 30px;
                    padding-top: 5px;
                    text-align: center;
                    font-size: 9px;
                }
            </style>
        </head>
        <body>
            <button class="print-button" onclick="window.print()">🖨️ Print Kartu</button>
            
            <!-- Front Side -->
            <div class="card-container">
                <div class="card">
                    <div class="status-badge">${statusKartu === 'aktif' ? '✓ AKTIF' : statusKartu === 'blokir' ? '✗ BLOKIR' : '⚠ NONAKTIF'}</div>
                    
                    <div class="card-header">
                        ${koperasi.logo ? `<img src="${koperasi.logo}" class="logo" alt="Logo">` : ''}
                        <h3>${koperasi.nama || 'KOPERASI KARYAWAN'}</h3>
                        <p>${koperasi.alamat || ''}</p>
                    </div>
                    
                    <div class="card-body">
                        <div class="photo-section">
                            <div class="photo-placeholder">
                                <i style="font-size: 50px;">👤</i>
                            </div>
                        </div>
                        
                        <div class="info-section">
                            <div class="info-row">
                                <span class="info-label">Nama</span>
                                <span class="info-value">: ${member.nama}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">NIK</span>
                                <span class="info-value">: ${member.nik}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Departemen</span>
                                <span class="info-value">: ${member.departemen || '-'}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Tipe</span>
                                <span class="info-value">: ${member.tipeAnggota || 'Umum'}</span>
                            </div>
                        </div>
                        
                        <div class="card-number">
                            <div class="card-number-label">NOMOR KARTU ANGGOTA</div>
                            <div class="card-number-value">${member.noKartu}</div>
                        </div>
                    </div>
                    
                    <div class="card-footer">
                        Berlaku sejak ${member.tanggalUbahKartu ? new Date(member.tanggalUbahKartu).toLocaleDateString('id-ID') : new Date().toLocaleDateString('id-ID')}
                    </div>
                </div>
            </div>
            
            <!-- Back Side -->
            <div class="card-container">
                <div class="card card-back">
                    <div class="info-text">
                        <h4>KETENTUAN PENGGUNAAN KARTU</h4>
                        <ul>
                            <li>Kartu ini adalah milik ${koperasi.nama || 'Koperasi'}</li>
                            <li>Tidak dapat dipindahtangankan</li>
                            <li>Harap dilaporkan jika kartu hilang</li>
                            <li>Berlaku untuk transaksi di koperasi</li>
                            <li>Wajib ditunjukkan saat bertransaksi</li>
                        </ul>
                        
                        <div style="margin-top: 15px; text-align: center;">
                            <strong>Hubungi Kami:</strong><br>
                            ${koperasi.telepon ? `Telp: ${koperasi.telepon}<br>` : ''}
                            ${koperasi.alamat || ''}
                        </div>
                        
                        <div class="signature">
                            <div class="signature-line">
                                Pemegang Kartu
                            </div>
                        </div>
                    </div>
                    
                    <div class="card-footer">
                        © ${new Date().getFullYear()} ${koperasi.nama || 'Koperasi Karyawan'}
                    </div>
                </div>
            </div>
        </body>
        </html>
    `);
    
    printWindow.document.close();
}


// Helper function untuk mendapatkan options departemen dari master departemen
function getDepartemenOptions() {
    const departemen = JSON.parse(localStorage.getItem('departemen') || '[]');
    
    // Filter hanya departemen yang aktif
    const aktifDepartemen = departemen.filter(d => d.aktif);
    
    if (aktifDepartemen.length === 0) {
        return '<option value="" disabled>Belum ada departemen aktif</option>';
    }
    
    return aktifDepartemen
        .sort((a, b) => a.nama.localeCompare(b.nama))
        .map(d => `<option value="${d.nama}">${d.nama} (${d.kode})</option>`)
        .join('');
}


// Fungsi untuk melihat detail departemen dari halaman anggota
function lihatDepartemenDetail(namaDepartemen) {
    // Tutup modal anggota jika ada
    const viewModal = document.getElementById('viewAnggotaModal');
    if (viewModal) {
        const modalInstance = bootstrap.Modal.getInstance(viewModal);
        if (modalInstance) modalInstance.hide();
    }
    
    // Cari departemen berdasarkan nama
    const departemen = JSON.parse(localStorage.getItem('departemen') || '[]');
    const dept = departemen.find(d => d.nama === namaDepartemen);
    
    if (dept) {
        // Pindah ke halaman departemen
        navigateTo('departemen');
        
        // Tunggu sebentar agar halaman departemen ter-render
        setTimeout(() => {
            // Tampilkan detail departemen
            viewDepartemen(dept.id);
        }, 100);
    } else {
        showAlert('Departemen tidak ditemukan', 'warning');
    }
}
