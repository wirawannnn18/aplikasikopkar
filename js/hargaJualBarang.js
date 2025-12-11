/**
 * Modul Harga Jual Barang
 * Mengelola penetapan dan pemeliharaan harga jual untuk semua barang
 */

class HargaJualManager {
    constructor() {
        this.masterBarang = [];
        this.hargaJualData = [];
        this.perubahanData = [];
        this.init();
    }

    init() {
        this.loadData();
        this.setupEventListeners();
    }

    // Load semua data yang diperlukan
    loadData() {
        this.loadMasterBarang();
        this.loadHargaJual();
    }

    // Load data master barang dari localStorage
    loadMasterBarang() {
        const stored = localStorage.getItem('masterBarang');
        if (stored) {
            this.masterBarang = JSON.parse(stored);
        } else {
            // Inisialisasi dengan data contoh
            this.masterBarang = this.getDefaultMasterBarang();
            localStorage.setItem('masterBarang', JSON.stringify(this.masterBarang));
        }
    }

    // Load data harga jual dari localStorage
    loadHargaJual() {
        const stored = localStorage.getItem('hargaJualBarang');
        if (stored) {
            this.hargaJualData = JSON.parse(stored);
        } else {
            this.hargaJualData = [];
        }
    }

    // Data master barang default
    getDefaultMasterBarang() {
        return [
            {
                kode: 'BRG001',
                nama: 'Beras Premium 5kg',
                kategori: 'makanan',
                hargaBeli: 65000,
                satuan: 'kg',
                stok: 50,
                supplier: 'PT Beras Sejahtera'
            },
            {
                kode: 'BRG002', 
                nama: 'Minyak Goreng 1L',
                kategori: 'makanan',
                hargaBeli: 15000,
                satuan: 'botol',
                stok: 30,
                supplier: 'CV Minyak Murni'
            },
            {
                kode: 'BRG003',
                nama: 'Pulpen Pilot Hitam',
                kategori: 'alat-tulis',
                hargaBeli: 3000,
                satuan: 'pcs',
                stok: 100,
                supplier: 'Toko ATK Lengkap'
            },
            {
                kode: 'BRG004',
                nama: 'Air Mineral 600ml',
                kategori: 'minuman',
                hargaBeli: 2500,
                satuan: 'botol',
                stok: 200,
                supplier: 'PT Air Bersih'
            },
            {
                kode: 'BRG005',
                nama: 'Kabel USB Type-C 1m',
                kategori: 'elektronik',
                hargaBeli: 25000,
                satuan: 'pcs',
                stok: 15,
                supplier: 'Elektronik Store'
            },
            {
                kode: 'BRG006',
                nama: 'Sabun Mandi Cair 250ml',
                kategori: 'kebersihan',
                hargaBeli: 12000,
                satuan: 'botol',
                stok: 40,
                supplier: 'PT Sabun Wangi'
            },
            {
                kode: 'BRG007',
                nama: 'Teh Celup 25 sachet',
                kategori: 'minuman',
                hargaBeli: 8000,
                satuan: 'box',
                stok: 60,
                supplier: 'CV Teh Asli'
            },
            {
                kode: 'BRG008',
                nama: 'Buku Tulis 58 lembar',
                kategori: 'alat-tulis',
                hargaBeli: 4500,
                satuan: 'pcs',
                stok: 80,
                supplier: 'Toko ATK Lengkap'
            }
        ];
    }

    // Setup event listeners
    setupEventListeners() {
        // Event listener untuk pencarian dan filter akan diatur di HTML
    }

    // Dapatkan harga jual untuk barang tertentu
    getHargaJual(kodeBarang) {
        const harga = this.hargaJualData.find(h => h.kodeBarang === kodeBarang);
        return harga ? harga.hargaJual : 0;
    }

    // Update harga jual barang
    updateHargaJual(kodeBarang, hargaJual, hargaBeli) {
        const harga = parseFloat(hargaJual) || 0;
        
        // Validasi harga jual
        if (harga > 0 && harga < hargaBeli) {
            throw new Error('Harga jual tidak boleh kurang dari harga beli!');
        }

        // Update atau tambah data harga jual
        const existingIndex = this.hargaJualData.findIndex(h => h.kodeBarang === kodeBarang);
        const oldPrice = existingIndex >= 0 ? this.hargaJualData[existingIndex].hargaJual : 0;

        if (existingIndex >= 0) {
            this.hargaJualData[existingIndex].hargaJual = harga;
            this.hargaJualData[existingIndex].tanggalUpdate = new Date().toISOString();
        } else {
            this.hargaJualData.push({
                kodeBarang: kodeBarang,
                hargaJual: harga,
                tanggalBuat: new Date().toISOString(),
                tanggalUpdate: new Date().toISOString()
            });
        }

        // Track perubahan untuk batch save
        this.trackPerubahan(kodeBarang, oldPrice, harga);

        return {
            margin: this.calculateMargin(harga, hargaBeli),
            status: harga > 0 ? 'ada' : 'belum'
        };
    }

    // Hitung margin keuntungan
    calculateMargin(hargaJual, hargaBeli) {
        if (hargaJual <= 0 || hargaBeli <= 0) return 0;
        return (((hargaJual - hargaBeli) / hargaBeli) * 100).toFixed(1);
    }

    // Track perubahan untuk batch save
    trackPerubahan(kodeBarang, hargaLama, hargaBaru) {
        const barang = this.masterBarang.find(b => b.kode === kodeBarang);
        if (!barang) return;

        const perubahanIndex = this.perubahanData.findIndex(p => p.kodeBarang === kodeBarang);
        
        if (perubahanIndex >= 0) {
            this.perubahanData[perubahanIndex].hargaJualBaru = hargaBaru;
        } else {
            this.perubahanData.push({
                kodeBarang: kodeBarang,
                namaBarang: barang.nama,
                hargaJualLama: hargaLama,
                hargaJualBaru: hargaBaru,
                tanggalPerubahan: new Date().toISOString()
            });
        }
    }

    // Simpan semua perubahan ke localStorage
    simpanSemuaPerubahan() {
        if (this.perubahanData.length === 0) {
            throw new Error('Tidak ada perubahan untuk disimpan.');
        }

        try {
            localStorage.setItem('hargaJualBarang', JSON.stringify(this.hargaJualData));
            
            // Log aktivitas
            this.logActivity({
                timestamp: new Date().toISOString(),
                user: this.getCurrentUser(),
                action: 'BATCH_UPDATE_HARGA_JUAL',
                details: `Memperbarui ${this.perubahanData.length} harga jual barang`,
                changes: [...this.perubahanData]
            });
            
            // Reset tracking perubahan
            this.perubahanData = [];
            
            return true;
        } catch (error) {
            console.error('Error saving harga jual:', error);
            throw new Error('Gagal menyimpan data harga jual.');
        }
    }

    // Dapatkan ringkasan perubahan
    getRingkasanPerubahan() {
        return this.perubahanData.map(item => ({
            ...item,
            selisih: item.hargaJualBaru - item.hargaJualLama,
            persentasePerubahan: item.hargaJualLama > 0 ? 
                (((item.hargaJualBaru - item.hargaJualLama) / item.hargaJualLama) * 100).toFixed(1) : 
                'Baru'
        }));
    }

    // Dapatkan statistik harga jual
    getStatistik() {
        const totalBarang = this.masterBarang.length;
        const sudahAda = this.hargaJualData.filter(h => h.hargaJual > 0).length;
        const belumAda = totalBarang - sudahAda;
        
        // Hitung rata-rata margin
        let totalMargin = 0;
        let countMargin = 0;
        let totalKeuntungan = 0;
        
        this.masterBarang.forEach(barang => {
            const hargaJual = this.hargaJualData.find(h => h.kodeBarang === barang.kode);
            if (hargaJual && hargaJual.hargaJual > 0) {
                const margin = parseFloat(this.calculateMargin(hargaJual.hargaJual, barang.hargaBeli));
                const keuntungan = hargaJual.hargaJual - barang.hargaBeli;
                
                totalMargin += margin;
                totalKeuntungan += keuntungan * (barang.stok || 0);
                countMargin++;
            }
        });
        
        return {
            totalBarang,
            sudahAda,
            belumAda,
            persentaseKelengkapan: ((sudahAda / totalBarang) * 100).toFixed(1),
            rataMargin: countMargin > 0 ? (totalMargin / countMargin).toFixed(1) : 0,
            estimasiKeuntungan: totalKeuntungan
        };
    }

    // Filter barang berdasarkan kriteria
    filterBarang(searchTerm = '', kategori = '', status = '') {
        return this.masterBarang.filter(barang => {
            const hargaJual = this.getHargaJual(barang.kode);
            const hasPrice = hargaJual > 0;
            
            // Filter pencarian
            if (searchTerm) {
                const search = searchTerm.toLowerCase();
                if (!barang.kode.toLowerCase().includes(search) && 
                    !barang.nama.toLowerCase().includes(search)) {
                    return false;
                }
            }
            
            // Filter kategori
            if (kategori && barang.kategori !== kategori) {
                return false;
            }
            
            // Filter status
            if (status === 'ada' && !hasPrice) {
                return false;
            } else if (status === 'belum' && hasPrice) {
                return false;
            }
            
            return true;
        });
    }

    // Export data harga jual
    exportData() {
        return this.masterBarang.map(barang => {
            const hargaJual = this.getHargaJual(barang.kode);
            const margin = this.calculateMargin(hargaJual, barang.hargaBeli);
            
            return {
                'Kode Barang': barang.kode,
                'Nama Barang': barang.nama,
                'Kategori': barang.kategori,
                'Harga Beli': barang.hargaBeli,
                'Harga Jual': hargaJual,
                'Margin (%)': margin,
                'Keuntungan per Unit': hargaJual - barang.hargaBeli,
                'Stok': barang.stok || 0,
                'Estimasi Keuntungan': (hargaJual - barang.hargaBeli) * (barang.stok || 0),
                'Status': hargaJual > 0 ? 'Ada Harga' : 'Belum Ada Harga',
                'Supplier': barang.supplier || '-'
            };
        });
    }

    // Bulk update harga jual dengan margin tertentu
    bulkUpdateByMargin(kategori, marginPersen) {
        const margin = parseFloat(marginPersen) / 100;
        let updated = 0;
        
        this.masterBarang.forEach(barang => {
            if (!kategori || barang.kategori === kategori) {
                const hargaJualBaru = Math.round(barang.hargaBeli * (1 + margin));
                this.updateHargaJual(barang.kode, hargaJualBaru, barang.hargaBeli);
                updated++;
            }
        });
        
        return updated;
    }

    // Validasi harga jual
    validateHargaJual(kodeBarang, hargaJual) {
        const barang = this.masterBarang.find(b => b.kode === kodeBarang);
        if (!barang) {
            return { valid: false, message: 'Barang tidak ditemukan' };
        }
        
        const harga = parseFloat(hargaJual);
        
        if (isNaN(harga) || harga < 0) {
            return { valid: false, message: 'Harga harus berupa angka positif' };
        }
        
        if (harga > 0 && harga < barang.hargaBeli) {
            return { valid: false, message: 'Harga jual tidak boleh kurang dari harga beli' };
        }
        
        const margin = this.calculateMargin(harga, barang.hargaBeli);
        if (margin > 1000) { // Margin lebih dari 1000%
            return { 
                valid: false, 
                message: 'Margin terlalu tinggi, periksa kembali harga yang dimasukkan' 
            };
        }
        
        return { valid: true, margin: margin };
    }

    // Utility functions
    getCurrentUser() {
        return localStorage.getItem('currentUser') || 'Admin';
    }

    logActivity(entry) {
        const logs = JSON.parse(localStorage.getItem('activityLogs') || '[]');
        logs.push(entry);
        // Batasi log maksimal 1000 entries
        if (logs.length > 1000) {
            logs.splice(0, logs.length - 1000);
        }
        localStorage.setItem('activityLogs', JSON.stringify(logs));
    }

    formatRupiah(amount) {
        return new Intl.NumberFormat('id-ID').format(amount);
    }

    // Reset semua harga jual (untuk testing/development)
    resetAllHarga() {
        this.hargaJualData = [];
        this.perubahanData = [];
        localStorage.removeItem('hargaJualBarang');
        
        this.logActivity({
            timestamp: new Date().toISOString(),
            user: this.getCurrentUser(),
            action: 'RESET_ALL_HARGA_JUAL',
            details: 'Menghapus semua data harga jual barang'
        });
    }
}

// Export untuk penggunaan di file lain
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HargaJualManager;
}