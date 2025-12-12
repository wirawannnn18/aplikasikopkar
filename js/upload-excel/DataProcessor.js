/**
 * DataProcessor - File parsing and data processing for Excel/CSV uploads
 * 
 * This class handles parsing of CSV and Excel files, data transformation,
 * and chunked processing for optimal performance.
 */

class DataProcessor {
    constructor() {
        /** @type {Map<string, Object[]>} */
        this.sessionData = new Map();
        
        /** @type {number} */
        this.defaultChunkSize = 100;
        
        /** @type {string[]} */
        this.expectedHeaders = ['kode', 'nama', 'kategori', 'satuan', 'harga_beli', 'stok', 'supplier'];
    }

    /**
     * Parse uploaded file based on format with progress tracking
     * @param {File} file - File to parse
     * @param {Object} options - Parsing options
     * @param {Function} options.onProgress - Progress callback function
     * @returns {Promise<Object[]>} Parsed data array
     */
    async parseFile(file, options = {}) {
        const fileName = file.name.toLowerCase();
        const { onProgress } = options;
        
        try {
            if (onProgress) onProgress(0);
            
            let result;
            if (fileName.endsWith('.csv')) {
                result = await this.parseCSV(file, options);
            } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
                result = await this.parseExcel(file, options);
            } else {
                throw new Error('Unsupported file format. Please upload CSV or Excel files only.');
            }
            
            if (onProgress) onProgress(100);
            return result;
            
        } catch (error) {
            if (onProgress) onProgress(0);
            throw new Error(`File parsing failed: ${error.message}`);
        }
    }

    /**
     * Parse CSV file content with enhanced support for quoted values and special characters
     * @param {File|string} csvInput - CSV file or content string
     * @param {Object} options - Parsing options
     * @param {Function} options.onProgress - Progress callback function
     * @returns {Promise<Object[]>} Parsed data array
     */
    async parseCSV(csvInput, options = {}) {
        try {
            const { onProgress } = options;
            let csvContent;
            
            if (typeof csvInput === 'string') {
                csvContent = csvInput;
            } else {
                if (onProgress) onProgress(10);
                csvContent = await this.readFileAsText(csvInput);
            }
            
            if (onProgress) onProgress(30);
            
            // Detect delimiter (comma, semicolon, or tab)
            const delimiter = this.detectCSVDelimiter(csvContent);
            
            // Split into lines with proper handling of quoted content
            const lines = this.splitCSVLines(csvContent);
            
            if (lines.length < 1) {
                throw new Error('CSV file is empty');
            }
            
            if (lines.length < 2) {
                throw new Error('CSV file must contain at least a header row and one data row');
            }
            
            if (onProgress) onProgress(50);
            
            // Parse header row
            const headerLine = lines[0];
            const headers = this.parseCSVLine(headerLine, delimiter)
                .map(header => this.normalizeHeader(header));
            
            // Validate headers
            const headerValidation = this.validateHeaders(headers);
            if (headerValidation.length > 0) {
                throw new Error(`Header validation failed: ${headerValidation[0].message}`);
            }
            
            if (onProgress) onProgress(60);
            
            // Parse data rows with progress tracking
            const data = [];
            const totalRows = lines.length - 1; // Exclude header
            
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i];
                if (!line.trim()) continue; // Skip empty lines
                
                try {
                    const values = this.parseCSVLine(line, delimiter);
                    const row = this.createRowObject(headers, values);
                    const transformedRow = this.transformData(row);
                    data.push(transformedRow);
                } catch (error) {
                    console.warn(`Error parsing line ${i + 1}: ${error.message}`);
                    // Add error row for tracking
                    data.push({
                        _error: true,
                        _errorMessage: error.message,
                        _rowNumber: i + 1,
                        _rawLine: line
                    });
                }
                
                // Report progress
                if (onProgress && i % 100 === 0) {
                    const progress = 60 + ((i / totalRows) * 35); // 60-95%
                    onProgress(progress);
                }
            }
            
            if (onProgress) onProgress(95);
            
            // Filter out error rows for final result but log them
            const validData = data.filter(row => !row._error);
            const errorRows = data.filter(row => row._error);
            
            if (errorRows.length > 0) {
                console.warn(`${errorRows.length} rows had parsing errors and were skipped`);
            }
            
            if (validData.length === 0) {
                throw new Error('No valid data rows found in CSV file');
            }
            
            return validData;
            
        } catch (error) {
            throw new Error(`CSV parsing error: ${error.message}`);
        }
    }

    /**
     * Parse Excel file content
     * @param {File} excelFile - Excel file to parse
     * @param {Object} options - Parsing options
     * @param {Function} options.onProgress - Progress callback function
     * @returns {Promise<Object[]>} Parsed data array
     */
    async parseExcel(excelFile, options = {}) {
        try {
            const { onProgress } = options;
            
            if (onProgress) onProgress(10);
            
            // For now, we'll provide a basic implementation
            // In a production environment, you would use a library like SheetJS (xlsx)
            
            // Check if we can convert to CSV first (some browsers support this)
            if (excelFile.name.toLowerCase().endsWith('.xlsx')) {
                // Try to read as ZIP file and extract the data
                const arrayBuffer = await this.readFileAsArrayBuffer(excelFile);
                
                if (onProgress) onProgress(50);
                
                // This is a placeholder implementation
                // In a real scenario, you would use a proper Excel parsing library
                throw new Error('Excel (.xlsx) parsing requires additional library. Please convert to CSV format or use the CSV template provided.');
            } else if (excelFile.name.toLowerCase().endsWith('.xls')) {
                // Legacy Excel format
                throw new Error('Legacy Excel (.xls) format is not supported. Please save as .xlsx or convert to CSV format.');
            }
            
            throw new Error('Unsupported Excel format');
            
        } catch (error) {
            throw new Error(`Excel parsing error: ${error.message}`);
        }
    }

    /**
     * Convert Excel file to CSV (placeholder for future implementation)
     * @param {File} excelFile - Excel file to convert
     * @returns {Promise<string>} CSV content
     * @private
     */
    async convertExcelToCSV(excelFile) {
        // This would be implemented with a proper Excel library like SheetJS
        // For now, we'll throw an error directing users to use CSV
        throw new Error('Excel to CSV conversion not implemented. Please export your Excel file as CSV format.');
    }

    /**
     * Detect if file is actually CSV with Excel extension
     * @param {File} file - File to check
     * @returns {Promise<boolean>} True if file is CSV content
     * @private
     */
    async isCSVWithExcelExtension(file) {
        try {
            // Read first 1KB to check if it's plain text
            const sample = await this.readFileAsText(file, 1024);
            
            // Check if it looks like CSV (contains commas/semicolons and no binary data)
            const hasDelimiters = /[,;]/.test(sample);
            const isPrintable = /^[\x20-\x7E\s]*$/.test(sample);
            
            return hasDelimiters && isPrintable;
        } catch (error) {
            return false;
        }
    }

    /**
     * Transform raw data to standardized format
     * @param {Object} rawRow - Raw data row
     * @returns {Object} Transformed data row
     */
    transformData(rawRow) {
        const transformed = { ...rawRow };
        
        // Normalize string fields
        if (transformed.kode) {
            transformed.kode = String(transformed.kode).trim();
        }
        
        if (transformed.nama) {
            transformed.nama = String(transformed.nama).trim();
        }
        
        if (transformed.kategori) {
            transformed.kategori = String(transformed.kategori).toLowerCase().trim();
        }
        
        if (transformed.satuan) {
            transformed.satuan = String(transformed.satuan).toLowerCase().trim();
        }
        
        if (transformed.supplier) {
            transformed.supplier = String(transformed.supplier).trim();
        }
        
        // Convert numeric fields
        if (transformed.harga_beli !== undefined && transformed.harga_beli !== '') {
            let priceStr = String(transformed.harga_beli).trim();
            
            if (priceStr === '') {
                transformed.harga_beli = 0;
            } else {
                // Handle different number formats
                // Remove currency symbols and spaces
                priceStr = priceStr.replace(/[$€£¥₹]/g, '').replace(/\s/g, '');
                
                // Detect format: if last comma/dot is followed by exactly 2 digits, it's decimal separator
                const lastComma = priceStr.lastIndexOf(',');
                const lastDot = priceStr.lastIndexOf('.');
                
                if (lastComma > lastDot && lastComma === priceStr.length - 3) {
                    // European format: 1.500,50 -> 1500.50
                    priceStr = priceStr.replace(/\./g, '').replace(',', '.');
                } else if (lastDot > lastComma) {
                    // US format: 1,500.50 -> remove commas
                    priceStr = priceStr.replace(/,/g, '');
                } else {
                    // Remove all non-digit characters except last decimal separator
                    priceStr = priceStr.replace(/[^\d.-]/g, '');
                }
                
                const price = parseFloat(priceStr);
                transformed.harga_beli = isNaN(price) ? 0 : price;
            }
        } else {
            transformed.harga_beli = 0;
        }
        
        if (transformed.stok !== undefined && transformed.stok !== '') {
            let stockStr = String(transformed.stok).trim();
            
            if (stockStr === '') {
                transformed.stok = 0;
            } else {
                // For stock (integer), remove all non-digit characters except minus sign
                stockStr = stockStr.replace(/[^\d-]/g, '');
                
                const stock = parseInt(stockStr);
                transformed.stok = isNaN(stock) ? 0 : stock;
            }
        } else {
            transformed.stok = 0;
        }
        
        // Add timestamps
        const now = new Date().toISOString();
        transformed.created_at = now;
        transformed.updated_at = now;
        
        return transformed;
    }

    /**
     * Process data in chunks for better performance
     * @param {Object[]} data - Data to process
     * @param {Object} options - Processing options
     * @returns {Promise<ImportResults>} Processing results
     */
    async processInChunks(data, options = {}) {
        const chunkSize = options.chunkSize || this.defaultChunkSize;
        const updateExisting = options.updateExisting || false;
        const onProgress = options.onProgress || (() => {});
        
        const chunks = this.chunkData(data, chunkSize);
        const results = {
            created: 0,
            updated: 0,
            failed: 0,
            totalProcessed: 0
        };
        
        const startTime = Date.now();
        
        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            
            try {
                const chunkResult = await this.processChunk(chunk, updateExisting);
                
                // Aggregate results
                results.created += chunkResult.created;
                results.updated += chunkResult.updated;
                results.failed += chunkResult.failed;
                results.totalProcessed += chunk.length;
                
                // Report progress
                const progress = {
                    current: Math.round(((i + 1) / chunks.length) * 100),
                    total: data.length,
                    processed: results.totalProcessed,
                    status: `Processing chunk ${i + 1} of ${chunks.length}`,
                    startTime,
                    estimatedCompletion: this.estimateCompletion(startTime, i + 1, chunks.length)
                };
                
                onProgress(progress);
                
                // Small delay to prevent UI blocking
                await this.delay(10);
                
            } catch (error) {
                console.error(`Error processing chunk ${i + 1}:`, error);
                results.failed += chunk.length;
                results.totalProcessed += chunk.length;
            }
        }
        
        return results;
    }

    /**
     * Process a single chunk of data
     * @param {Object[]} chunk - Data chunk to process
     * @param {boolean} updateExisting - Whether to update existing records
     * @returns {Promise<Object>} Chunk processing results
     */
    async processChunk(chunk, updateExisting = false) {
        const results = { created: 0, updated: 0, failed: 0 };
        const existingBarang = this.getExistingBarangData();
        const existingCodes = new Set(existingBarang.map(b => b.kode));
        
        for (const row of chunk) {
            try {
                if (existingCodes.has(row.kode)) {
                    if (updateExisting) {
                        await this.updateBarangRecord(row);
                        results.updated++;
                    } else {
                        // Skip existing records if not updating
                        results.failed++;
                    }
                } else {
                    await this.createBarangRecord(row);
                    results.created++;
                }
            } catch (error) {
                console.error(`Error processing record ${row.kode}:`, error);
                results.failed++;
            }
        }
        
        return results;
    }

    /**
     * Split data into chunks
     * @param {Object[]} data - Data to chunk
     * @param {number} chunkSize - Size of each chunk
     * @returns {Object[][]} Array of data chunks
     */
    chunkData(data, chunkSize) {
        const chunks = [];
        for (let i = 0; i < data.length; i += chunkSize) {
            chunks.push(data.slice(i, i + chunkSize));
        }
        return chunks;
    }

    /**
     * Store session data for later retrieval
     * @param {string} sessionId - Session ID
     * @param {Object[]} data - Data to store
     */
    storeSessionData(sessionId, data) {
        this.sessionData.set(sessionId, data);
    }

    /**
     * Get stored session data
     * @param {string} sessionId - Session ID
     * @returns {Object[]|null} Stored data or null
     */
    getSessionData(sessionId) {
        return this.sessionData.get(sessionId) || null;
    }

    /**
     * Rollback an import operation
     * @param {RollbackData} rollbackData - Rollback information
     * @returns {Promise<boolean>} Success status
     */
    async rollbackImport(rollbackData) {
        try {
            const existingBarang = this.getExistingBarangData();
            
            // Remove created records
            const filteredBarang = existingBarang.filter(b => 
                !rollbackData.createdIds.includes(b.kode)
            );
            
            // Restore updated records
            for (const originalRecord of rollbackData.originalData) {
                const index = filteredBarang.findIndex(b => b.kode === originalRecord.kode);
                if (index !== -1) {
                    filteredBarang[index] = originalRecord;
                }
            }
            
            // Save restored data
            localStorage.setItem('masterBarang', JSON.stringify(filteredBarang));
            
            return true;
            
        } catch (error) {
            console.error('Rollback error:', error);
            return false;
        }
    }

    /**
     * Detect CSV delimiter by analyzing the first few lines
     * @param {string} csvContent - CSV content to analyze
     * @returns {string} Detected delimiter
     * @private
     */
    detectCSVDelimiter(csvContent) {
        const lines = csvContent.split('\n').slice(0, 5); // Check first 5 lines
        const delimiters = [',', ';', '\t'];
        const counts = {};
        
        delimiters.forEach(delimiter => {
            counts[delimiter] = 0;
            lines.forEach(line => {
                // Count occurrences outside of quotes
                let inQuotes = false;
                for (let i = 0; i < line.length; i++) {
                    if (line[i] === '"') {
                        inQuotes = !inQuotes;
                    } else if (line[i] === delimiter && !inQuotes) {
                        counts[delimiter]++;
                    }
                }
            });
        });
        
        // Return delimiter with highest count, default to comma
        return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b, ',');
    }

    /**
     * Split CSV content into lines while preserving quoted content
     * @param {string} csvContent - CSV content to split
     * @returns {string[]} Array of lines
     * @private
     */
    splitCSVLines(csvContent) {
        const lines = [];
        let currentLine = '';
        let inQuotes = false;
        
        for (let i = 0; i < csvContent.length; i++) {
            const char = csvContent[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
                currentLine += char;
            } else if (char === '\n' && !inQuotes) {
                if (currentLine.trim()) {
                    lines.push(currentLine.trim());
                }
                currentLine = '';
            } else if (char === '\r') {
                // Skip carriage returns
                continue;
            } else {
                currentLine += char;
            }
        }
        
        // Add the last line if it exists
        if (currentLine.trim()) {
            lines.push(currentLine.trim());
        }
        
        return lines;
    }

    /**
     * Normalize header names for consistency
     * @param {string} header - Header to normalize
     * @returns {string} Normalized header
     * @private
     */
    normalizeHeader(header) {
        return header
            .toLowerCase()
            .trim()
            .replace(/[^\w\s]/g, '') // Remove special characters
            .replace(/\s+/g, '_') // Replace spaces with underscores
            .replace(/^_+|_+$/g, ''); // Remove leading/trailing underscores
    }

    /**
     * Parse a single CSV line handling quoted values and custom delimiter
     * @param {string} line - CSV line to parse
     * @param {string} delimiter - Field delimiter
     * @returns {string[]} Array of field values
     * @private
     */
    parseCSVLine(line, delimiter = ',') {
        const result = [];
        let current = '';
        let inQuotes = false;
        let i = 0;
        
        while (i < line.length) {
            const char = line[i];
            
            if (char === '"') {
                if (inQuotes && line[i + 1] === '"') {
                    // Escaped quote
                    current += '"';
                    i += 2;
                } else {
                    // Toggle quote state
                    inQuotes = !inQuotes;
                    i++;
                }
            } else if (char === delimiter && !inQuotes) {
                // Field separator
                result.push(this.cleanFieldValue(current));
                current = '';
                i++;
            } else {
                current += char;
                i++;
            }
        }
        
        // Add the last field
        result.push(this.cleanFieldValue(current));
        
        return result;
    }

    /**
     * Clean and normalize field values
     * @param {string} value - Field value to clean
     * @returns {string} Cleaned value
     * @private
     */
    cleanFieldValue(value) {
        return value
            .trim()
            .replace(/^["']|["']$/g, '') // Remove surrounding quotes
            .trim(); // Trim again after quote removal
    }

    /**
     * Create row object from headers and values
     * @param {string[]} headers - Column headers
     * @param {string[]} values - Row values
     * @returns {Object} Row object
     * @private
     */
    createRowObject(headers, values) {
        const row = {};
        
        headers.forEach((header, index) => {
            const value = values[index] || '';
            row[header] = value;
        });
        
        return row;
    }

    /**
     * Validate headers against expected format
     * @param {string[]} headers - Headers to validate
     * @returns {Object[]} Validation errors
     * @private
     */
    validateHeaders(headers) {
        const errors = [];
        const requiredHeaders = ['kode', 'nama', 'kategori', 'satuan', 'harga_beli', 'stok'];
        
        for (const required of requiredHeaders) {
            if (!headers.includes(required)) {
                errors.push({
                    message: `Required column '${required}' is missing`
                });
            }
        }
        
        return errors;
    }

    /**
     * Create new barang record
     * @param {Object} data - Barang data
     * @returns {Promise<boolean>} Success status
     * @private
     */
    async createBarangRecord(data) {
        const existingBarang = this.getExistingBarangData();
        existingBarang.push(data);
        localStorage.setItem('masterBarang', JSON.stringify(existingBarang));
        return true;
    }

    /**
     * Update existing barang record
     * @param {Object} data - Updated barang data
     * @returns {Promise<boolean>} Success status
     * @private
     */
    async updateBarangRecord(data) {
        const existingBarang = this.getExistingBarangData();
        const index = existingBarang.findIndex(b => b.kode === data.kode);
        
        if (index !== -1) {
            existingBarang[index] = { ...existingBarang[index], ...data };
            localStorage.setItem('masterBarang', JSON.stringify(existingBarang));
            return true;
        }
        
        return false;
    }

    /**
     * Get existing barang data from localStorage
     * @returns {Object[]} Existing barang data
     * @private
     */
    getExistingBarangData() {
        try {
            const data = localStorage.getItem('masterBarang');
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error reading existing barang data:', error);
            return [];
        }
    }

    /**
     * Read file as text with optional size limit
     * @param {File} file - File to read
     * @param {number} maxBytes - Maximum bytes to read (optional)
     * @returns {Promise<string>} File content
     * @private
     */
    readFileAsText(file, maxBytes = null) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error('Failed to read file'));
            
            if (maxBytes && maxBytes < file.size) {
                // Read only a portion of the file
                const blob = file.slice(0, maxBytes);
                reader.readAsText(blob);
            } else {
                reader.readAsText(file);
            }
        });
    }

    /**
     * Read file as array buffer
     * @param {File} file - File to read
     * @returns {Promise<ArrayBuffer>} File content
     * @private
     */
    readFileAsArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error('Failed to read file'));
            reader.readAsArrayBuffer(file);
        });
    }

    /**
     * Estimate completion time
     * @param {number} startTime - Processing start time
     * @param {number} completed - Completed chunks
     * @param {number} total - Total chunks
     * @returns {number} Estimated completion timestamp
     * @private
     */
    estimateCompletion(startTime, completed, total) {
        const elapsed = Date.now() - startTime;
        const rate = completed / elapsed;
        const remaining = total - completed;
        return Date.now() + (remaining / rate);
    }

    /**
     * Delay execution for specified milliseconds
     * @param {number} ms - Milliseconds to delay
     * @returns {Promise<void>} Promise that resolves after delay
     * @private
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Export for use in other modules
export default DataProcessor;