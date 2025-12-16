/**
 * FileProcessor - Handles file parsing and processing for import operations
 * Supports Excel (.xlsx, .xls) and CSV file formats
 */

export class FileProcessor {
    constructor() {
        this.supportedFormats = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
            'application/vnd.ms-excel', // .xls
            'text/csv' // .csv
        ];
    }

    /**
     * Process uploaded file and extract basic information
     */
    async processFile(file) {
        try {
            if (!this.isValidFile(file)) {
                return {
                    success: false,
                    error: 'Invalid file format. Only Excel (.xlsx, .xls) and CSV files are supported.'
                };
            }

            const fileType = this.getFileType(file);
            
            if (fileType === 'csv') {
                return await this.processCSVFile(file);
            } else {
                return await this.processExcelFile(file);
            }

        } catch (error) {
            console.error('Error processing file:', error);
            return {
                success: false,
                error: 'Error processing file: ' + error.message
            };
        }
    }

    /**
     * Check if file is valid
     */
    isValidFile(file) {
        if (!file) return false;
        
        const isValidType = this.supportedFormats.includes(file.type) || 
                           file.name.toLowerCase().endsWith('.csv');
        
        const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB limit
        
        return isValidType && isValidSize;
    }

    /**
     * Determine file type
     */
    getFileType(file) {
        if (file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv')) {
            return 'csv';
        } else {
            return 'excel';
        }
    }

    /**
     * Process CSV file
     */
    async processCSVFile(file) {
        try {
            const text = await this.readFileAsText(file);
            const data = this.parseCSV(text);
            
            return {
                success: true,
                data: data,
                sheets: null, // CSV doesn't have sheets
                type: 'csv'
            };

        } catch (error) {
            return {
                success: false,
                error: 'Error parsing CSV file: ' + error.message
            };
        }
    }

    /**
     * Process Excel file
     */
    async processExcelFile(file) {
        try {
            // For Excel files, we'll use a simple approach
            // In a production environment, you'd want to use a library like SheetJS
            
            // For now, we'll simulate Excel processing
            // This is a placeholder - you should implement actual Excel parsing
            
            return {
                success: false,
                error: 'Excel file processing requires additional library. Please use CSV format for now.'
            };

        } catch (error) {
            return {
                success: false,
                error: 'Error parsing Excel file: ' + error.message
            };
        }
    }

    /**
     * Read file as text
     */
    readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                resolve(e.target.result);
            };
            
            reader.onerror = () => {
                reject(new Error('Failed to read file'));
            };
            
            reader.readAsText(file, 'UTF-8');
        });
    }

    /**
     * Parse CSV content
     */
    parseCSV(text) {
        const lines = text.split('\n');
        const result = [];
        
        if (lines.length === 0) {
            return result;
        }

        // Parse header row
        const headers = this.parseCSVLine(lines[0]);
        
        // Parse data rows
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line) {
                const values = this.parseCSVLine(line);
                const row = {};
                
                headers.forEach((header, index) => {
                    row[header] = values[index] || '';
                });
                
                result.push(row);
            }
        }

        return result;
    }

    /**
     * Parse single CSV line handling quotes and commas
     */
    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                if (inQuotes && line[i + 1] === '"') {
                    // Escaped quote
                    current += '"';
                    i++; // Skip next quote
                } else {
                    // Toggle quote state
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                // Field separator
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        
        // Add last field
        result.push(current.trim());
        
        return result;
    }

    /**
     * Get preview data from file
     */
    async getPreviewData(file, sheetName = null, headerRow = 1) {
        try {
            const fileType = this.getFileType(file);
            
            if (fileType === 'csv') {
                return await this.getCSVPreviewData(file, headerRow);
            } else {
                return await this.getExcelPreviewData(file, sheetName, headerRow);
            }

        } catch (error) {
            return {
                success: false,
                error: 'Error getting preview data: ' + error.message
            };
        }
    }

    /**
     * Get CSV preview data
     */
    async getCSVPreviewData(file, headerRow = 1) {
        try {
            const text = await this.readFileAsText(file);
            const lines = text.split('\n').filter(line => line.trim());
            
            if (lines.length < headerRow) {
                return {
                    success: false,
                    error: 'Header row number exceeds file length'
                };
            }

            // Get headers from specified row
            const headers = this.parseCSVLine(lines[headerRow - 1]);
            
            // Parse data rows
            const data = [];
            for (let i = headerRow; i < lines.length; i++) {
                const line = lines[i].trim();
                if (line) {
                    const values = this.parseCSVLine(line);
                    const row = {};
                    
                    headers.forEach((header, index) => {
                        row[header] = values[index] || '';
                    });
                    
                    data.push(row);
                }
            }

            return {
                success: true,
                data: data,
                headers: headers
            };

        } catch (error) {
            return {
                success: false,
                error: 'Error parsing CSV preview: ' + error.message
            };
        }
    }

    /**
     * Get Excel preview data (placeholder)
     */
    async getExcelPreviewData(file, sheetName, headerRow = 1) {
        // Placeholder for Excel preview
        return {
            success: false,
            error: 'Excel preview not implemented. Please use CSV format.'
        };
    }

    /**
     * Get mapped data based on column mapping
     */
    async getMappedData(file, sheetName = null, headerRow = 1, columnMapping = {}) {
        try {
            const previewResult = await this.getPreviewData(file, sheetName, headerRow);
            
            if (!previewResult.success) {
                return previewResult;
            }

            const mappedData = previewResult.data.map(row => {
                const mappedRow = {};
                
                Object.keys(columnMapping).forEach(targetField => {
                    const sourceColumn = columnMapping[targetField];
                    mappedRow[targetField] = row[sourceColumn] || '';
                });
                
                return mappedRow;
            });

            return {
                success: true,
                data: mappedData
            };

        } catch (error) {
            return {
                success: false,
                error: 'Error mapping data: ' + error.message
            };
        }
    }

    /**
     * Validate file structure
     */
    async validateFileStructure(file, requiredColumns = []) {
        try {
            const previewResult = await this.getPreviewData(file);
            
            if (!previewResult.success) {
                return previewResult;
            }

            const headers = previewResult.headers;
            const missingColumns = requiredColumns.filter(col => 
                !headers.some(header => 
                    header.toLowerCase().includes(col.toLowerCase())
                )
            );

            if (missingColumns.length > 0) {
                return {
                    success: false,
                    error: `Missing required columns: ${missingColumns.join(', ')}`,
                    missingColumns: missingColumns,
                    availableColumns: headers
                };
            }

            return {
                success: true,
                headers: headers,
                rowCount: previewResult.data.length
            };

        } catch (error) {
            return {
                success: false,
                error: 'Error validating file structure: ' + error.message
            };
        }
    }

    /**
     * Get file statistics
     */
    async getFileStatistics(file) {
        try {
            const previewResult = await this.getPreviewData(file);
            
            if (!previewResult.success) {
                return previewResult;
            }

            const data = previewResult.data;
            const headers = previewResult.headers;

            const stats = {
                totalRows: data.length,
                totalColumns: headers.length,
                emptyRows: 0,
                duplicateRows: 0,
                columnStats: {}
            };

            // Calculate column statistics
            headers.forEach(header => {
                const values = data.map(row => row[header]).filter(val => val && val.trim());
                const uniqueValues = new Set(values);
                
                stats.columnStats[header] = {
                    totalValues: values.length,
                    uniqueValues: uniqueValues.size,
                    emptyValues: data.length - values.length,
                    fillRate: (values.length / data.length * 100).toFixed(1) + '%'
                };
            });

            // Count empty rows
            stats.emptyRows = data.filter(row => 
                headers.every(header => !row[header] || !row[header].trim())
            ).length;

            // Count duplicate rows (based on all columns)
            const rowStrings = data.map(row => 
                headers.map(header => row[header] || '').join('|')
            );
            const uniqueRowStrings = new Set(rowStrings);
            stats.duplicateRows = rowStrings.length - uniqueRowStrings.size;

            return {
                success: true,
                statistics: stats
            };

        } catch (error) {
            return {
                success: false,
                error: 'Error calculating file statistics: ' + error.message
            };
        }
    }

    /**
     * Clean and normalize data
     */
    cleanData(data) {
        return data.map(row => {
            const cleanedRow = {};
            
            Object.keys(row).forEach(key => {
                let value = row[key];
                
                if (typeof value === 'string') {
                    // Trim whitespace
                    value = value.trim();
                    
                    // Convert empty strings to null
                    if (value === '') {
                        value = null;
                    } else {
                        // Clean up common issues only for non-null values
                        value = value
                            .replace(/\s+/g, ' ') // Multiple spaces to single space
                            .replace(/[""]/g, '"') // Normalize quotes
                            .replace(/['']/g, "'"); // Normalize apostrophes
                    }
                }
                
                cleanedRow[key] = value;
            });
            
            return cleanedRow;
        });
    }

    /**
     * Detect column types
     */
    detectColumnTypes(data, headers) {
        const types = {};
        
        headers.forEach(header => {
            const values = data
                .map(row => row[header])
                .filter(val => val !== null && val !== undefined && val !== '');
            
            if (values.length === 0) {
                types[header] = 'unknown';
                return;
            }

            // Check if all values are numbers
            const numericValues = values.filter(val => !isNaN(parseFloat(val)));
            if (numericValues.length === values.length) {
                // Check if all are integers
                const integerValues = values.filter(val => Number.isInteger(parseFloat(val)));
                types[header] = integerValues.length === values.length ? 'integer' : 'decimal';
                return;
            }

            // Check if all values are dates
            const dateValues = values.filter(val => !isNaN(Date.parse(val)));
            if (dateValues.length === values.length) {
                types[header] = 'date';
                return;
            }

            // Check if all values are boolean-like
            const booleanValues = values.filter(val => 
                ['true', 'false', 'yes', 'no', '1', '0', 'ya', 'tidak'].includes(val.toLowerCase())
            );
            if (booleanValues.length === values.length) {
                types[header] = 'boolean';
                return;
            }

            // Default to text
            types[header] = 'text';
        });
        
        return types;
    }

    /**
     * Generate sample data for templates
     */
    generateSampleData() {
        return [
            {
                'Kode Barang': 'BRG001',
                'Nama Barang': 'Beras Premium 5kg',
                'Kategori': 'Sembako',
                'Satuan': 'Karung',
                'Harga Beli': '45000',
                'Harga Jual': '50000',
                'Stok': '100',
                'Stok Minimum': '10',
                'Deskripsi': 'Beras premium kualitas terbaik'
            },
            {
                'Kode Barang': 'BRG002',
                'Nama Barang': 'Minyak Goreng 1L',
                'Kategori': 'Sembako',
                'Satuan': 'Botol',
                'Harga Beli': '12000',
                'Harga Jual': '14000',
                'Stok': '50',
                'Stok Minimum': '5',
                'Deskripsi': 'Minyak goreng berkualitas'
            },
            {
                'Kode Barang': 'BRG003',
                'Nama Barang': 'Gula Pasir 1kg',
                'Kategori': 'Sembako',
                'Satuan': 'Kg',
                'Harga Beli': '13000',
                'Harga Jual': '15000',
                'Stok': '75',
                'Stok Minimum': '15',
                'Deskripsi': 'Gula pasir putih bersih'
            }
        ];
    }
}