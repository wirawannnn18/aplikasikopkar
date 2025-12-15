/**
 * Type definitions untuk Sistem Transformasi Barang
 * 
 * File ini berisi definisi tipe data dan interface untuk semua komponen
 * dalam sistem transformasi barang.
 */

/**
 * @typedef {Object} TransformationRecord
 * @property {string} id - Unique identifier untuk transformasi
 * @property {string} timestamp - ISO timestamp transformasi
 * @property {string} user - User yang melakukan transformasi
 * @property {TransformationItem} sourceItem - Item sumber transformasi
 * @property {TransformationItem} targetItem - Item target transformasi
 * @property {number} conversionRatio - Rasio konversi yang digunakan
 * @property {string} status - Status transformasi (completed, failed, pending)
 */

/**
 * @typedef {Object} TransformationItem
 * @property {string} id - ID item
 * @property {string} name - Nama item
 * @property {string} unit - Unit item (dus, pcs, dll)
 * @property {number} quantity - Jumlah yang ditransformasi
 * @property {number} stockBefore - Stok sebelum transformasi
 * @property {number} stockAfter - Stok setelah transformasi
 */

/**
 * @typedef {Object} ConversionRatio
 * @property {string} baseProduct - Base product identifier
 * @property {ConversionRule[]} conversions - Array aturan konversi
 */

/**
 * @typedef {Object} ConversionRule
 * @property {string} from - Unit asal
 * @property {string} to - Unit tujuan
 * @property {number} ratio - Rasio konversi
 */

/**
 * @typedef {Object} MasterBarangExtension
 * @property {string} kode - Kode barang
 * @property {string} nama - Nama barang
 * @property {string} baseProduct - Base product identifier untuk grouping
 * @property {string} kategori - Kategori barang
 * @property {string} satuan - Satuan/unit barang
 * @property {number} stok - Jumlah stok
 * @property {number} hargaBeli - Harga beli
 */

/**
 * @typedef {Object} ValidationResult
 * @property {boolean} isValid - Apakah validasi berhasil
 * @property {string[]} errors - Array pesan error jika ada
 * @property {string[]} warnings - Array pesan warning jika ada
 */

/**
 * @typedef {Object} TransformationPreview
 * @property {TransformationItem} sourceItem - Preview item sumber
 * @property {TransformationItem} targetItem - Preview item target
 * @property {number} conversionRatio - Rasio yang akan digunakan
 * @property {ValidationResult} validation - Hasil validasi
 */

/**
 * @typedef {Object} TransformationRequest
 * @property {string} sourceItemId - ID item sumber
 * @property {string} targetItemId - ID item target
 * @property {number} sourceQuantity - Jumlah yang akan ditransformasi
 * @property {string} user - User yang melakukan transformasi
 */

/**
 * @typedef {Object} StockUpdateResult
 * @property {boolean} success - Apakah update berhasil
 * @property {string} message - Pesan hasil update
 * @property {Object} stockBefore - Stok sebelum update
 * @property {Object} stockAfter - Stok setelah update
 */

// Export untuk ES6 modules jika diperlukan
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        // Types akan digunakan melalui JSDoc comments
    };
}