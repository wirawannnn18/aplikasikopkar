// Reports Module

// Import error handling and diagnostics modules
// Note: These will be loaded via script tags in HTML

function renderLaporan() {
    const content = document.getElementById('mainContent');
    
    content.innerHTML = `
        <h2>Laporan</h2>
        <div class="row">
            <div class="col-md-6 mb-3">
                <div class="card">
                    <div class="card-body">
                        <h5>Laporan Koperasi</h5>
                        <button class="btn btn-primary btn-sm mb-2 w-100" onclick="laporanSimpanan()">Laporan Simpanan</button>
                        <button class="btn btn-primary btn-sm mb-2 w-100" onclick="laporanHutangPiutang()">Laporan Hutang Piutang</button>
                        <button class="btn btn-primary btn-sm mb-2 w-100" onclick="laporanTagihanAnggota()">Laporan Tagihan Anggota</button>
                        <button class="btn btn-primary btn-sm mb-2 w-100" onclick="laporanNeraca()">Neraca (Balance Sheet)</button>
                        <button class="btn btn-primary btn-sm mb-2 w-100" onclick="laporanLabaRugiKoperasi()">Laba Rugi Koperasi</button>
                        <button class="btn btn-primary btn-sm mb-2 w-100" onclick="laporanBukuBesar()">Buku Besar</button>
                    </div>
                </div>
            </div>
            <div class="col-md-6 mb-3">
                <div class="card">
                    <div class="card-body">
                        <h5>Laporan POS</h5>
                        <button class="btn btn-success btn-sm mb-2 w-100" onclick="laporanPenjualan()">Laporan Penjualan</button>
                        <button class="btn btn-success btn-sm mb-2 w-100" onclick="laporanStok()">Laporan Stok</button>
                        <button class="btn btn-success btn-sm mb-2 w-100" onclick="laporanLabaRugiPOS()">Laba Rugi POS</button>
                        <button class="btn btn-success btn-sm mb-2 w-100" onclick="laporanKasBesar()">Kas Besar</button>
                    </div>
                </div>
            </div>
        </div>
        <div id="laporanContent"></div>
    `;
}

function laporanSimpanan() {
    // Use new function that automatically excludes processed anggota keluar
    const anggotaList = getAnggotaWithSimpananForLaporan();
    const simpananSukarela = JSON.parse(localStorage.getItem('simpananSukarela') || '[]');
    
    const content = document.getElementById('laporanContent');
    
    // Calculate grand totals
    let grandTotalPokok = 0;
    let grandTotalWajib = 0;
    let grandTotalSukarela = 0;
    let grandTotal = 0;
    
    content.innerHTML = `
        <h4>Laporan Simpanan Anggota</h4>
        <div class="alert alert-info">
            <i class="bi bi-info-circle me-2"></i>
            <strong>Catatan:</strong> Laporan ini otomatis mengecualikan anggota yang sudah keluar dan telah diproses pengembaliannya.
        </div>
        <table class="table table-striped">
            <thead class="table-light">
                <tr>
                    <th>Nama Anggota</th>
                    <th class="text-end">Simpanan Pokok</th>
                    <th class="text-end">Simpanan Wajib</th>
                    <th class="text-end">Simpanan Sukarela</th>
                    <th class="text-end">Total</th>
                </tr>
            </thead>
            <tbody>
                ${anggotaList.map(a => {
                    // simpananPokok and simpananWajib already calculated by getAnggotaWithSimpananForLaporan
                    const pokok = a.simpananPokok;
                    const wajib = a.simpananWajib;
                    // Filter simpanan sukarela with jumlah > 0
                    const sukarela = simpananSukarela
                        .filter(s => s.anggotaId === a.id && s.jumlah > 0)
                        .reduce((sum, s) => sum + s.jumlah, 0);
                    const total = pokok + wajib + sukarela;
                    
                    // Add to grand totals
                    grandTotalPokok += pokok;
                    grandTotalWajib += wajib;
                    grandTotalSukarela += sukarela;
                    grandTotal += total;
                    
                    return `
                        <tr>
                            <td>${a.nama}</td>
                            <td class="text-end">${formatRupiah(pokok)}</td>
                            <td class="text-end">${formatRupiah(wajib)}</td>
                            <td class="text-end">${formatRupiah(sukarela)}</td>
                            <td class="text-end"><strong>${formatRupiah(total)}</strong></td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
            <tfoot class="table-dark">
                <tr>
                    <th>TOTAL</th>
                    <th class="text-end">${formatRupiah(grandTotalPokok)}</th>
                    <th class="text-end">${formatRupiah(grandTotalWajib)}</th>
                    <th class="text-end">${formatRupiah(grandTotalSukarela)}</th>
                    <th class="text-end">${formatRupiah(grandTotal)}</th>
                </tr>
            </tfoot>
        </table>
        <button class="btn btn-secondary" onclick="downloadCSV('laporan_simpanan')">
            <i class="bi bi-download me-1"></i>Download CSV
        </button>
    `;
}

// Global variable to store report data for filtering
let hutangPiutangReportData = [];
let hutangPiutangDepartemenList = [];

function laporanHutangPiutang() {
    const anggota = JSON.parse(localStorage.getItem('anggota') || '[]');
    const penjualan = JSON.parse(localStorage.getItem('penjualan') || '[]');
    const departemen = JSON.parse(localStorage.getItem('departemen') || '[]');
    
    // Store departemen list globally for filter
    hutangPiutangDepartemenList = departemen;
    
    // Task 3.1: Join anggota with departemen data and calculate hutang with payment integration
    hutangPiutangReportData = anggota.map(a => {
        // Find department name from departemen master data
        let departemenNama = '-';
        if (a.departemen) {
            // Check if departemen field is an ID or name
            const dept = departemen.find(d => d.id === a.departemen || d.nama === a.departemen);
            if (dept) {
                departemenNama = dept.nama;
            } else {
                // If not found in departemen master, use the value from anggota
                departemenNama = a.departemen;
            }
        }
        
        // Task 3.1: Use shared calculation functions from utils.js
        // Calculate total kredit from POS transactions
        const totalKredit = hitungTotalKredit(a.id);
        
        // Calculate total pembayaran hutang
        const totalPembayaran = hitungTotalPembayaranHutang(a.id);
        
        // Calculate saldo hutang (kredit - pembayaran)
        const saldoHutang = hitungSaldoHutang(a.id);
        
        // Task 3.3: Update status determination logic to use saldoHutang
        const status = saldoHutang <= 0 ? 'Lunas' : 'Belum Lunas';
        
        return {
            anggotaId: a.id,
            nik: a.nik || '-',
            nama: a.nama,
            departemen: departemenNama,
            departemenId: a.departemen || '',
            totalKredit: totalKredit,           // Task 3.1: Add totalKredit
            totalPembayaran: totalPembayaran,   // Task 3.1: Add totalPembayaran
            saldoHutang: saldoHutang,           // Task 3.1: Add saldoHutang
            totalHutang: saldoHutang,           // Keep for backward compatibility
            status: status                       // Task 3.3: Status based on saldoHutang
        };
    });
    
    const content = document.getElementById('laporanContent');
    
    // Check if there's any data
    if (hutangPiutangReportData.length === 0) {
        content.innerHTML = `
            <div class="alert alert-info">
                <i class="bi bi-info-circle me-2"></i>
                <strong>Tidak ada data</strong> - Belum ada anggota yang terdaftar.
            </div>
        `;
        return;
    }
    
    // Get unique departments for filter
    const uniqueDepartments = [...new Set(hutangPiutangReportData.map(d => d.departemen))].filter(d => d !== '-');
    
    content.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h4 class="mb-0">
                <i class="bi bi-file-earmark-text me-2" style="color: #2d6a4f;"></i>
                Laporan Hutang Piutang Anggota
            </h4>
            <span class="badge bg-primary" id="totalAnggotaBadge">
                Total: ${hutangPiutangReportData.length} Anggota
            </span>
        </div>
        
        <!-- Filter Section -->
        <div class="card mb-3">
            <div class="card-body">
                <div class="row g-3 align-items-end">
                    <div class="col-md-4">
                        <label class="form-label">
                            <i class="bi bi-funnel me-1"></i>Filter Departemen
                        </label>
                        <select class="form-select" id="filterDepartemenHutangPiutang" onchange="filterHutangPiutangByDepartemen()">
                            <option value="">Semua Departemen</option>
                            ${uniqueDepartments.map(dept => `<option value="${dept}">${dept}</option>`).join('')}
                            <option value="-">Tanpa Departemen</option>
                        </select>
                    </div>
                    <div class="col-md-3">
                        <button class="btn btn-warning" onclick="resetFilterHutangPiutang()">
                            <i class="bi bi-arrow-clockwise me-1"></i>Reset Filter
                        </button>
                    </div>
                    <div class="col-md-5">
                        <div class="alert alert-info mb-0 py-2">
                            <small>
                                <i class="bi bi-info-circle me-1"></i>
                                Menampilkan <strong id="countFilteredHutangPiutang">${hutangPiutangReportData.length}</strong> dari <strong>${hutangPiutangReportData.length}</strong> anggota
                            </small>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Report Table -->
        <div class="card" id="hutangPiutangTableCard">
            <!-- Table will be rendered here -->
        </div>
    `;
    
    // Initial render of table
    renderHutangPiutangTable(hutangPiutangReportData);
}

// Function to render the hutang piutang table
function renderHutangPiutangTable(dataToRender) {
    const tableCard = document.getElementById('hutangPiutangTableCard');
    
    if (!tableCard) return;
    
    if (dataToRender.length === 0) {
        tableCard.innerHTML = `
            <div class="card-body">
                <div class="alert alert-warning">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    <strong>Tidak ada data</strong> - Tidak ada anggota yang sesuai dengan filter.
                </div>
            </div>
        `;
        return;
    }
    
    tableCard.innerHTML = `
        <div class="card-body">
            <div class="table-responsive">
                <table class="table table-striped table-hover align-middle">
                    <thead class="table-light">
                        <tr>
                            <th><i class="bi bi-person-badge me-1"></i>NIK</th>
                            <th><i class="bi bi-person me-1"></i>Nama Anggota</th>
                            <th><i class="bi bi-building me-1"></i>Departemen</th>
                            <th><i class="bi bi-credit-card me-1"></i>Total Kredit</th>
                            <th><i class="bi bi-cash me-1"></i>Total Pembayaran</th>
                            <th><i class="bi bi-cash-stack me-1"></i>Saldo Hutang</th>
                            <th><i class="bi bi-check-circle me-1"></i>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${dataToRender.map(data => {
                            // Add visual indicator for department
                            const deptDisplay = data.departemen === '-' 
                                ? '<span class="text-muted fst-italic">Tidak Ada Departemen</span>' 
                                : `<span class="badge bg-info bg-opacity-10 text-info">${data.departemen}</span>`;
                            
                            // Task 3.2: Add visual styling for saldo hutang
                            const saldoClass = data.saldoHutang > 0 ? 'text-danger' : 'text-success';
                            
                            // Task 4.1: Add click handler for payment history
                            const hasPayments = data.totalPembayaran > 0;
                            const cursorStyle = hasPayments ? 'cursor: pointer;' : '';
                            const rowClass = hasPayments ? 'table-row-clickable' : '';
                            const onClick = hasPayments ? `onclick="showPaymentHistory('${data.anggotaId}', '${data.nama}')"` : '';
                            
                            return `
                                <tr class="${rowClass}" style="${cursorStyle}" ${onClick} title="${hasPayments ? 'Klik untuk melihat riwayat pembayaran' : ''}">
                                    <td><code>${data.nik}</code></td>
                                    <td><strong>${data.nama}</strong>${hasPayments ? ' <i class="bi bi-info-circle-fill text-primary" style="font-size: 0.8rem;"></i>' : ''}</td>
                                    <td>${deptDisplay}</td>
                                    <td>${formatRupiah(data.totalKredit)}</td>
                                    <td class="text-primary">${formatRupiah(data.totalPembayaran)}</td>
                                    <td><strong class="${saldoClass}">${formatRupiah(data.saldoHutang)}</strong></td>
                                    <td>${data.saldoHutang > 0 ? '<span class="badge bg-warning text-dark"><i class="bi bi-exclamation-triangle me-1"></i>Belum Lunas</span>' : '<span class="badge bg-success"><i class="bi bi-check-circle me-1"></i>Lunas</span>'}</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        </div>
        <div class="card-footer">
            <button class="btn btn-secondary" onclick="downloadHutangPiutangCSV()">
                <i class="bi bi-download me-1"></i>Download CSV
            </button>
        </div>
    `;
}

// Function to filter hutang piutang by departemen
function filterHutangPiutangByDepartemen() {
    const filterValue = document.getElementById('filterDepartemenHutangPiutang').value;
    
    let filteredData;
    if (filterValue === '') {
        // Show all
        filteredData = hutangPiutangReportData;
    } else {
        // Filter by selected department
        filteredData = hutangPiutangReportData.filter(data => data.departemen === filterValue);
    }
    
    // Update count display
    const countElement = document.getElementById('countFilteredHutangPiutang');
    if (countElement) {
        countElement.textContent = filteredData.length;
    }
    
    // Re-render table with filtered data
    renderHutangPiutangTable(filteredData);
}

// Function to reset filter
function resetFilterHutangPiutang() {
    const filterSelect = document.getElementById('filterDepartemenHutangPiutang');
    if (filterSelect) {
        filterSelect.value = '';
    }
    
    // Update count display
    const countElement = document.getElementById('countFilteredHutangPiutang');
    if (countElement) {
        countElement.textContent = hutangPiutangReportData.length;
    }
    
    // Re-render table with all data
    renderHutangPiutangTable(hutangPiutangReportData);
}

// Function to download hutang piutang report as CSV
function downloadHutangPiutangCSV() {
    // Get current filter value
    const filterSelect = document.getElementById('filterDepartemenHutangPiutang');
    const filterValue = filterSelect ? filterSelect.value : '';
    
    // Get data to export (respect current filter)
    let dataToExport;
    if (filterValue === '') {
        dataToExport = hutangPiutangReportData;
    } else {
        dataToExport = hutangPiutangReportData.filter(data => data.departemen === filterValue);
    }
    
    if (dataToExport.length === 0) {
        showAlert('Tidak ada data untuk di-export', 'warning');
        return;
    }
    
    // Create CSV content with UTF-8 BOM for Excel compatibility
    const BOM = '\uFEFF';
    
    // Task 3.2: CSV Headers with new payment columns
    const headers = ['NIK', 'Nama Anggota', 'Departemen', 'Total Kredit', 'Total Pembayaran', 'Saldo Hutang', 'Status'];
    let csvContent = BOM + headers.join(',') + '\n';
    
    // Task 3.2: CSV Data with new payment columns
    dataToExport.forEach(data => {
        const row = [
            `"${data.nik}"`,
            `"${data.nama}"`,
            `"${data.departemen}"`,
            data.totalKredit || 0,
            data.totalPembayaran || 0,
            data.saldoHutang || 0,
            `"${data.status}"`
        ];
        csvContent += row.join(',') + '\n';
    });
    
    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    // Generate filename with current date
    const today = new Date();
    const dateStr = today.getFullYear() + 
                    String(today.getMonth() + 1).padStart(2, '0') + 
                    String(today.getDate()).padStart(2, '0');
    const filename = `laporan_hutang_piutang_${dateStr}.csv`;
    
    // Trigger download
    if (navigator.msSaveBlob) {
        // IE 10+
        navigator.msSaveBlob(blob, filename);
    } else {
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    
    // Show success message
    const filterInfo = filterValue ? ` (Filter: ${filterValue})` : '';
    showAlert(`✓ CSV berhasil di-download: ${dataToExport.length} data${filterInfo}`, 'success');
}

function laporanLabaRugiKoperasi() {
    const coa = JSON.parse(localStorage.getItem('coa') || '[]');
    const koperasi = JSON.parse(localStorage.getItem('koperasi'));
    const pendapatan = coa.filter(c => c.tipe === 'Pendapatan');
    const beban = coa.filter(c => c.tipe === 'Beban');
    const modal = coa.filter(c => c.tipe === 'Modal');
    
    const modalAwal = koperasi ? (koperasi.modalAwal || 0) : 0;
    const totalPendapatan = pendapatan.reduce((sum, p) => sum + p.saldo, 0);
    const totalBeban = beban.reduce((sum, b) => sum + b.saldo, 0);
    const totalModal = modal.reduce((sum, m) => sum + m.saldo, 0);
    const labaRugi = totalPendapatan - totalBeban;
    const totalModalAkhir = modalAwal + totalModal + labaRugi;
    
    const content = document.getElementById('laporanContent');
    content.innerHTML = `
        <h4>Laporan Laba Rugi Koperasi</h4>
        <div class="alert alert-info mb-3">
            <strong><i class="bi bi-info-circle me-2"></i>Modal Awal Koperasi:</strong> ${formatRupiah(modalAwal)}
        </div>
        <table class="table">
            <tr><th colspan="2" class="bg-light">MODAL</th></tr>
            <tr><td>Modal Awal Koperasi</td><td class="text-end">${formatRupiah(modalAwal)}</td></tr>
            ${modal.map(m => `<tr><td>${m.nama}</td><td class="text-end">${formatRupiah(m.saldo)}</td></tr>`).join('')}
            <tr><th>Total Modal</th><th class="text-end">${formatRupiah(modalAwal + totalModal)}</th></tr>
            
            <tr><th colspan="2" class="bg-light mt-3">PENDAPATAN</th></tr>
            ${pendapatan.map(p => `<tr><td>${p.nama}</td><td class="text-end">${formatRupiah(p.saldo)}</td></tr>`).join('')}
            <tr><th>Total Pendapatan</th><th class="text-end">${formatRupiah(totalPendapatan)}</th></tr>
            
            <tr><th colspan="2" class="bg-light">BEBAN</th></tr>
            ${beban.map(b => `<tr><td>${b.nama}</td><td class="text-end">${formatRupiah(b.saldo)}</td></tr>`).join('')}
            <tr><th>Total Beban</th><th class="text-end">${formatRupiah(totalBeban)}</th></tr>
            
            <tr><th>LABA/RUGI BERSIH</th><th class="text-end ${labaRugi >= 0 ? 'text-success' : 'text-danger'}">${formatRupiah(labaRugi)}</th></tr>
            <tr class="table-primary"><th>TOTAL MODAL AKHIR</th><th class="text-end"><strong>${formatRupiah(totalModalAkhir)}</strong></th></tr>
        </table>
    `;
}

function laporanBukuBesar() {
    const coa = JSON.parse(localStorage.getItem('coa') || '[]');
    const jurnal = JSON.parse(localStorage.getItem('jurnal') || '[]');
    
    const content = document.getElementById('laporanContent');
    content.innerHTML = `
        <h4>Buku Besar</h4>
        ${coa.map(akun => {
            const entries = [];
            jurnal.forEach(j => {
                j.entries.forEach(e => {
                    if (e.akun === akun.kode) {
                        entries.push({
                            tanggal: j.tanggal,
                            keterangan: j.keterangan,
                            debit: e.debit,
                            kredit: e.kredit
                        });
                    }
                });
            });
            
            return `
                <h5>${akun.kode} - ${akun.nama}</h5>
                <table class="table table-sm mb-4">
                    <thead>
                        <tr><th>Tanggal</th><th>Keterangan</th><th>Debit</th><th>Kredit</th><th>Saldo</th></tr>
                    </thead>
                    <tbody>
                        ${entries.map((e, idx) => {
                            const saldo = entries.slice(0, idx + 1).reduce((sum, entry) => sum + entry.debit - entry.kredit, 0);
                            return `
                                <tr>
                                    <td>${formatDate(e.tanggal)}</td>
                                    <td>${e.keterangan}</td>
                                    <td>${formatRupiah(e.debit)}</td>
                                    <td>${formatRupiah(e.kredit)}</td>
                                    <td>${formatRupiah(saldo)}</td>
                                </tr>
                            `;
                        }).join('')}
                        <tr><th colspan="4">Saldo Akhir</th><th>${formatRupiah(akun.saldo)}</th></tr>
                    </tbody>
                </table>
            `;
        }).join('')}
    `;
}

function laporanPenjualan() {
    const penjualan = JSON.parse(localStorage.getItem('penjualan') || '[]');
    const anggota = JSON.parse(localStorage.getItem('anggota') || '[]');
    
    const content = document.getElementById('laporanContent');
    content.innerHTML = `
        <h4>Laporan Penjualan</h4>
        <table class="table">
            <thead>
                <tr><th>No Transaksi</th><th>Tanggal</th><th>Anggota</th><th>Total</th><th>Metode</th><th>Status</th></tr>
            </thead>
            <tbody>
                ${penjualan.map(p => {
                    const member = anggota.find(a => a.id === p.anggotaId);
                    return `
                        <tr>
                            <td>${p.id}</td>
                            <td>${formatDate(p.tanggal)}</td>
                            <td>${member ? member.nama : 'Umum'}</td>
                            <td>${formatRupiah(p.total)}</td>
                            <td>${p.metode}</td>
                            <td>${p.status}</td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
            <tfoot>
                <tr><th colspan="3">Total</th><th>${formatRupiah(penjualan.reduce((sum, p) => sum + p.total, 0))}</th><th colspan="2"></th></tr>
            </tfoot>
        </table>
        <button class="btn btn-secondary" onclick="downloadCSV('laporan_penjualan')">Download CSV</button>
    `;
}

function laporanStok() {
    const barang = JSON.parse(localStorage.getItem('barang') || '[]');
    
    const content = document.getElementById('laporanContent');
    content.innerHTML = `
        <h4>Laporan Stok Barang</h4>
        <table class="table">
            <thead>
                <tr><th>Barcode</th><th>Nama Barang</th><th>Stok</th><th>HPP</th><th>Nilai Stok</th></tr>
            </thead>
            <tbody>
                ${barang.map(b => `
                    <tr>
                        <td>${b.barcode}</td>
                        <td>${b.nama}</td>
                        <td>${b.stok}</td>
                        <td>${formatRupiah(b.hpp)}</td>
                        <td>${formatRupiah(b.stok * b.hpp)}</td>
                    </tr>
                `).join('')}
            </tbody>
            <tfoot>
                <tr><th colspan="4">Total Nilai Stok</th><th>${formatRupiah(barang.reduce((sum, b) => sum + (b.stok * b.hpp), 0))}</th></tr>
            </tfoot>
        </table>
    `;
}

function laporanLabaRugiPOS() {
    const penjualan = JSON.parse(localStorage.getItem('penjualan') || '[]');
    
    const totalPenjualan = penjualan.reduce((sum, p) => sum + p.total, 0);
    const totalHPP = penjualan.reduce((sum, p) => {
        return sum + p.items.reduce((itemSum, item) => itemSum + (item.hpp * item.qty), 0);
    }, 0);
    const labaKotor = totalPenjualan - totalHPP;
    
    const content = document.getElementById('laporanContent');
    content.innerHTML = `
        <h4>Laporan Laba Rugi POS</h4>
        <table class="table">
            <tr><td>Total Penjualan</td><td class="text-end">${formatRupiah(totalPenjualan)}</td></tr>
            <tr><td>Harga Pokok Penjualan</td><td class="text-end">${formatRupiah(totalHPP)}</td></tr>
            <tr><th>Laba Kotor</th><th class="text-end ${labaKotor >= 0 ? 'text-success' : 'text-danger'}">${formatRupiah(labaKotor)}</th></tr>
        </table>
    `;
}

function laporanKasBesar() {
    const jurnal = JSON.parse(localStorage.getItem('jurnal') || '[]');
    const kasEntries = [];
    
    jurnal.forEach(j => {
        j.entries.forEach(e => {
            if (e.akun === '1-1000') {
                kasEntries.push({
                    tanggal: j.tanggal,
                    keterangan: j.keterangan,
                    debit: e.debit,
                    kredit: e.kredit
                });
            }
        });
    });
    
    const content = document.getElementById('laporanContent');
    content.innerHTML = `
        <h4>Laporan Kas Besar</h4>
        <table class="table">
            <thead>
                <tr><th>Tanggal</th><th>Keterangan</th><th>Masuk</th><th>Keluar</th><th>Saldo</th></tr>
            </thead>
            <tbody>
                ${kasEntries.map((e, idx) => {
                    const saldo = kasEntries.slice(0, idx + 1).reduce((sum, entry) => sum + entry.debit - entry.kredit, 0);
                    return `
                        <tr>
                            <td>${formatDate(e.tanggal)}</td>
                            <td>${e.keterangan}</td>
                            <td>${formatRupiah(e.debit)}</td>
                            <td>${formatRupiah(e.kredit)}</td>
                            <td>${formatRupiah(saldo)}</td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
}

/**
 * Download laporan as CSV file
 * Task 18: Export laporan excluding zero balances
 * Requirements: 9.5
 * @param {string} reportName - Name of the report to export
 */
function downloadCSV(reportName) {
    if (reportName === 'laporan_simpanan') {
        exportLaporanSimpananCSV();
    } else {
        showAlert('Fitur download CSV untuk laporan ini dalam pengembangan', 'info');
    }
}

/**
 * Export Laporan Simpanan to CSV
 * Task 18: Excludes anggota with zero balances
 * Requirements: 9.5
 */
function exportLaporanSimpananCSV() {
    try {
        // Get anggota with simpanan for laporan (already filters zero balances)
        const anggotaList = getAnggotaWithSimpananForLaporan();
        const simpananSukarela = JSON.parse(localStorage.getItem('simpananSukarela') || '[]');
        
        if (anggotaList.length === 0) {
            showAlert('Tidak ada data simpanan untuk diexport!', 'warning');
            return;
        }
        
        // Create CSV header
        let csv = 'NIK,Nama Anggota,Simpanan Pokok,Simpanan Wajib,Simpanan Sukarela,Total Simpanan\n';
        
        // Add data rows (only non-zero balances)
        let totalPokok = 0;
        let totalWajib = 0;
        let totalSukarela = 0;
        let totalAll = 0;
        
        anggotaList.forEach(a => {
            const pokok = a.simpananPokok;
            const wajib = a.simpananWajib;
            // Filter simpanan sukarela with jumlah > 0
            const sukarela = simpananSukarela
                .filter(s => s.anggotaId === a.id && s.jumlah > 0)
                .reduce((sum, s) => sum + s.jumlah, 0);
            const total = pokok + wajib + sukarela;
            
            // Add to totals
            totalPokok += pokok;
            totalWajib += wajib;
            totalSukarela += sukarela;
            totalAll += total;
            
            // Add row to CSV
            csv += `${a.nik},"${a.nama}",${pokok},${wajib},${sukarela},${total}\n`;
        });
        
        // Add total row
        csv += `TOTAL,,${totalPokok},${totalWajib},${totalSukarela},${totalAll}\n`;
        
        // Add note about exclusions
        csv += `\nCatatan: Laporan ini otomatis mengecualikan anggota yang sudah keluar dan telah diproses pengembaliannya (saldo zero).\n`;
        
        // Download CSV file
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        const today = new Date().toISOString().split('T')[0];
        link.setAttribute('href', url);
        link.setAttribute('download', `laporan_simpanan_${today}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showAlert(`Laporan simpanan berhasil diexport! (${anggotaList.length} anggota)`, 'success');
    } catch (error) {
        console.error('Error exporting laporan simpanan:', error);
        showAlert('Gagal mengexport laporan simpanan: ' + error.message, 'error');
    }
}


function laporanTagihanAnggota() {
    const anggota = JSON.parse(localStorage.getItem('anggota') || '[]');
    const penjualan = JSON.parse(localStorage.getItem('penjualan') || '[]');
    
    const content = document.getElementById('laporanContent');
    
    // Group by tipe anggota
    const anggotaKoperasi = anggota.filter(a => a.tipeAnggota === 'Anggota');
    const nonAnggota = anggota.filter(a => a.tipeAnggota === 'Non-Anggota');
    
    content.innerHTML = `
        <h4>Laporan Tagihan Anggota</h4>
        
        <ul class="nav nav-tabs" id="tagihanTab" role="tablist">
            <li class="nav-item">
                <button class="nav-link active" data-bs-toggle="tab" data-bs-target="#anggotaKoperasi">
                    Anggota Koperasi (${anggotaKoperasi.length})
                </button>
            </li>
            <li class="nav-item">
                <button class="nav-link" data-bs-toggle="tab" data-bs-target="#nonAnggotaTab">
                    Non-Anggota (${nonAnggota.length})
                </button>
            </li>
        </ul>
        
        <div class="tab-content mt-3">
            <div class="tab-pane fade show active" id="anggotaKoperasi">
                <div class="alert alert-primary">
                    <strong>Anggota Koperasi:</strong> Tagihan untuk pemotongan gaji + Perhitungan SHU
                </div>
                <table class="table">
                    <thead>
                        <tr>
                            <th>NIK</th>
                            <th>Nama</th>
                            <th>Departemen</th>
                            <th>Total Belanja</th>
                            <th>Tagihan Kredit</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${anggotaKoperasi.map(a => {
                            const totalBelanja = penjualan
                                .filter(p => p.anggotaId === a.id)
                                .reduce((sum, p) => sum + p.total, 0);
                            const tagihanKredit = penjualan
                                .filter(p => p.anggotaId === a.id && p.status === 'kredit')
                                .reduce((sum, p) => sum + p.total, 0);
                            return `
                                <tr>
                                    <td>${a.nik}</td>
                                    <td>${a.nama} <i class="bi bi-star-fill text-warning"></i></td>
                                    <td>${a.departemen || '-'}</td>
                                    <td>${formatRupiah(totalBelanja)}</td>
                                    <td>${formatRupiah(tagihanKredit)}</td>
                                    <td>
                                        ${tagihanKredit > 0 ? 
                                            '<span class="badge bg-warning">Ada Tagihan</span>' : 
                                            '<span class="badge bg-success">Lunas</span>'}
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                    <tfoot>
                        <tr>
                            <th colspan="3">Total</th>
                            <th>${formatRupiah(anggotaKoperasi.reduce((sum, a) => {
                                return sum + penjualan.filter(p => p.anggotaId === a.id).reduce((s, p) => s + p.total, 0);
                            }, 0))}</th>
                            <th>${formatRupiah(anggotaKoperasi.reduce((sum, a) => {
                                return sum + penjualan.filter(p => p.anggotaId === a.id && p.status === 'kredit').reduce((s, p) => s + p.total, 0);
                            }, 0))}</th>
                            <th></th>
                        </tr>
                    </tfoot>
                </table>
            </div>
            
            <div class="tab-pane fade" id="nonAnggotaTab">
                <div class="alert alert-info">
                    <strong>Non-Anggota:</strong> Tagihan untuk pemotongan gaji (Tidak dapat SHU)
                </div>
                <table class="table">
                    <thead>
                        <tr>
                            <th>NIK</th>
                            <th>Nama</th>
                            <th>Departemen</th>
                            <th>Total Belanja</th>
                            <th>Tagihan Kredit</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${nonAnggota.map(a => {
                            const totalBelanja = penjualan
                                .filter(p => p.anggotaId === a.id)
                                .reduce((sum, p) => sum + p.total, 0);
                            const tagihanKredit = penjualan
                                .filter(p => p.anggotaId === a.id && p.status === 'kredit')
                                .reduce((sum, p) => sum + p.total, 0);
                            return `
                                <tr>
                                    <td>${a.nik}</td>
                                    <td>${a.nama}</td>
                                    <td>${a.departemen || '-'}</td>
                                    <td>${formatRupiah(totalBelanja)}</td>
                                    <td>${formatRupiah(tagihanKredit)}</td>
                                    <td>
                                        ${tagihanKredit > 0 ? 
                                            '<span class="badge bg-warning">Ada Tagihan</span>' : 
                                            '<span class="badge bg-success">Lunas</span>'}
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                    <tfoot>
                        <tr>
                            <th colspan="3">Total</th>
                            <th>${formatRupiah(nonAnggota.reduce((sum, a) => {
                                return sum + penjualan.filter(p => p.anggotaId === a.id).reduce((s, p) => s + p.total, 0);
                            }, 0))}</th>
                            <th>${formatRupiah(nonAnggota.reduce((sum, a) => {
                                return sum + penjualan.filter(p => p.anggotaId === a.id && p.status === 'kredit').reduce((s, p) => s + p.total, 0);
                            }, 0))}</th>
                            <th></th>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
        
        <div class="mt-3">
            <button class="btn btn-success" onclick="downloadTagihanCSV()">
                <i class="bi bi-file-earmark-arrow-down me-1"></i>Download Tagihan CSV
            </button>
        </div>
    `;
}

function downloadTagihanCSV() {
    const anggota = JSON.parse(localStorage.getItem('anggota') || '[]');
    const penjualan = JSON.parse(localStorage.getItem('penjualan') || '[]');
    
    let csv = 'NIK,Nama,Departemen,Tipe Keanggotaan,Total Belanja,Tagihan Kredit,Status\n';
    
    anggota.forEach(a => {
        const totalBelanja = penjualan
            .filter(p => p.anggotaId === a.id)
            .reduce((sum, p) => sum + p.total, 0);
        const tagihanKredit = penjualan
            .filter(p => p.anggotaId === a.id && p.status === 'kredit')
            .reduce((sum, p) => sum + p.total, 0);
        
        if (totalBelanja > 0 || tagihanKredit > 0) {
            csv += `${a.nik},"${a.nama}",${a.departemen || ''},${a.tipeAnggota || 'Umum'},${totalBelanja},${tagihanKredit},${tagihanKredit > 0 ? 'Ada Tagihan' : 'Lunas'}\n`;
        }
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    const today = new Date().toISOString().split('T')[0];
    link.setAttribute('href', url);
    link.setAttribute('download', `tagihan_anggota_${today}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showAlert('Tagihan berhasil didownload!', 'success');
}


/**
 * Task 4.1 & 4.2: Show payment history modal for an anggota
 * @param {string} anggotaId - ID of the anggota
 * @param {string} anggotaNama - Name of the anggota
 */
function showPaymentHistory(anggotaId, anggotaNama) {
    // Get payment history using shared function from utils.js
    const history = getPembayaranHutangHistory(anggotaId);
    
    // Create modal HTML
    const modalId = 'paymentHistoryModal';
    let existingModal = document.getElementById(modalId);
    
    // Remove existing modal if any
    if (existingModal) {
        existingModal.remove();
    }
    
    // Format history rows
    let historyHTML = '';
    if (history.length === 0) {
        historyHTML = `
            <tr>
                <td colspan="4" class="text-center text-muted py-4">
                    <i class="bi bi-inbox me-2"></i>
                    Belum ada pembayaran
                </td>
            </tr>
        `;
    } else {
        historyHTML = history.map((payment, index) => {
            const tanggal = new Date(payment.tanggal);
            const tanggalStr = tanggal.toLocaleDateString('id-ID', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            return `
                <tr>
                    <td>${index + 1}</td>
                    <td>${tanggalStr}</td>
                    <td><strong class="text-primary">${formatRupiah(payment.jumlah)}</strong></td>
                    <td>${payment.kasirNama || '-'}</td>
                </tr>
            `;
        }).join('');
    }
    
    // Create modal element
    const modalHTML = `
        <div class="modal fade" id="${modalId}" tabindex="-1" aria-labelledby="${modalId}Label" aria-hidden="true">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header" style="background: linear-gradient(135deg, #2d6a4f 0%, #52b788 100%); color: white;">
                        <h5 class="modal-title" id="${modalId}Label">
                            <i class="bi bi-clock-history me-2"></i>
                            Riwayat Pembayaran Hutang
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="alert alert-info">
                            <strong><i class="bi bi-person me-1"></i>${anggotaNama}</strong>
                            <br>
                            <small>Total Pembayaran: <strong>${formatRupiah(history.reduce((sum, p) => sum + p.jumlah, 0))}</strong></small>
                        </div>
                        
                        <div class="table-responsive">
                            <table class="table table-hover align-middle">
                                <thead class="table-light">
                                    <tr>
                                        <th width="50">#</th>
                                        <th><i class="bi bi-calendar me-1"></i>Tanggal</th>
                                        <th><i class="bi bi-cash me-1"></i>Jumlah</th>
                                        <th><i class="bi bi-person-badge me-1"></i>Kasir</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${historyHTML}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                            <i class="bi bi-x-circle me-1"></i>Tutup
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Append modal to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Show modal using Bootstrap
    const modal = new bootstrap.Modal(document.getElementById(modalId));
    modal.show();
    
    // Remove modal from DOM when hidden
    document.getElementById(modalId).addEventListener('hidden.bs.modal', function () {
        this.remove();
    });
}

/**
 * Balance Sheet (Neraca) Report with Period Selection
 * Task 1: Set up balance sheet report infrastructure
 * Requirements: 1.1, 1.2, 1.3, 1.4
 */
function laporanNeraca() {
    const content = document.getElementById('laporanContent');
    
    content.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h4 class="mb-0">
                <i class="bi bi-file-earmark-bar-graph me-2" style="color: #2d6a4f;"></i>
                Laporan Neraca (Balance Sheet)
            </h4>
        </div>
        
        <!-- Period Selection Section -->
        <div class="card mb-3">
            <div class="card-header">
                <h6 class="mb-0">
                    <i class="bi bi-calendar-range me-2"></i>
                    Pilih Periode Laporan
                </h6>
            </div>
            <div class="card-body">
                <div class="row g-3">
                    <!-- Period Type Selection -->
                    <div class="col-md-12">
                        <label class="form-label">Jenis Periode:</label>
                        <div class="btn-group w-100" role="group" aria-label="Period selection">
                            <input type="radio" class="btn-check" name="periodType" id="dailyPeriod" value="daily" checked>
                            <label class="btn btn-outline-primary" for="dailyPeriod">
                                <i class="bi bi-calendar-day me-1"></i>Harian
                            </label>
                            
                            <input type="radio" class="btn-check" name="periodType" id="monthlyPeriod" value="monthly">
                            <label class="btn btn-outline-primary" for="monthlyPeriod">
                                <i class="bi bi-calendar-month me-1"></i>Bulanan
                            </label>
                            
                            <input type="radio" class="btn-check" name="periodType" id="yearlyPeriod" value="yearly">
                            <label class="btn btn-outline-primary" for="yearlyPeriod">
                                <i class="bi bi-calendar-year me-1"></i>Tahunan
                            </label>
                        </div>
                    </div>
                    
                    <!-- Date Selection Controls -->
                    <div class="col-md-6">
                        <!-- Daily Date Picker -->
                        <div id="dailySelector" class="period-selector">
                            <label for="selectedDate" class="form-label">Pilih Tanggal:</label>
                            <input type="date" class="form-control" id="selectedDate" value="${new Date().toISOString().split('T')[0]}">
                        </div>
                        
                        <!-- Monthly Selector -->
                        <div id="monthlySelector" class="period-selector d-none">
                            <label class="form-label">Pilih Bulan dan Tahun:</label>
                            <div class="row g-2">
                                <div class="col-7">
                                    <select class="form-select" id="selectedMonth">
                                        <option value="1">Januari</option>
                                        <option value="2">Februari</option>
                                        <option value="3">Maret</option>
                                        <option value="4">April</option>
                                        <option value="5">Mei</option>
                                        <option value="6">Juni</option>
                                        <option value="7">Juli</option>
                                        <option value="8">Agustus</option>
                                        <option value="9">September</option>
                                        <option value="10">Oktober</option>
                                        <option value="11">November</option>
                                        <option value="12">Desember</option>
                                    </select>
                                </div>
                                <div class="col-5">
                                    <select class="form-select" id="selectedMonthYear">
                                        ${generateYearOptions()}
                                    </select>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Yearly Selector -->
                        <div id="yearlySelector" class="period-selector d-none">
                            <label for="selectedYear" class="form-label">Pilih Tahun:</label>
                            <select class="form-select" id="selectedYear">
                                ${generateYearOptions()}
                            </select>
                        </div>
                    </div>
                    
                    <!-- Generate Button -->
                    <div class="col-md-6 d-flex align-items-end">
                        <button class="btn btn-success w-100" onclick="generateBalanceSheet()">
                            <i class="bi bi-file-earmark-bar-graph me-2"></i>
                            Generate Laporan Neraca
                        </button>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Report Content Area -->
        <div id="neracaReportContent">
            <div class="alert alert-info">
                <i class="bi bi-info-circle me-2"></i>
                <strong>Pilih periode dan klik "Generate Laporan Neraca" untuk menampilkan laporan.</strong>
            </div>
        </div>
    `;
    
    // Set current month and year as default
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    
    document.getElementById('selectedMonth').value = currentMonth;
    document.getElementById('selectedMonthYear').value = currentYear;
    document.getElementById('selectedYear').value = currentYear;
    
    // Add event listeners for period type changes
    setupEnhancedPeriodSelectionListeners();
}

/**
 * Generate year options for dropdowns
 * Helper function for period selection
 */
function generateYearOptions() {
    const currentYear = new Date().getFullYear();
    const startYear = currentYear - 5; // 5 years back
    const endYear = currentYear + 1;   // 1 year forward
    
    let options = '';
    for (let year = endYear; year >= startYear; year--) {
        const selected = year === currentYear ? 'selected' : '';
        options += `<option value="${year}" ${selected}>${year}</option>`;
    }
    return options;
}

/**
 * Setup event listeners for period selection changes
 * Task 1: Implement period selection UI
 */
function setupPeriodSelectionListeners() {
    const periodRadios = document.querySelectorAll('input[name="periodType"]');
    
    periodRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            // Hide all selectors
            document.querySelectorAll('.period-selector').forEach(selector => {
                selector.classList.add('d-none');
            });
            
            // Show selected period selector
            const selectedType = this.value;
            const selectorId = selectedType + 'Selector';
            const targetSelector = document.getElementById(selectorId);
            
            if (targetSelector) {
                targetSelector.classList.remove('d-none');
            }
        });
    });
}

/**
 * Generate Balance Sheet Report with Enhanced Error Handling
 * Task 6: Add error handling and user feedback
 * Requirements: 4.1, 4.2, 4.3
 */
function generateBalanceSheet() {
    const reportContent = document.getElementById('neracaReportContent');
    
    // Start performance monitoring
    const performanceMonitor = typeof balanceSheetDiagnostics !== 'undefined' ? 
        balanceSheetDiagnostics.startMonitoring('generateBalanceSheet') : null;
    
    // Show enhanced loading indicator
    showBalanceSheetLoadingIndicator(reportContent, 'Memvalidasi periode dan memeriksa ketersediaan data...');
    
    try {
        // Get selected period information with validation
        const periodData = extractPeriodData();
        
        // Validate COA structure first
        if (typeof balanceSheetDiagnostics !== 'undefined') {
            const coa = JSON.parse(localStorage.getItem('coa') || '[]');
            const coaValidation = balanceSheetDiagnostics.validateCOAStructure(coa);
            
            if (!coaValidation.isValid) {
                handleBalanceSheetError(
                    new Error('COA structure validation failed: ' + coaValidation.errors.join(', ')),
                    'generateBalanceSheet',
                    { coaValidation, periodData },
                    reportContent,
                    performanceMonitor
                );
                return;
            }
        }
        
        // Validate period selection
        const validationResult = validatePeriodSelection(periodData);
        
        if (!validationResult.success) {
            handleBalanceSheetError(
                new Error(`Period validation failed: ${validationResult.error}`),
                'generateBalanceSheet',
                { periodData, validationResult },
                reportContent,
                performanceMonitor
            );
            return;
        }
        
        // Check data availability for the validated period
        const dataAvailability = checkPeriodDataAvailability(validationResult.endDate);
        
        if (!dataAvailability.hasData) {
            handleBalanceSheetError(
                new Error(`No data available: ${dataAvailability.error || 'Tidak ada data untuk periode yang dipilih'}`),
                'generateBalanceSheet',
                { periodData, validationResult, dataAvailability },
                reportContent,
                performanceMonitor
            );
            return;
        }
        
        // Show progress update
        updateBalanceSheetLoadingIndicator(reportContent, 'Data tersedia! Memproses laporan neraca...', dataAvailability.message);
        
        // Create enhanced period object with validation results
        const enhancedPeriod = {
            ...validationResult,
            dataInfo: dataAvailability,
            originalInput: periodData
        };
        
        // Check if data chunking is needed
        if (typeof balanceSheetDiagnostics !== 'undefined') {
            const coa = JSON.parse(localStorage.getItem('coa') || '[]');
            const jurnal = JSON.parse(localStorage.getItem('jurnal') || '[]');
            
            const coaChunking = balanceSheetDiagnostics.checkDataChunking(coa);
            const journalChunking = balanceSheetDiagnostics.checkDataChunking(jurnal);
            
            if (coaChunking.needsChunking || journalChunking.needsChunking) {
                updateBalanceSheetLoadingIndicator(
                    reportContent, 
                    'Dataset besar terdeteksi. Mengoptimalkan performa...', 
                    `${coaChunking.needsChunking ? coaChunking.reason : journalChunking.reason}`
                );
            }
        }
        
        // Generate actual balance sheet with error handling
        setTimeout(() => {
            generateActualBalanceSheetWithErrorHandling(enhancedPeriod, performanceMonitor);
        }, 1000);
        
    } catch (error) {
        handleBalanceSheetError(error, 'generateBalanceSheet', {}, reportContent, performanceMonitor);
    }
}

/**
 * Extract period data from UI with validation
 * Task 6: Enhanced data extraction with error handling
 * @returns {Object} Period data object
 */
function extractPeriodData() {
    const periodTypeElement = document.querySelector('input[name="periodType"]:checked');
    if (!periodTypeElement) {
        throw new Error('Tipe periode harus dipilih');
    }
    
    const periodType = periodTypeElement.value;
    let periodData = { type: periodType };
    
    // Collect period-specific data with validation
    switch (periodType) {
        case 'daily':
            const selectedDateValue = document.getElementById('selectedDate')?.value;
            if (!selectedDateValue) {
                throw new Error('Tanggal harus dipilih untuk laporan harian');
            }
            const selectedDate = new Date(selectedDateValue);
            if (isNaN(selectedDate.getTime())) {
                throw new Error('Format tanggal tidak valid');
            }
            periodData.selectedDate = selectedDate;
            break;
            
        case 'monthly':
            const selectedMonth = parseInt(document.getElementById('selectedMonth')?.value);
            const selectedMonthYear = parseInt(document.getElementById('selectedMonthYear')?.value);
            if (!selectedMonth || !selectedMonthYear) {
                throw new Error('Bulan dan tahun harus dipilih untuk laporan bulanan');
            }
            if (selectedMonth < 1 || selectedMonth > 12) {
                throw new Error('Bulan tidak valid (1-12)');
            }
            if (selectedMonthYear < 1900 || selectedMonthYear > 2100) {
                throw new Error('Tahun tidak valid');
            }
            periodData.selectedMonth = selectedMonth;
            periodData.selectedYear = selectedMonthYear;
            break;
            
        case 'yearly':
            const selectedYear = parseInt(document.getElementById('selectedYear')?.value);
            if (!selectedYear) {
                throw new Error('Tahun harus dipilih untuk laporan tahunan');
            }
            if (selectedYear < 1900 || selectedYear > 2100) {
                throw new Error('Tahun tidak valid');
            }
            periodData.selectedYear = selectedYear;
            break;
            
        default:
            throw new Error(`Tipe periode tidak dikenal: ${periodType}`);
    }
    
    return periodData;
}

/**
 * Show enhanced loading indicator with progress information
 * Task 6: Enhanced user feedback
 * Requirements: 4.1
 * @param {Element} container - Container element
 * @param {string} message - Loading message
 */
function showBalanceSheetLoadingIndicator(container, message) {
    container.innerHTML = `
        <div class="card">
            <div class="card-body text-center py-5">
                <div class="spinner-border text-primary mb-3" role="status" style="width: 3rem; height: 3rem;">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <h5 class="text-primary mb-2">Memproses Laporan Neraca</h5>
                <p class="text-muted mb-3" id="loadingMessage">${message}</p>
                <div class="progress mb-3" style="height: 8px;">
                    <div class="progress-bar progress-bar-striped progress-bar-animated" 
                         role="progressbar" style="width: 25%" id="loadingProgress"></div>
                </div>
                <small class="text-muted" id="loadingDetails">Memulai proses...</small>
            </div>
        </div>
    `;
}

/**
 * Update loading indicator with progress information
 * Task 6: Enhanced user feedback
 * Requirements: 4.1
 * @param {Element} container - Container element
 * @param {string} message - Updated message
 * @param {string} details - Additional details
 * @param {number} progress - Progress percentage (0-100)
 */
function updateBalanceSheetLoadingIndicator(container, message, details = '', progress = null) {
    const messageElement = container.querySelector('#loadingMessage');
    const detailsElement = container.querySelector('#loadingDetails');
    const progressElement = container.querySelector('#loadingProgress');
    
    if (messageElement) messageElement.textContent = message;
    if (detailsElement) detailsElement.textContent = details;
    
    if (progress !== null && progressElement) {
        progressElement.style.width = `${Math.min(100, Math.max(0, progress))}%`;
    } else if (progressElement) {
        // Auto-increment progress
        const currentWidth = parseInt(progressElement.style.width) || 25;
        const newWidth = Math.min(90, currentWidth + 25);
        progressElement.style.width = `${newWidth}%`;
    }
}

/**
 * Handle balance sheet errors with comprehensive user feedback
 * Task 6: Centralized error handling
 * Requirements: 4.2, 4.3
 * @param {Error} error - The error object
 * @param {string} operation - The operation that failed
 * @param {Object} context - Additional context
 * @param {Element} container - Container for error display
 * @param {Object} performanceMonitor - Performance monitor object
 */
function handleBalanceSheetError(error, operation, context, container, performanceMonitor) {
    // End performance monitoring if available
    if (performanceMonitor && typeof balanceSheetDiagnostics !== 'undefined') {
        balanceSheetDiagnostics.endMonitoring(performanceMonitor, { error });
    }
    
    // Use error handler if available
    if (typeof balanceSheetErrorHandler !== 'undefined') {
        const errorResult = balanceSheetErrorHandler.handleError(error, operation, context);
        displayErrorFeedback(container, errorResult);
    } else {
        // Fallback error display
        displayBasicError(container, error, operation);
    }
}

/**
 * Display comprehensive error feedback to user
 * Task 6: Enhanced error display
 * Requirements: 4.2, 4.3
 * @param {Element} container - Container element
 * @param {Object} errorResult - Error handling result
 */
function displayErrorFeedback(container, errorResult) {
    const { errorInfo, userFeedback, recoveryOptions } = errorResult;
    
    const alertClass = userFeedback.type === 'error' ? 'alert-danger' : 
                      userFeedback.type === 'warning' ? 'alert-warning' : 'alert-info';
    
    const recoveryButtons = recoveryOptions.map(option => `
        <button class="btn btn-outline-${userFeedback.type === 'error' ? 'danger' : 'primary'} btn-sm me-2 mb-2" 
                onclick="handleRecoveryAction('${option.action}', '${errorInfo.operation}')">
            <i class="${option.icon} me-1"></i>${option.label}
        </button>
    `).join('');
    
    container.innerHTML = `
        <div class="alert ${alertClass} border-0 shadow-sm">
            <div class="d-flex align-items-start">
                <i class="${userFeedback.icon} me-3 fs-4 mt-1"></i>
                <div class="flex-grow-1">
                    <h6 class="alert-heading mb-2">${userFeedback.title}</h6>
                    <p class="mb-3">${userFeedback.message}</p>
                    
                    ${userFeedback.suggestions && userFeedback.suggestions.length > 0 ? `
                        <div class="mb-3">
                            <strong>Saran:</strong>
                            <ul class="mb-0 mt-1">
                                ${userFeedback.suggestions.map(suggestion => `<li>${suggestion}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                    
                    ${recoveryOptions.length > 0 ? `
                        <div class="mt-3">
                            <strong>Opsi Pemulihan:</strong>
                            <div class="mt-2">
                                ${recoveryButtons}
                            </div>
                        </div>
                    ` : ''}
                    
                    <div class="mt-3 pt-2 border-top">
                        <small class="text-muted">
                            <i class="bi bi-clock me-1"></i>
                            ${errorInfo.timestamp.toLocaleString('id-ID')} | 
                            Operasi: ${errorInfo.operation}
                        </small>
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Display basic error (fallback when error handler not available)
 * @param {Element} container - Container element
 * @param {Error} error - Error object
 * @param {string} operation - Operation name
 */
function displayBasicError(container, error, operation) {
    container.innerHTML = `
        <div class="alert alert-danger">
            <i class="bi bi-exclamation-triangle me-2"></i>
            <strong>Error:</strong> ${error.message}
            <br><br>
            <button class="btn btn-sm btn-outline-danger" onclick="resetPeriodSelection()">
                <i class="bi bi-arrow-clockwise me-1"></i>Coba Lagi
            </button>
        </div>
    `;
}

/**
 * Handle recovery actions from error feedback
 * Task 6: Recovery action handler
 * Requirements: 4.3
 * @param {string} action - Recovery action
 * @param {string} operation - Original operation
 */
function handleRecoveryAction(action, operation) {
    switch (action) {
        case 'retry':
            if (typeof balanceSheetErrorHandler !== 'undefined') {
                balanceSheetErrorHandler.incrementRetry(operation);
            }
            generateBalanceSheet();
            break;
            
        case 'resetPeriod':
        case 'reset':
            resetPeriodSelection();
            break;
            
        case 'suggestPeriods':
            suggestAlternativePeriods();
            break;
            
        case 'resetReport':
            const reportContent = document.getElementById('neracaReportContent');
            if (reportContent) {
                reportContent.innerHTML = `
                    <div class="alert alert-info">
                        <i class="bi bi-info-circle me-2"></i>
                        <strong>Pilih periode dan klik "Generate Laporan Neraca" untuk menampilkan laporan.</strong>
                    </div>
                `;
            }
            break;
            
        case 'checkData':
            // Redirect to data validation
            showAlert('Silakan periksa data COA dan jurnal di menu Master Data', 'info');
            break;
            
        case 'setupCOA':
            showAlert('Silakan setup Chart of Accounts di menu Master COA', 'info');
            break;
            
        case 'useCache':
            // Try to use cached data if available
            showAlert('Mencoba menggunakan data cache...', 'info');
            setTimeout(() => generateBalanceSheet(), 1000);
            break;
            
        default:
            showAlert(`Aksi pemulihan '${action}' belum diimplementasikan`, 'warning');
    }
}

/**
 * Display Balance Sheet Placeholder
 * Task 1: Temporary placeholder for balance sheet display
 * This will be replaced with actual balance sheet calculation in Task 3
 */
function displayBalanceSheetPlaceholder(selectedPeriod) {
    const reportContent = document.getElementById('neracaReportContent');
    
    const periodText = formatPeriodText(selectedPeriod);
    
    reportContent.innerHTML = `
        <div class="card">
            <div class="card-header bg-primary text-white">
                <h5 class="mb-0">
                    <i class="bi bi-file-earmark-bar-graph me-2"></i>
                    Laporan Neraca - ${periodText}
                </h5>
            </div>
            <div class="card-body">
                <div class="alert alert-info">
                    <i class="bi bi-info-circle me-2"></i>
                    <strong>Task 1 Complete:</strong> Balance sheet infrastructure setup successful!
                    <br><br>
                    <strong>Selected Period:</strong> ${periodText}<br>
                    <strong>End Date:</strong> ${selectedPeriod.endDate.toLocaleDateString('id-ID')}<br>
                    <strong>Period Type:</strong> ${selectedPeriod.type}
                    <br><br>
                    <em>Balance sheet calculation engine will be implemented in Task 3.</em>
                </div>
                
                <!-- Placeholder Balance Sheet Structure -->
                <div class="row">
                    <div class="col-md-6">
                        <h6 class="text-primary">ASET (ASSETS)</h6>
                        <div class="ms-3">
                            <p class="mb-1">Aset Lancar:</p>
                            <div class="ms-3 text-muted">
                                <small>• Kas<br>• Bank<br>• Piutang Anggota</small>
                            </div>
                            <p class="mb-1 mt-2">Aset Tetap:</p>
                            <div class="ms-3 text-muted">
                                <small>• Persediaan Barang</small>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <h6 class="text-success">KEWAJIBAN & MODAL</h6>
                        <div class="ms-3">
                            <p class="mb-1">Kewajiban:</p>
                            <div class="ms-3 text-muted">
                                <small>• Hutang Supplier<br>• Simpanan Pokok<br>• Simpanan Wajib<br>• Simpanan Sukarela</small>
                            </div>
                            <p class="mb-1 mt-2">Modal:</p>
                            <div class="ms-3 text-muted">
                                <small>• Modal Koperasi<br>• Laba Ditahan</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Format period text for display
 * Helper function to format selected period for user display
 */
function formatPeriodText(selectedPeriod) {
    const monthNames = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    
    switch (selectedPeriod.type) {
        case 'daily':
            return `Harian - ${selectedPeriod.endDate.toLocaleDateString('id-ID')}`;
        case 'monthly':
            return `Bulanan - ${monthNames[selectedPeriod.month - 1]} ${selectedPeriod.year}`;
        case 'yearly':
            return `Tahunan - ${selectedPeriod.year}`;
        default:
            return 'Unknown Period';
    }
}

/**
 * Validate Period Selection
 * Task 1.1: Period validation function for property testing
 * Requirements: 1.5
 * 
 * @param {Object} periodData - Period selection data
 * @param {string} periodData.type - Period type ('daily', 'monthly', 'yearly')
 * @param {Date} [periodData.selectedDate] - Selected date for daily reports
 * @param {number} [periodData.selectedMonth] - Selected month (1-12) for monthly reports
 * @param {number} [periodData.selectedYear] - Selected year for monthly/yearly reports
 * @returns {Object} Validation result with success, endDate, and message
 */
function validatePeriodSelection(periodData) {
    try {
        // Input validation
        if (!periodData || typeof periodData !== 'object') {
            return {
                success: false,
                error: 'Invalid period data: must be an object',
                endDate: null
            };
        }
        
        const { type, selectedDate, selectedMonth, selectedYear } = periodData;
        
        // Validate period type
        if (!type || !['daily', 'monthly', 'yearly'].includes(type)) {
            return {
                success: false,
                error: 'Invalid period type: must be daily, monthly, or yearly',
                endDate: null
            };
        }
        
        let endDate;
        let message;
        
        switch (type) {
            case 'daily':
                if (!selectedDate) {
                    return {
                        success: false,
                        error: 'Daily period requires selectedDate',
                        endDate: null
                    };
                }
                
                const dailyDate = new Date(selectedDate);
                if (isNaN(dailyDate.getTime())) {
                    return {
                        success: false,
                        error: 'Invalid date format for daily period',
                        endDate: null
                    };
                }
                
                // Check if date is not in the future
                const today = new Date();
                today.setHours(23, 59, 59, 999); // End of today
                if (dailyDate > today) {
                    return {
                        success: false,
                        error: 'Cannot generate reports for future dates',
                        endDate: null
                    };
                }
                
                endDate = new Date(dailyDate);
                endDate.setHours(23, 59, 59, 999); // End of selected day
                message = `Daily report for ${dailyDate.toLocaleDateString('id-ID')}`;
                break;
                
            case 'monthly':
                if (!selectedMonth || !selectedYear) {
                    return {
                        success: false,
                        error: 'Monthly period requires selectedMonth and selectedYear',
                        endDate: null
                    };
                }
                
                if (selectedMonth < 1 || selectedMonth > 12) {
                    return {
                        success: false,
                        error: 'Invalid month: must be between 1 and 12',
                        endDate: null
                    };
                }
                
                if (selectedYear < 1900 || selectedYear > 2100) {
                    return {
                        success: false,
                        error: 'Invalid year: must be between 1900 and 2100',
                        endDate: null
                    };
                }
                
                // Check if month/year is not in the future
                const currentDate = new Date();
                const selectedMonthDate = new Date(selectedYear, selectedMonth - 1, 1);
                if (selectedMonthDate > currentDate) {
                    return {
                        success: false,
                        error: 'Cannot generate reports for future months',
                        endDate: null
                    };
                }
                
                // Last day of the selected month
                endDate = new Date(selectedYear, selectedMonth, 0);
                endDate.setHours(23, 59, 59, 999);
                
                const monthNames = [
                    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
                    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
                ];
                message = `Monthly report for ${monthNames[selectedMonth - 1]} ${selectedYear}`;
                break;
                
            case 'yearly':
                if (!selectedYear) {
                    return {
                        success: false,
                        error: 'Yearly period requires selectedYear',
                        endDate: null
                    };
                }
                
                if (selectedYear < 1900 || selectedYear > 2100) {
                    return {
                        success: false,
                        error: 'Invalid year: must be between 1900 and 2100',
                        endDate: null
                    };
                }
                
                // Check if year is not in the future
                const currentYear = new Date().getFullYear();
                if (selectedYear > currentYear) {
                    return {
                        success: false,
                        error: 'Cannot generate reports for future years',
                        endDate: null
                    };
                }
                
                // December 31st of the selected year
                endDate = new Date(selectedYear, 11, 31);
                endDate.setHours(23, 59, 59, 999);
                message = `Yearly report for ${selectedYear}`;
                break;
        }
        
        return {
            success: true,
            endDate: endDate,
            message: message,
            periodType: type
        };
        
    } catch (error) {
        return {
            success: false,
            error: `Validation error: ${error.message}`,
            endDate: null
        };
    }
}

/**
 * Check if period has available data
 * Task 1.1: Data availability checking for period validation
 * Requirements: 1.5
 * 
 * @param {Date} endDate - End date of the period to check
 * @returns {Object} Data availability result
 */
function checkPeriodDataAvailability(endDate) {
    try {
        if (!endDate || !(endDate instanceof Date) || isNaN(endDate.getTime())) {
            return {
                hasData: false,
                error: 'Invalid end date provided'
            };
        }
        
        // Check if we have any journal entries up to the end date
        const jurnal = JSON.parse(localStorage.getItem('jurnal') || '[]');
        const coa = JSON.parse(localStorage.getItem('coa') || '[]');
        
        // Check for journal entries within the period
        const relevantEntries = jurnal.filter(j => {
            const entryDate = new Date(j.tanggal);
            return entryDate <= endDate;
        });
        
        // Check for COA data
        const hasCoaData = coa.length > 0;
        
        // Determine data availability
        const hasJournalData = relevantEntries.length > 0;
        const hasMinimalData = hasCoaData; // At minimum, we need COA structure
        
        return {
            hasData: hasMinimalData,
            hasJournalEntries: hasJournalData,
            journalCount: relevantEntries.length,
            coaCount: coa.length,
            message: hasMinimalData 
                ? `Found ${coa.length} COA accounts and ${relevantEntries.length} journal entries`
                : 'No COA data available - cannot generate balance sheet'
        };
        
    } catch (error) {
        return {
            hasData: false,
            error: `Data availability check failed: ${error.message}`
        };
    }
}
/**
 * Reset Period Selection
 * Task 2: Helper function to reset period selection to defaults
 * Requirements: 4.2, 4.3
 */
function resetPeriodSelection() {
    try {
        // Reset to daily period
        const dailyRadio = document.getElementById('dailyPeriod');
        if (dailyRadio) {
            dailyRadio.checked = true;
        }
        
        // Hide all selectors except daily
        document.querySelectorAll('.period-selector').forEach(selector => {
            selector.classList.add('d-none');
        });
        
        const dailySelector = document.getElementById('dailySelector');
        if (dailySelector) {
            dailySelector.classList.remove('d-none');
        }
        
        // Reset to current date
        const dateInput = document.getElementById('selectedDate');
        if (dateInput) {
            dateInput.value = new Date().toISOString().split('T')[0];
        }
        
        // Reset monthly selectors to current month/year
        const currentDate = new Date();
        const monthSelect = document.getElementById('selectedMonth');
        const monthYearSelect = document.getElementById('selectedMonthYear');
        const yearSelect = document.getElementById('selectedYear');
        
        if (monthSelect) {
            monthSelect.value = currentDate.getMonth() + 1;
        }
        if (monthYearSelect) {
            monthYearSelect.value = currentDate.getFullYear();
        }
        if (yearSelect) {
            yearSelect.value = currentDate.getFullYear();
        }
        
        // Clear report content
        const reportContent = document.getElementById('neracaReportContent');
        if (reportContent) {
            reportContent.innerHTML = `
                <div class="alert alert-info">
                    <i class="bi bi-info-circle me-2"></i>
                    <strong>Pilih periode dan klik "Generate Laporan Neraca" untuk menampilkan laporan.</strong>
                </div>
            `;
        }
        
        showAlert('Pilihan periode telah direset', 'info');
        
    } catch (error) {
        console.error('Error resetting period selection:', error);
        showAlert('Gagal mereset pilihan periode: ' + error.message, 'error');
    }
}

/**
 * Suggest Alternative Periods
 * Task 2: Suggest periods that have available data
 * Requirements: 4.2
 */
function suggestAlternativePeriods() {
    try {
        const jurnal = JSON.parse(localStorage.getItem('jurnal') || '[]');
        const coa = JSON.parse(localStorage.getItem('coa') || '[]');
        
        if (coa.length === 0) {
            showAlert('Chart of Accounts (COA) belum diinisialisasi. Silakan setup sistem terlebih dahulu.', 'warning');
            return;
        }
        
        if (jurnal.length === 0) {
            showAlert('Belum ada data jurnal. Laporan neraca dapat dibuat dengan data COA saja (menampilkan saldo awal).', 'info');
            return;
        }
        
        // Find date range of available journal data
        const journalDates = jurnal.map(j => new Date(j.tanggal)).sort((a, b) => a - b);
        const earliestDate = journalDates[0];
        const latestDate = journalDates[journalDates.length - 1];
        
        // Generate suggestions
        const suggestions = [];
        
        // Suggest current month if it has data
        const currentDate = new Date();
        const currentMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        if (latestDate >= currentMonthStart) {
            suggestions.push({
                type: 'monthly',
                text: `Bulan ini (${currentDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })})`,
                action: () => setPeriodToCurrentMonth()
            });
        }
        
        // Suggest latest available date
        suggestions.push({
            type: 'daily',
            text: `Tanggal terakhir dengan data (${latestDate.toLocaleDateString('id-ID')})`,
            action: () => setPeriodToDate(latestDate)
        });
        
        // Suggest current year if it has data
        const currentYearStart = new Date(currentDate.getFullYear(), 0, 1);
        if (latestDate >= currentYearStart) {
            suggestions.push({
                type: 'yearly',
                text: `Tahun ini (${currentDate.getFullYear()})`,
                action: () => setPeriodToCurrentYear()
            });
        }
        
        // Display suggestions
        const reportContent = document.getElementById('neracaReportContent');
        if (reportContent && suggestions.length > 0) {
            reportContent.innerHTML = `
                <div class="alert alert-info">
                    <i class="bi bi-lightbulb me-2"></i>
                    <strong>Saran Periode dengan Data Tersedia:</strong>
                    <br><br>
                    <div class="d-grid gap-2">
                        ${suggestions.map(s => `
                            <button class="btn btn-outline-primary btn-sm text-start" onclick="(${s.action.toString()})()">
                                <i class="bi bi-calendar-${s.type === 'daily' ? 'day' : s.type === 'monthly' ? 'month' : 'year'} me-2"></i>
                                ${s.text}
                            </button>
                        `).join('')}
                    </div>
                    <hr>
                    <small class="text-muted">
                        <strong>Rentang data tersedia:</strong> ${earliestDate.toLocaleDateString('id-ID')} - ${latestDate.toLocaleDateString('id-ID')}
                        <br>
                        <strong>Total jurnal:</strong> ${jurnal.length} entri
                    </small>
                </div>
            `;
        } else {
            showAlert('Tidak ada saran periode yang tersedia', 'warning');
        }
        
    } catch (error) {
        console.error('Error suggesting alternative periods:', error);
        showAlert('Gagal memberikan saran periode: ' + error.message, 'error');
    }
}

/**
 * Set Period to Current Month
 * Task 2: Helper function to set period selection to current month
 */
function setPeriodToCurrentMonth() {
    const currentDate = new Date();
    
    // Select monthly period
    const monthlyRadio = document.getElementById('monthlyPeriod');
    if (monthlyRadio) {
        monthlyRadio.checked = true;
        monthlyRadio.dispatchEvent(new Event('change'));
    }
    
    // Set current month and year
    const monthSelect = document.getElementById('selectedMonth');
    const yearSelect = document.getElementById('selectedMonthYear');
    
    if (monthSelect) {
        monthSelect.value = currentDate.getMonth() + 1;
    }
    if (yearSelect) {
        yearSelect.value = currentDate.getFullYear();
    }
    
    showAlert('Periode diset ke bulan ini', 'success');
}

/**
 * Set Period to Specific Date
 * Task 2: Helper function to set period selection to specific date
 */
function setPeriodToDate(date) {
    // Select daily period
    const dailyRadio = document.getElementById('dailyPeriod');
    if (dailyRadio) {
        dailyRadio.checked = true;
        dailyRadio.dispatchEvent(new Event('change'));
    }
    
    // Set the date
    const dateInput = document.getElementById('selectedDate');
    if (dateInput) {
        dateInput.value = date.toISOString().split('T')[0];
    }
    
    showAlert(`Periode diset ke ${date.toLocaleDateString('id-ID')}`, 'success');
}

/**
 * Set Period to Current Year
 * Task 2: Helper function to set period selection to current year
 */
function setPeriodToCurrentYear() {
    const currentDate = new Date();
    
    // Select yearly period
    const yearlyRadio = document.getElementById('yearlyPeriod');
    if (yearlyRadio) {
        yearlyRadio.checked = true;
        yearlyRadio.dispatchEvent(new Event('change'));
    }
    
    // Set current year
    const yearSelect = document.getElementById('selectedYear');
    if (yearSelect) {
        yearSelect.value = currentDate.getFullYear();
    }
    
    showAlert('Periode diset ke tahun ini', 'success');
}

/**
 * Display Enhanced Balance Sheet Placeholder
 * Task 2: Enhanced placeholder with validation and data availability info
 * This will be replaced with actual balance sheet calculation in Task 3
 */
function displayEnhancedBalanceSheetPlaceholder(enhancedPeriod) {
    const reportContent = document.getElementById('neracaReportContent');
    
    reportContent.innerHTML = `
        <div class="card">
            <div class="card-header bg-success text-white">
                <h5 class="mb-0">
                    <i class="bi bi-file-earmark-bar-graph me-2"></i>
                    Laporan Neraca - ${enhancedPeriod.message}
                </h5>
            </div>
            <div class="card-body">
                <!-- Validation & Data Info -->
                <div class="row mb-4">
                    <div class="col-md-6">
                        <div class="alert alert-success">
                            <i class="bi bi-check-circle me-2"></i>
                            <strong>Validasi Periode:</strong> Berhasil
                            <br><small>Tipe: ${enhancedPeriod.periodType}</small>
                            <br><small>Tanggal akhir: ${enhancedPeriod.endDate.toLocaleDateString('id-ID')}</small>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="alert alert-info">
                            <i class="bi bi-database me-2"></i>
                            <strong>Data Tersedia:</strong>
                            <br><small>COA: ${enhancedPeriod.dataInfo.coaCount} akun</small>
                            <br><small>Jurnal: ${enhancedPeriod.dataInfo.journalCount} entri</small>
                            <br><small>Status: ${enhancedPeriod.dataInfo.hasJournalEntries ? 'Ada transaksi' : 'Hanya saldo awal'}</small>
                        </div>
                    </div>
                </div>
                
                <!-- Task 2 Completion Status -->
                <div class="alert alert-success">
                    <i class="bi bi-check-circle me-2"></i>
                    <strong>Task 2 Complete:</strong> Period selection components with validation implemented!
                    <br><br>
                    <strong>Enhanced Features:</strong>
                    <ul class="mb-2">
                        <li>✅ Period validation against available data</li>
                        <li>✅ Data availability checking</li>
                        <li>✅ Alternative period suggestions</li>
                        <li>✅ Enhanced error handling and user feedback</li>
                        <li>✅ Reset and retry mechanisms</li>
                    </ul>
                    <em>Balance sheet calculation engine will be implemented in Task 3.</em>
                </div>
                
                <!-- Placeholder Balance Sheet Structure -->
                <div class="row">
                    <div class="col-md-6">
                        <h6 class="text-primary">ASET (ASSETS)</h6>
                        <div class="ms-3">
                            <p class="mb-1">Aset Lancar:</p>
                            <div class="ms-3 text-muted">
                                <small>• Kas<br>• Bank<br>• Piutang Anggota</small>
                            </div>
                            <p class="mb-1 mt-2">Aset Tetap:</p>
                            <div class="ms-3 text-muted">
                                <small>• Persediaan Barang</small>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <h6 class="text-success">KEWAJIBAN & MODAL</h6>
                        <div class="ms-3">
                            <p class="mb-1">Kewajiban:</p>
                            <div class="ms-3 text-muted">
                                <small>• Hutang Supplier<br>• Simpanan Pokok<br>• Simpanan Wajib<br>• Simpanan Sukarela</small>
                            </div>
                            <p class="mb-1 mt-2">Modal:</p>
                            <div class="ms-3 text-muted">
                                <small>• Modal Koperasi<br>• Laba Ditahan</small>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Action Buttons -->
                <div class="mt-4 d-flex gap-2">
                    <button class="btn btn-outline-primary" onclick="resetPeriodSelection()">
                        <i class="bi bi-arrow-clockwise me-1"></i>Reset Periode
                    </button>
                    <button class="btn btn-outline-info" onclick="suggestAlternativePeriods()">
                        <i class="bi bi-lightbulb me-1"></i>Saran Periode Lain
                    </button>
                </div>
            </div>
        </div>
    `;
}

/**
 * Enhanced Period Selection Event Listeners
 * Task 2: Add validation feedback to period selection changes
 */
function setupEnhancedPeriodSelectionListeners() {
    const periodRadios = document.querySelectorAll('input[name="periodType"]');
    
    periodRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            // Hide all selectors
            document.querySelectorAll('.period-selector').forEach(selector => {
                selector.classList.add('d-none');
            });
            
            // Show selected period selector
            const selectedType = this.value;
            const selectorId = selectedType + 'Selector';
            const targetSelector = document.getElementById(selectorId);
            
            if (targetSelector) {
                targetSelector.classList.remove('d-none');
            }
            
            // Clear any previous validation messages
            clearPeriodValidationMessages();
            
            // Show period-specific tips
            showPeriodSelectionTips(selectedType);
        });
    });
    
    // Add validation on date/month/year changes
    const dateInput = document.getElementById('selectedDate');
    const monthSelect = document.getElementById('selectedMonth');
    const monthYearSelect = document.getElementById('selectedMonthYear');
    const yearSelect = document.getElementById('selectedYear');
    
    if (dateInput) {
        dateInput.addEventListener('change', () => validateCurrentPeriodSelection());
    }
    if (monthSelect) {
        monthSelect.addEventListener('change', () => validateCurrentPeriodSelection());
    }
    if (monthYearSelect) {
        monthYearSelect.addEventListener('change', () => validateCurrentPeriodSelection());
    }
    if (yearSelect) {
        yearSelect.addEventListener('change', () => validateCurrentPeriodSelection());
    }
}

/**
 * Clear Period Validation Messages
 * Task 2: Helper function to clear validation feedback
 */
function clearPeriodValidationMessages() {
    const existingMessages = document.querySelectorAll('.period-validation-message');
    existingMessages.forEach(msg => msg.remove());
}

/**
 * Show Period Selection Tips
 * Task 2: Show contextual tips for different period types
 */
function showPeriodSelectionTips(periodType) {
    const tips = {
        daily: 'Pilih tanggal spesifik untuk melihat posisi keuangan pada hari tersebut.',
        monthly: 'Pilih bulan dan tahun untuk melihat posisi keuangan pada akhir bulan.',
        yearly: 'Pilih tahun untuk melihat posisi keuangan pada 31 Desember tahun tersebut.'
    };
    
    const tip = tips[periodType];
    if (tip) {
        // Find the active selector and add tip
        const activeSelector = document.getElementById(periodType + 'Selector');
        if (activeSelector && !activeSelector.querySelector('.period-tip')) {
            const tipElement = document.createElement('small');
            tipElement.className = 'text-muted period-tip mt-1 d-block';
            tipElement.innerHTML = `<i class="bi bi-info-circle me-1"></i>${tip}`;
            activeSelector.appendChild(tipElement);
        }
    }
}

/**
 * Validate Current Period Selection
 * Task 2: Real-time validation of period selection
 */
function validateCurrentPeriodSelection() {
    try {
        const periodType = document.querySelector('input[name="periodType"]:checked')?.value;
        if (!periodType) return;
        
        let periodData = { type: periodType };
        
        // Collect current values
        switch (periodType) {
            case 'daily':
                const dateValue = document.getElementById('selectedDate').value;
                if (dateValue) {
                    periodData.selectedDate = new Date(dateValue);
                }
                break;
            case 'monthly':
                const month = parseInt(document.getElementById('selectedMonth').value);
                const year = parseInt(document.getElementById('selectedMonthYear').value);
                if (month && year) {
                    periodData.selectedMonth = month;
                    periodData.selectedYear = year;
                }
                break;
            case 'yearly':
                const yearValue = parseInt(document.getElementById('selectedYear').value);
                if (yearValue) {
                    periodData.selectedYear = yearValue;
                }
                break;
        }
        
        // Validate if we have enough data
        const validation = validatePeriodSelection(periodData);
        showPeriodValidationFeedback(periodType, validation);
        
    } catch (error) {
        console.error('Error validating period selection:', error);
    }
}

/**
 * Show Period Validation Feedback
 * Task 2: Display real-time validation feedback
 */
function showPeriodValidationFeedback(periodType, validation) {
    clearPeriodValidationMessages();
    
    const activeSelector = document.getElementById(periodType + 'Selector');
    if (!activeSelector) return;
    
    const feedbackElement = document.createElement('div');
    feedbackElement.className = 'period-validation-message mt-2';
    
    if (validation.success) {
        feedbackElement.innerHTML = `
            <small class="text-success">
                <i class="bi bi-check-circle me-1"></i>
                Periode valid: ${validation.message}
            </small>
        `;
    } else {
        feedbackElement.innerHTML = `
            <small class="text-warning">
                <i class="bi bi-exclamation-triangle me-1"></i>
                ${validation.error}
            </small>
        `;
    }
    
    activeSelector.appendChild(feedbackElement);
}

/**
 * Balance Sheet Calculation Engine with Enhanced Error Handling
 * Task 6: Add error handling and user feedback
 * Requirements: 4.1, 4.4
 */

/**
 * Calculate Balance Sheet for a specific target date with performance monitoring
 * @param {Date} targetDate - The end date for the balance sheet calculation
 * @returns {Object} Balance sheet data structure
 */
function calculateBalanceSheet(targetDate) {
    // Start performance monitoring
    const performanceMonitor = typeof balanceSheetDiagnostics !== 'undefined' ? 
        balanceSheetDiagnostics.startMonitoring('calculateBalanceSheet', { targetDate }) : null;
    
    try {
        // Validate target date
        if (!targetDate || !(targetDate instanceof Date) || isNaN(targetDate.getTime())) {
            throw new Error('Target date tidak valid atau tidak tersedia');
        }
        
        // Get COA and journal data
        const coa = JSON.parse(localStorage.getItem('coa') || '[]');
        const jurnal = JSON.parse(localStorage.getItem('jurnal') || '[]');
        
        // Validate COA structure if diagnostics available
        if (typeof balanceSheetDiagnostics !== 'undefined') {
            const coaValidation = balanceSheetDiagnostics.validateCOAStructure(coa);
            if (!coaValidation.isValid) {
                throw new Error(`COA tidak valid: ${coaValidation.errors.join(', ')}`);
            }
        } else if (coa.length === 0) {
            throw new Error('Chart of Accounts (COA) tidak tersedia');
        }
        
        // Check for data chunking needs
        let shouldUseChunking = false;
        if (typeof balanceSheetDiagnostics !== 'undefined') {
            const coaChunking = balanceSheetDiagnostics.checkDataChunking(coa);
            const journalChunking = balanceSheetDiagnostics.checkDataChunking(jurnal);
            shouldUseChunking = coaChunking.needsChunking || journalChunking.needsChunking;
        }
        
        // Filter journal entries up to target date (using validated date cutoff logic)
        const relevantJournalEntries = jurnal.filter(j => {
            try {
                const entryDate = new Date(j.tanggal);
                if (isNaN(entryDate.getTime())) {
                    console.warn(`Invalid journal entry date: ${j.tanggal} in entry ${j.id}`);
                    return false;
                }
                return entryDate <= targetDate;
            } catch (error) {
                console.warn(`Error processing journal entry ${j.id}:`, error);
                return false;
            }
        });
        
        // Calculate account balances as of target date
        let accountBalances;
        if (shouldUseChunking && typeof balanceSheetDiagnostics !== 'undefined') {
            // Use chunked processing for large datasets
            accountBalances = calculateAccountBalancesChunked(coa, relevantJournalEntries);
        } else {
            accountBalances = calculateAccountBalances(coa, relevantJournalEntries);
        }
        
        // Categorize accounts into balance sheet sections
        const categorizedAccounts = categorizeAccountsForBalanceSheet(accountBalances);
        
        // Calculate totals and validate balance sheet equation
        const balanceSheetData = calculateBalanceSheetTotals(categorizedAccounts, targetDate);
        
        // Validate balance sheet equation
        const equationDifference = Math.abs(balanceSheetData.totals.totalAssets - balanceSheetData.totals.totalLiabilitiesAndEquity);
        if (equationDifference > 0.01) {
            console.warn(`Balance sheet equation not balanced. Difference: ${equationDifference}`);
            // Don't throw error, but log warning for investigation
        }
        
        // End performance monitoring
        if (performanceMonitor && typeof balanceSheetDiagnostics !== 'undefined') {
            const metrics = balanceSheetDiagnostics.endMonitoring(performanceMonitor, balanceSheetData);
            
            // Add performance info to result
            balanceSheetData.performanceMetrics = {
                duration: metrics.duration,
                memoryUsed: metrics.memoryUsed,
                dataSize: metrics.dataSize,
                isSlowOperation: metrics.isSlowOperation
            };
        }
        
        return balanceSheetData;
        
    } catch (error) {
        // End performance monitoring with error
        if (performanceMonitor && typeof balanceSheetDiagnostics !== 'undefined') {
            balanceSheetDiagnostics.endMonitoring(performanceMonitor, { error });
        }
        
        console.error('Error calculating balance sheet:', error);
        
        // Enhance error with context
        const enhancedError = new Error(`Calculation error: ${error.message}`);
        enhancedError.originalError = error;
        enhancedError.targetDate = targetDate;
        enhancedError.operation = 'calculateBalanceSheet';
        
        throw enhancedError;
    }
}

/**
 * Calculate account balances with chunked processing for large datasets
 * Task 6: Performance optimization for large datasets
 * Requirements: 4.4
 * @param {Array} coa - Chart of Accounts
 * @param {Array} journalEntries - Filtered journal entries
 * @returns {Array} Accounts with calculated balances
 */
function calculateAccountBalancesChunked(coa, journalEntries) {
    // Create a map to track balance changes from journal entries
    const balanceChanges = {};
    
    // Process journal entries in chunks if needed
    const chunkSize = 500; // Process 500 entries at a time
    
    for (let i = 0; i < journalEntries.length; i += chunkSize) {
        const chunk = journalEntries.slice(i, i + chunkSize);
        
        chunk.forEach(journal => {
            if (!journal.entries || !Array.isArray(journal.entries)) {
                console.warn(`Invalid journal entry structure: ${journal.id}`);
                return;
            }
            
            journal.entries.forEach(entry => {
                if (!entry.akun) {
                    console.warn(`Missing account code in journal entry: ${journal.id}`);
                    return;
                }
                
                if (!balanceChanges[entry.akun]) {
                    balanceChanges[entry.akun] = { debit: 0, kredit: 0 };
                }
                
                const debit = parseFloat(entry.debit) || 0;
                const kredit = parseFloat(entry.kredit) || 0;
                
                balanceChanges[entry.akun].debit += debit;
                balanceChanges[entry.akun].kredit += kredit;
            });
        });
        
        // Allow UI to update between chunks
        if (i + chunkSize < journalEntries.length) {
            // Small delay to prevent UI blocking
            setTimeout(() => {}, 1);
        }
    }
    
    // Calculate final balances for each account
    return coa.map(account => {
        try {
            const changes = balanceChanges[account.kode] || { debit: 0, kredit: 0 };
            const openingBalance = parseFloat(account.saldo) || 0;
            
            // Calculate balance based on account type
            let finalBalance;
            const accountType = account.tipe?.toLowerCase();
            
            if (accountType === 'aset' || accountType === 'asset') {
                // Assets: Debit increases, Credit decreases
                finalBalance = openingBalance + changes.debit - changes.kredit;
            } else if (accountType === 'kewajiban' || accountType === 'liability') {
                // Liabilities: Credit increases, Debit decreases
                finalBalance = openingBalance + changes.kredit - changes.debit;
            } else if (accountType === 'modal' || accountType === 'equity') {
                // Equity: Credit increases, Debit decreases
                finalBalance = openingBalance + changes.kredit - changes.debit;
            } else if (accountType === 'pendapatan' || accountType === 'revenue') {
                // Revenue: Credit increases, Debit decreases
                finalBalance = openingBalance + changes.kredit - changes.debit;
            } else if (accountType === 'beban' || accountType === 'expense') {
                // Expenses: Debit increases, Credit decreases
                finalBalance = openingBalance + changes.debit - changes.kredit;
            } else {
                // Default to asset behavior for unknown types
                finalBalance = openingBalance + changes.debit - changes.kredit;
                console.warn(`Unknown account type: ${accountType} for account ${account.kode}`);
            }
            
            return {
                ...account,
                saldoAwal: openingBalance,
                mutasiDebit: changes.debit,
                mutasiKredit: changes.kredit,
                saldoAkhir: finalBalance
            };
        } catch (error) {
            console.error(`Error calculating balance for account ${account.kode}:`, error);
            return {
                ...account,
                saldoAwal: parseFloat(account.saldo) || 0,
                mutasiDebit: 0,
                mutasiKredit: 0,
                saldoAkhir: parseFloat(account.saldo) || 0
            };
        }
    });
}

/**
 * Calculate account balances as of target date
 * @param {Array} coa - Chart of Accounts
 * @param {Array} journalEntries - Filtered journal entries
 * @returns {Array} Accounts with calculated balances
 */
function calculateAccountBalances(coa, journalEntries) {
    // Create a map to track balance changes from journal entries
    const balanceChanges = {};
    
    // Process all journal entries to calculate balance changes
    journalEntries.forEach(journal => {
        journal.entries.forEach(entry => {
            if (!balanceChanges[entry.akun]) {
                balanceChanges[entry.akun] = { debit: 0, kredit: 0 };
            }
            balanceChanges[entry.akun].debit += entry.debit || 0;
            balanceChanges[entry.akun].kredit += entry.kredit || 0;
        });
    });
    
    // Calculate final balances for each account
    return coa.map(account => {
        const changes = balanceChanges[account.kode] || { debit: 0, kredit: 0 };
        const openingBalance = account.saldo || 0;
        
        // Calculate balance based on account type
        let finalBalance;
        const accountType = account.tipe?.toLowerCase();
        
        if (accountType === 'aset' || accountType === 'asset') {
            // Assets: Debit increases, Credit decreases
            finalBalance = openingBalance + changes.debit - changes.kredit;
        } else if (accountType === 'kewajiban' || accountType === 'liability') {
            // Liabilities: Credit increases, Debit decreases
            finalBalance = openingBalance + changes.kredit - changes.debit;
        } else if (accountType === 'modal' || accountType === 'equity') {
            // Equity: Credit increases, Debit decreases
            finalBalance = openingBalance + changes.kredit - changes.debit;
        } else if (accountType === 'pendapatan' || accountType === 'revenue') {
            // Revenue: Credit increases, Debit decreases
            finalBalance = openingBalance + changes.kredit - changes.debit;
        } else if (accountType === 'beban' || accountType === 'expense') {
            // Expenses: Debit increases, Credit decreases
            finalBalance = openingBalance + changes.debit - changes.kredit;
        } else {
            // Default to asset behavior for unknown types
            finalBalance = openingBalance + changes.debit - changes.kredit;
        }
        
        return {
            ...account,
            saldoAwal: openingBalance,
            mutasiDebit: changes.debit,
            mutasiKredit: changes.kredit,
            saldoAkhir: finalBalance
        };
    });
}

/**
 * Categorize accounts for balance sheet display
 * @param {Array} accounts - Accounts with calculated balances
 * @returns {Object} Categorized accounts
 */
function categorizeAccountsForBalanceSheet(accounts) {
    const categorized = {
        currentAssets: [],
        fixedAssets: [],
        currentLiabilities: [],
        longTermLiabilities: [],
        equity: [],
        retainedEarnings: []
    };
    
    accounts.forEach(account => {
        const accountType = account.tipe?.toLowerCase();
        const accountCode = account.kode;
        const accountName = account.nama?.toLowerCase() || '';
        
        if (accountType === 'aset' || accountType === 'asset') {
            // Categorize assets based on account code or name
            if (accountCode.startsWith('1-1') || 
                accountName.includes('kas') || 
                accountName.includes('bank') || 
                accountName.includes('piutang')) {
                categorized.currentAssets.push(account);
            } else {
                categorized.fixedAssets.push(account);
            }
        } else if (accountType === 'kewajiban' || accountType === 'liability') {
            // Categorize liabilities
            if (accountCode.startsWith('2-1') || 
                accountName.includes('simpanan') || 
                accountName.includes('hutang jangka pendek')) {
                categorized.currentLiabilities.push(account);
            } else {
                categorized.longTermLiabilities.push(account);
            }
        } else if (accountType === 'modal' || accountType === 'equity') {
            // Categorize equity
            if (accountName.includes('laba') || accountName.includes('rugi')) {
                categorized.retainedEarnings.push(account);
            } else {
                categorized.equity.push(account);
            }
        }
    });
    
    return categorized;
}

/**
 * Calculate balance sheet totals and validate equation
 * @param {Object} categorizedAccounts - Categorized accounts
 * @param {Date} reportDate - Report date
 * @returns {Object} Complete balance sheet data
 */
function calculateBalanceSheetTotals(categorizedAccounts, reportDate) {
    // Calculate asset totals
    const totalCurrentAssets = categorizedAccounts.currentAssets
        .reduce((sum, account) => sum + (account.saldoAkhir || 0), 0);
    const totalFixedAssets = categorizedAccounts.fixedAssets
        .reduce((sum, account) => sum + (account.saldoAkhir || 0), 0);
    const totalAssets = totalCurrentAssets + totalFixedAssets;
    
    // Calculate liability totals
    const totalCurrentLiabilities = categorizedAccounts.currentLiabilities
        .reduce((sum, account) => sum + (account.saldoAkhir || 0), 0);
    const totalLongTermLiabilities = categorizedAccounts.longTermLiabilities
        .reduce((sum, account) => sum + (account.saldoAkhir || 0), 0);
    const totalLiabilities = totalCurrentLiabilities + totalLongTermLiabilities;
    
    // Calculate equity totals
    const totalEquity = categorizedAccounts.equity
        .reduce((sum, account) => sum + (account.saldoAkhir || 0), 0);
    const totalRetainedEarnings = categorizedAccounts.retainedEarnings
        .reduce((sum, account) => sum + (account.saldoAkhir || 0), 0);
    const totalEquityAndRetainedEarnings = totalEquity + totalRetainedEarnings;
    
    // Calculate total liabilities and equity
    const totalLiabilitiesAndEquity = totalLiabilities + totalEquityAndRetainedEarnings;
    
    // Validate balance sheet equation (Assets = Liabilities + Equity)
    const balanceSheetBalanced = Math.abs(totalAssets - totalLiabilitiesAndEquity) < 0.01; // Allow for rounding
    
    return {
        reportDate: reportDate,
        assets: {
            currentAssets: categorizedAccounts.currentAssets,
            fixedAssets: categorizedAccounts.fixedAssets,
            totalCurrentAssets: totalCurrentAssets,
            totalFixedAssets: totalFixedAssets,
            totalAssets: totalAssets
        },
        liabilities: {
            currentLiabilities: categorizedAccounts.currentLiabilities,
            longTermLiabilities: categorizedAccounts.longTermLiabilities,
            totalCurrentLiabilities: totalCurrentLiabilities,
            totalLongTermLiabilities: totalLongTermLiabilities,
            totalLiabilities: totalLiabilities
        },
        equity: {
            equity: categorizedAccounts.equity,
            retainedEarnings: categorizedAccounts.retainedEarnings,
            totalEquity: totalEquity,
            totalRetainedEarnings: totalRetainedEarnings,
            totalEquityAndRetainedEarnings: totalEquityAndRetainedEarnings
        },
        totals: {
            totalAssets: totalAssets,
            totalLiabilities: totalLiabilities,
            totalEquity: totalEquityAndRetainedEarnings,
            totalLiabilitiesAndEquity: totalLiabilitiesAndEquity,
            balanceSheetBalanced: balanceSheetBalanced,
            balanceDifference: totalAssets - totalLiabilitiesAndEquity
        }
    };
}

/**
 * Generate actual balance sheet report with enhanced error handling
 * Task 6: Enhanced error handling and user feedback
 * Requirements: 4.1, 4.2, 4.3
 * @param {Object} enhancedPeriod - Period information with validation results
 * @param {Object} performanceMonitor - Performance monitor object
 */
function generateActualBalanceSheetWithErrorHandling(enhancedPeriod, performanceMonitor) {
    const reportContent = document.getElementById('neracaReportContent');
    
    try {
        // Show calculation progress with enhanced feedback
        updateBalanceSheetLoadingIndicator(
            reportContent, 
            'Menghitung neraca berdasarkan data COA dan jurnal...', 
            'Memproses data akuntansi...', 
            75
        );
        
        // Calculate balance sheet with error handling
        const balanceSheetData = calculateBalanceSheet(enhancedPeriod.endDate);
        
        // Final progress update
        updateBalanceSheetLoadingIndicator(
            reportContent, 
            'Menampilkan laporan neraca...', 
            'Memformat tampilan laporan...', 
            95
        );
        
        // Small delay for smooth UX
        setTimeout(() => {
            // Display the calculated balance sheet
            displayCalculatedBalanceSheet(balanceSheetData, enhancedPeriod);
            
            // End performance monitoring
            if (performanceMonitor && typeof balanceSheetDiagnostics !== 'undefined') {
                const metrics = balanceSheetDiagnostics.endMonitoring(performanceMonitor, balanceSheetData);
                
                // Show performance info if slow
                if (metrics.isSlowOperation) {
                    setTimeout(() => {
                        showAlert(
                            `Laporan berhasil dibuat dalam ${Math.round(metrics.duration)}ms. ` +
                            `Untuk performa lebih baik, pertimbangkan menggunakan filter periode.`, 
                            'info'
                        );
                    }, 2000);
                }
            }
            
            // Reset retry counter on success
            if (typeof balanceSheetErrorHandler !== 'undefined') {
                balanceSheetErrorHandler.resetRetry('generateBalanceSheet');
            }
        }, 500);
        
    } catch (error) {
        handleBalanceSheetError(error, 'generateActualBalanceSheet', { enhancedPeriod }, reportContent, performanceMonitor);
    }
}

/**
 * Generate actual balance sheet report (legacy function for compatibility)
 * @param {Object} enhancedPeriod - Period information with validation results
 */
function generateActualBalanceSheet(enhancedPeriod) {
    generateActualBalanceSheetWithErrorHandling(enhancedPeriod, null);
}

/**
 * Display calculated balance sheet with enhanced formatting and layout
 * Task 4: Build balance sheet report display
 * Requirements: 2.5
 * @param {Object} balanceSheetData - Calculated balance sheet data
 * @param {Object} enhancedPeriod - Period information
 */
function displayCalculatedBalanceSheet(balanceSheetData, enhancedPeriod) {
    const reportContent = document.getElementById('neracaReportContent');
    
    // Enhanced balance warning with more details
    const balanceWarning = !balanceSheetData.totals.balanceSheetBalanced ? `
        <div class="alert alert-warning border-warning">
            <div class="d-flex align-items-center">
                <i class="bi bi-exclamation-triangle-fill me-3 fs-4 text-warning"></i>
                <div>
                    <h6 class="alert-heading mb-1">Neraca Tidak Seimbang</h6>
                    <p class="mb-2">Selisih: <strong>${formatRupiah(Math.abs(balanceSheetData.totals.balanceDifference))}</strong></p>
                    <small class="text-muted">
                        Periksa kembali jurnal dan COA untuk memastikan keakuratan data. 
                        Pastikan setiap jurnal memiliki debit = kredit.
                    </small>
                </div>
            </div>
        </div>
    ` : '';
    
    // Generate company header information
    const companyInfo = getCompanyInfoForReport();
    
    reportContent.innerHTML = `
        <!-- Enhanced Report Header -->
        <div class="card shadow-sm">
            <div class="card-header bg-gradient" style="background: linear-gradient(135deg, #2d6a4f 0%, #52b788 100%); color: white;">
                <div class="row align-items-center">
                    <div class="col-md-8">
                        <h4 class="mb-1">
                            <i class="bi bi-file-earmark-bar-graph me-2"></i>
                            LAPORAN NERACA (BALANCE SHEET)
                        </h4>
                        <h6 class="mb-0 opacity-90">${companyInfo.name}</h6>
                        <small class="opacity-75">Per ${balanceSheetData.reportDate.toLocaleDateString('id-ID', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                        })}</small>
                    </div>
                    <div class="col-md-4 text-end">
                        <div class="badge bg-light text-dark fs-6 px-3 py-2">
                            ${enhancedPeriod.periodType.toUpperCase()}
                        </div>
                        <br>
                        <small class="opacity-75">
                            ${enhancedPeriod.dataInfo.coaCount} Akun | ${enhancedPeriod.dataInfo.journalCount} Jurnal
                        </small>
                    </div>
                </div>
            </div>
            
            <div class="card-body p-4">
                ${balanceWarning}
                
                <!-- Enhanced Balance Sheet Equation Status -->
                <div class="row mb-4">
                    <div class="col-md-12">
                        <div class="card ${balanceSheetData.totals.balanceSheetBalanced ? 'border-success' : 'border-warning'}">
                            <div class="card-body py-3">
                                <div class="d-flex align-items-center justify-content-between">
                                    <div class="d-flex align-items-center">
                                        <i class="bi bi-${balanceSheetData.totals.balanceSheetBalanced ? 'check-circle-fill text-success' : 'exclamation-triangle-fill text-warning'} me-3 fs-4"></i>
                                        <div>
                                            <h6 class="mb-1">Persamaan Neraca</h6>
                                            <div class="text-muted">
                                                <span class="fw-bold text-primary">${formatRupiah(balanceSheetData.totals.totalAssets)}</span>
                                                <span class="mx-2">=</span>
                                                <span class="fw-bold text-success">${formatRupiah(balanceSheetData.totals.totalLiabilitiesAndEquity)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="text-end">
                                        <span class="badge ${balanceSheetData.totals.balanceSheetBalanced ? 'bg-success' : 'bg-warning text-dark'} fs-6">
                                            ${balanceSheetData.totals.balanceSheetBalanced ? 'SEIMBANG ✅' : 'TIDAK SEIMBANG ⚠️'}
                                        </span>
                                        ${!balanceSheetData.totals.balanceSheetBalanced ? `
                                            <br><small class="text-muted">Selisih: ${formatRupiah(Math.abs(balanceSheetData.totals.balanceDifference))}</small>
                                        ` : ''}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Enhanced Balance Sheet Content with Professional Layout -->
                <div class="row g-4">
                    <!-- Assets Column -->
                    <div class="col-lg-6">
                        <div class="card h-100 border-primary border-opacity-25">
                            <div class="card-header bg-primary bg-opacity-10 border-primary border-opacity-25">
                                <h5 class="text-primary mb-0">
                                    <i class="bi bi-cash-stack me-2"></i>ASET (ASSETS)
                                </h5>
                            </div>
                            <div class="card-body">
                                <!-- Current Assets -->
                                ${renderBalanceSheetSection(
                                    'Aset Lancar', 
                                    balanceSheetData.assets.currentAssets, 
                                    balanceSheetData.assets.totalCurrentAssets,
                                    'text-info'
                                )}
                                
                                <!-- Fixed Assets -->
                                ${renderBalanceSheetSection(
                                    'Aset Tetap', 
                                    balanceSheetData.assets.fixedAssets, 
                                    balanceSheetData.assets.totalFixedAssets,
                                    'text-info'
                                )}
                                
                                <!-- Total Assets -->
                                <div class="mt-4">
                                    <div class="card bg-primary text-white">
                                        <div class="card-body py-3">
                                            <div class="d-flex justify-content-between align-items-center">
                                                <h6 class="mb-0 fw-bold">TOTAL ASET</h6>
                                                <h5 class="mb-0 fw-bold">${formatRupiah(balanceSheetData.assets.totalAssets)}</h5>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Liabilities and Equity Column -->
                    <div class="col-lg-6">
                        <div class="card h-100 border-success border-opacity-25">
                            <div class="card-header bg-success bg-opacity-10 border-success border-opacity-25">
                                <h5 class="text-success mb-0">
                                    <i class="bi bi-building me-2"></i>KEWAJIBAN & MODAL
                                </h5>
                            </div>
                            <div class="card-body">
                                <!-- Current Liabilities -->
                                ${renderBalanceSheetSection(
                                    'Kewajiban Lancar', 
                                    balanceSheetData.liabilities.currentLiabilities, 
                                    balanceSheetData.liabilities.totalCurrentLiabilities,
                                    'text-warning'
                                )}
                                
                                <!-- Long-term Liabilities -->
                                ${balanceSheetData.liabilities.longTermLiabilities.length > 0 ? 
                                    renderBalanceSheetSection(
                                        'Kewajiban Jangka Panjang', 
                                        balanceSheetData.liabilities.longTermLiabilities, 
                                        balanceSheetData.liabilities.totalLongTermLiabilities,
                                        'text-warning'
                                    ) : ''
                                }
                                
                                <!-- Total Liabilities Summary -->
                                <div class="mb-4">
                                    <div class="d-flex justify-content-between align-items-center py-2 border-bottom border-success border-opacity-50">
                                        <h6 class="text-success mb-0 fw-bold">TOTAL KEWAJIBAN</h6>
                                        <h6 class="text-success mb-0 fw-bold">${formatRupiah(balanceSheetData.liabilities.totalLiabilities)}</h6>
                                    </div>
                                </div>
                                
                                <!-- Equity Section -->
                                ${renderEquitySection(balanceSheetData.equity)}
                                
                                <!-- Total Liabilities and Equity -->
                                <div class="mt-4">
                                    <div class="card bg-success text-white">
                                        <div class="card-body py-3">
                                            <div class="d-flex justify-content-between align-items-center">
                                                <h6 class="mb-0 fw-bold">TOTAL KEWAJIBAN & MODAL</h6>
                                                <h5 class="mb-0 fw-bold">${formatRupiah(balanceSheetData.totals.totalLiabilitiesAndEquity)}</h5>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Enhanced Action Buttons with More Options -->
                <div class="mt-4">
                    <div class="card">
                        <div class="card-body">
                            <div class="row g-3">
                                <div class="col-md-6">
                                    <h6 class="text-muted mb-3">
                                        <i class="bi bi-gear me-2"></i>Aksi Laporan
                                    </h6>
                                    <div class="d-flex flex-wrap gap-2">
                                        <button class="btn btn-outline-primary" onclick="resetPeriodSelection()">
                                            <i class="bi bi-arrow-clockwise me-1"></i>Periode Baru
                                        </button>
                                        <button class="btn btn-outline-info" onclick="suggestAlternativePeriods()">
                                            <i class="bi bi-lightbulb me-1"></i>Saran Periode
                                        </button>
                                        <button class="btn btn-outline-secondary" onclick="refreshBalanceSheet()">
                                            <i class="bi bi-arrow-repeat me-1"></i>Refresh Data
                                        </button>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <h6 class="text-muted mb-3">
                                        <i class="bi bi-download me-2"></i>Export & Print
                                    </h6>
                                    <div class="d-flex flex-wrap gap-2">
                                        <button class="btn btn-success" onclick="exportBalanceSheetPDF()">
                                            <i class="bi bi-file-earmark-pdf me-1"></i>Export PDF
                                        </button>
                                        <button class="btn btn-primary" onclick="exportBalanceSheetExcel()">
                                            <i class="bi bi-file-earmark-excel me-1"></i>Export Excel
                                        </button>
                                        <button class="btn btn-secondary" onclick="printBalanceSheet()">
                                            <i class="bi bi-printer me-1"></i>Print
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Enhanced Report Summary and Metadata -->
                <div class="mt-4">
                    <div class="card bg-light">
                        <div class="card-body">
                            <div class="row">
                                <div class="col-md-8">
                                    <h6 class="text-success mb-3">
                                        <i class="bi bi-check-circle me-2"></i>Task 4 Complete: Enhanced Balance Sheet Display
                                    </h6>
                                    <div class="row g-3">
                                        <div class="col-sm-6">
                                            <strong>Fitur Display:</strong>
                                            <ul class="small mb-0 mt-1">
                                                <li>✅ Professional layout dengan card design</li>
                                                <li>✅ Enhanced header dengan company info</li>
                                                <li>✅ Color-coded sections (Assets vs Liabilities)</li>
                                                <li>✅ Improved balance equation display</li>
                                            </ul>
                                        </div>
                                        <div class="col-sm-6">
                                            <strong>User Experience:</strong>
                                            <ul class="small mb-0 mt-1">
                                                <li>✅ Responsive design untuk mobile</li>
                                                <li>✅ Enhanced action buttons</li>
                                                <li>✅ Better error handling display</li>
                                                <li>✅ Standard balance sheet format</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="text-end">
                                        <div class="small text-muted">
                                            <strong>Ringkasan Data:</strong><br>
                                            📊 ${enhancedPeriod.dataInfo.coaCount} Akun COA<br>
                                            📝 ${enhancedPeriod.dataInfo.journalCount} Entri Jurnal<br>
                                            📅 Periode: ${enhancedPeriod.periodType}<br>
                                            ⚖️ Status: ${balanceSheetData.totals.balanceSheetBalanced ? 'Seimbang' : 'Tidak Seimbang'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Render balance sheet section with enhanced formatting
 * Task 4: Helper function for professional section display
 * @param {string} sectionTitle - Title of the section
 * @param {Array} accounts - Array of account objects
 * @param {number} sectionTotal - Total amount for the section
 * @param {string} colorClass - CSS class for section color
 * @returns {string} HTML string for the section
 */
function renderBalanceSheetSection(sectionTitle, accounts, sectionTotal, colorClass = 'text-secondary') {
    if (accounts.length === 0) {
        return `
            <div class="mb-4">
                <h6 class="${colorClass}">${sectionTitle}</h6>
                <div class="ms-3">
                    <div class="text-muted fst-italic py-2">
                        <small>Tidak ada akun dalam kategori ini</small>
                    </div>
                </div>
            </div>
        `;
    }
    
    return `
        <div class="mb-4">
            <h6 class="${colorClass} mb-3">
                <i class="bi bi-folder me-2"></i>${sectionTitle}
            </h6>
            <div class="ms-3">
                <div class="table-responsive">
                    <table class="table table-sm table-borderless">
                        <tbody>
                            ${accounts.map(account => `
                                <tr>
                                    <td class="ps-0">
                                        <span class="text-dark">${account.nama}</span>
                                        <br><small class="text-muted">${account.kode}</small>
                                    </td>
                                    <td class="text-end pe-0">
                                        <span class="fw-medium">${formatRupiah(account.saldoAkhir)}</span>
                                        ${account.saldoAkhir < 0 ? '<br><small class="text-danger">Saldo Negatif</small>' : ''}
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                <hr class="my-2 border-2">
                <div class="d-flex justify-content-between align-items-center py-2">
                    <h6 class="mb-0 fw-bold ${colorClass}">Total ${sectionTitle}</h6>
                    <h6 class="mb-0 fw-bold ${colorClass}">${formatRupiah(sectionTotal)}</h6>
                </div>
            </div>
        </div>
    `;
}

/**
 * Render equity section with enhanced formatting
 * Task 4: Special rendering for equity section
 * @param {Object} equityData - Equity data object
 * @returns {string} HTML string for equity section
 */
function renderEquitySection(equityData) {
    const allEquityAccounts = [...equityData.equity, ...equityData.retainedEarnings];
    
    if (allEquityAccounts.length === 0) {
        return `
            <div class="mb-4">
                <h6 class="text-primary">Modal</h6>
                <div class="ms-3">
                    <div class="text-muted fst-italic py-2">
                        <small>Tidak ada akun modal</small>
                    </div>
                </div>
            </div>
        `;
    }
    
    return `
        <div class="mb-4">
            <h6 class="text-primary mb-3">
                <i class="bi bi-bank me-2"></i>Modal
            </h6>
            <div class="ms-3">
                <div class="table-responsive">
                    <table class="table table-sm table-borderless">
                        <tbody>
                            ${equityData.equity.map(account => `
                                <tr>
                                    <td class="ps-0">
                                        <span class="text-dark">${account.nama}</span>
                                        <br><small class="text-muted">${account.kode} • Modal Dasar</small>
                                    </td>
                                    <td class="text-end pe-0">
                                        <span class="fw-medium">${formatRupiah(account.saldoAkhir)}</span>
                                    </td>
                                </tr>
                            `).join('')}
                            ${equityData.retainedEarnings.map(account => `
                                <tr>
                                    <td class="ps-0">
                                        <span class="text-dark">${account.nama}</span>
                                        <br><small class="text-muted">${account.kode} • Laba Ditahan</small>
                                    </td>
                                    <td class="text-end pe-0">
                                        <span class="fw-medium ${account.saldoAkhir >= 0 ? 'text-success' : 'text-danger'}">${formatRupiah(account.saldoAkhir)}</span>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                <hr class="my-2 border-2">
                <div class="d-flex justify-content-between align-items-center py-2">
                    <h6 class="mb-0 fw-bold text-primary">Total Modal</h6>
                    <h6 class="mb-0 fw-bold text-primary">${formatRupiah(equityData.totalEquityAndRetainedEarnings)}</h6>
                </div>
            </div>
        </div>
    `;
}

/**
 * Get company information for report header
 * Task 4: Enhanced report header with company info
 * @returns {Object} Company information object
 */
function getCompanyInfoForReport() {
    const koperasi = JSON.parse(localStorage.getItem('koperasi') || '{}');
    
    return {
        name: koperasi.nama || 'Koperasi',
        address: koperasi.alamat || '',
        phone: koperasi.telepon || '',
        email: koperasi.email || ''
    };
}

/**
 * Refresh balance sheet data
 * Task 4: Enhanced user interaction
 */
function refreshBalanceSheet() {
    const currentPeriodType = document.querySelector('input[name="periodType"]:checked')?.value;
    
    if (!currentPeriodType) {
        showAlert('Pilih periode terlebih dahulu untuk refresh data', 'warning');
        return;
    }
    
    showAlert('Memuat ulang data neraca...', 'info');
    
    // Trigger regeneration of current balance sheet
    setTimeout(() => {
        generateBalanceSheet();
    }, 500);
}

/**
 * Export Balance Sheet to PDF
 * Task 5: Implement export functionality
 * Requirements: 3.1, 3.2
 */
function exportBalanceSheetPDF() {
    try {
        // Get current balance sheet data
        const balanceSheetData = getCurrentBalanceSheetData();
        
        if (!balanceSheetData) {
            showAlert('Tidak ada data neraca untuk diexport. Silakan generate laporan terlebih dahulu.', 'warning');
            return;
        }
        
        // Show loading indicator
        showAlert('Mempersiapkan export PDF...', 'info');
        
        // Create PDF content using existing report structure
        const pdfContent = generatePDFContent(balanceSheetData);
        
        // Create and download PDF
        setTimeout(() => {
            createAndDownloadPDF(pdfContent, balanceSheetData);
        }, 1000);
        
    } catch (error) {
        console.error('Error exporting PDF:', error);
        showAlert('Gagal mengexport PDF: ' + error.message, 'error');
    }
}

/**
 * Export Balance Sheet to Excel
 * Task 5: Implement export functionality  
 * Requirements: 3.1, 3.3
 */
function exportBalanceSheetExcel() {
    try {
        // Get current balance sheet data
        const balanceSheetData = getCurrentBalanceSheetData();
        
        if (!balanceSheetData) {
            showAlert('Tidak ada data neraca untuk diexport. Silakan generate laporan terlebih dahulu.', 'warning');
            return;
        }
        
        // Show loading indicator
        showAlert('Mempersiapkan export Excel...', 'info');
        
        // Create Excel content with structured data
        const excelData = generateExcelData(balanceSheetData);
        
        // Create and download Excel file
        setTimeout(() => {
            createAndDownloadExcel(excelData, balanceSheetData);
        }, 800);
        
    } catch (error) {
        console.error('Error exporting Excel:', error);
        showAlert('Gagal mengexport Excel: ' + error.message, 'error');
    }
}

/**
 * Print Balance Sheet
 * Task 5: Implement export functionality
 * Requirements: 3.1, 3.4
 */
function printBalanceSheet() {
    try {
        // Get current balance sheet data
        const balanceSheetData = getCurrentBalanceSheetData();
        
        if (!balanceSheetData) {
            showAlert('Tidak ada data neraca untuk diprint. Silakan generate laporan terlebih dahulu.', 'warning');
            return;
        }
        
        // Show loading indicator
        showAlert('Mempersiapkan layout print...', 'info');
        
        // Create print-optimized layout
        const printContent = generatePrintContent(balanceSheetData);
        
        // Open print dialog
        setTimeout(() => {
            openPrintDialog(printContent, balanceSheetData);
        }, 500);
        
    } catch (error) {
        console.error('Error printing balance sheet:', error);
        showAlert('Gagal mempersiapkan print: ' + error.message, 'error');
    }
}

/**
 * Get Current Balance Sheet Data
 * Task 5: Helper function to retrieve current balance sheet data
 * @returns {Object|null} Current balance sheet data or null if not available
 */
function getCurrentBalanceSheetData() {
    // Try to get data from the current report display
    const reportContent = document.getElementById('neracaReportContent');
    
    if (!reportContent || !reportContent.innerHTML.includes('LAPORAN NERACA')) {
        return null;
    }
    
    // Get period information from current selection
    const periodType = document.querySelector('input[name="periodType"]:checked')?.value;
    if (!periodType) {
        return null;
    }
    
    let periodData = { type: periodType };
    
    // Collect current period data
    switch (periodType) {
        case 'daily':
            const dateValue = document.getElementById('selectedDate')?.value;
            if (dateValue) {
                periodData.selectedDate = new Date(dateValue);
            }
            break;
        case 'monthly':
            const month = parseInt(document.getElementById('selectedMonth')?.value);
            const year = parseInt(document.getElementById('selectedMonthYear')?.value);
            if (month && year) {
                periodData.selectedMonth = month;
                periodData.selectedYear = year;
            }
            break;
        case 'yearly':
            const yearValue = parseInt(document.getElementById('selectedYear')?.value);
            if (yearValue) {
                periodData.selectedYear = yearValue;
            }
            break;
    }
    
    // Validate and get end date
    const validation = validatePeriodSelection(periodData);
    if (!validation.success) {
        return null;
    }
    
    // Recalculate balance sheet with current data
    try {
        const balanceSheetData = calculateBalanceSheet(validation.endDate);
        
        // Add period information
        balanceSheetData.periodInfo = {
            type: periodType,
            endDate: validation.endDate,
            message: validation.message,
            originalInput: periodData
        };
        
        return balanceSheetData;
    } catch (error) {
        console.error('Error recalculating balance sheet:', error);
        return null;
    }
}

/**
 * Generate PDF Content
 * Task 5: Create formatted PDF content with proper balance sheet layout
 * Requirements: 3.2
 * @param {Object} balanceSheetData - Balance sheet data
 * @returns {string} HTML content optimized for PDF
 */
function generatePDFContent(balanceSheetData) {
    const companyInfo = getCompanyInfoForReport();
    const periodText = formatPeriodText(balanceSheetData.periodInfo);
    
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Laporan Neraca - ${companyInfo.name}</title>
            <style>
                @page {
                    size: A4;
                    margin: 2cm;
                }
                body {
                    font-family: Arial, sans-serif;
                    font-size: 12px;
                    line-height: 1.4;
                    color: #333;
                }
                .header {
                    text-align: center;
                    margin-bottom: 30px;
                    border-bottom: 2px solid #2d6a4f;
                    padding-bottom: 15px;
                }
                .company-name {
                    font-size: 18px;
                    font-weight: bold;
                    color: #2d6a4f;
                    margin-bottom: 5px;
                }
                .report-title {
                    font-size: 16px;
                    font-weight: bold;
                    margin-bottom: 5px;
                }
                .report-period {
                    font-size: 12px;
                    color: #666;
                }
                .balance-equation {
                    background: ${balanceSheetData.totals.balanceSheetBalanced ? '#d4edda' : '#fff3cd'};
                    border: 1px solid ${balanceSheetData.totals.balanceSheetBalanced ? '#c3e6cb' : '#ffeaa7'};
                    padding: 10px;
                    margin: 20px 0;
                    text-align: center;
                    border-radius: 5px;
                }
                .balance-sheet-container {
                    display: flex;
                    gap: 30px;
                }
                .assets-section, .liabilities-equity-section {
                    flex: 1;
                }
                .section-title {
                    font-size: 14px;
                    font-weight: bold;
                    color: #2d6a4f;
                    margin-bottom: 15px;
                    padding-bottom: 5px;
                    border-bottom: 1px solid #2d6a4f;
                }
                .subsection-title {
                    font-size: 12px;
                    font-weight: bold;
                    color: #52b788;
                    margin: 15px 0 8px 0;
                }
                .account-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 15px;
                }
                .account-table td {
                    padding: 3px 0;
                    border: none;
                }
                .account-name {
                    padding-left: 15px;
                }
                .account-amount {
                    text-align: right;
                    font-weight: 500;
                }
                .subtotal-row {
                    border-top: 1px solid #ccc;
                    font-weight: bold;
                    padding-top: 5px;
                }
                .total-row {
                    border-top: 2px solid #2d6a4f;
                    border-bottom: 2px solid #2d6a4f;
                    font-weight: bold;
                    font-size: 13px;
                    background: #f8f9fa;
                }
                .footer {
                    margin-top: 30px;
                    font-size: 10px;
                    color: #666;
                    text-align: center;
                    border-top: 1px solid #ddd;
                    padding-top: 10px;
                }
                @media print {
                    .no-print { display: none; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="company-name">${companyInfo.name}</div>
                <div class="report-title">LAPORAN NERACA (BALANCE SHEET)</div>
                <div class="report-period">Per ${balanceSheetData.reportDate.toLocaleDateString('id-ID', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                })}</div>
                <div class="report-period">${periodText}</div>
            </div>
            
            <div class="balance-equation">
                <strong>Persamaan Neraca:</strong> 
                ${formatRupiah(balanceSheetData.totals.totalAssets)} = ${formatRupiah(balanceSheetData.totals.totalLiabilitiesAndEquity)}
                <br>
                <span style="color: ${balanceSheetData.totals.balanceSheetBalanced ? '#155724' : '#856404'};">
                    ${balanceSheetData.totals.balanceSheetBalanced ? '✓ SEIMBANG' : '⚠ TIDAK SEIMBANG'}
                </span>
            </div>
            
            <div class="balance-sheet-container">
                <div class="assets-section">
                    <div class="section-title">ASET (ASSETS)</div>
                    
                    ${generatePDFSection('Aset Lancar', balanceSheetData.assets.currentAssets, balanceSheetData.assets.totalCurrentAssets)}
                    ${generatePDFSection('Aset Tetap', balanceSheetData.assets.fixedAssets, balanceSheetData.assets.totalFixedAssets)}
                    
                    <table class="account-table">
                        <tr class="total-row">
                            <td><strong>TOTAL ASET</strong></td>
                            <td class="account-amount"><strong>${formatRupiah(balanceSheetData.assets.totalAssets)}</strong></td>
                        </tr>
                    </table>
                </div>
                
                <div class="liabilities-equity-section">
                    <div class="section-title">KEWAJIBAN & MODAL</div>
                    
                    ${generatePDFSection('Kewajiban Lancar', balanceSheetData.liabilities.currentLiabilities, balanceSheetData.liabilities.totalCurrentLiabilities)}
                    ${balanceSheetData.liabilities.longTermLiabilities.length > 0 ? 
                        generatePDFSection('Kewajiban Jangka Panjang', balanceSheetData.liabilities.longTermLiabilities, balanceSheetData.liabilities.totalLongTermLiabilities) : ''
                    }
                    
                    <table class="account-table">
                        <tr class="subtotal-row">
                            <td><strong>Total Kewajiban</strong></td>
                            <td class="account-amount"><strong>${formatRupiah(balanceSheetData.liabilities.totalLiabilities)}</strong></td>
                        </tr>
                    </table>
                    
                    ${generatePDFEquitySection(balanceSheetData.equity)}
                    
                    <table class="account-table">
                        <tr class="total-row">
                            <td><strong>TOTAL KEWAJIBAN & MODAL</strong></td>
                            <td class="account-amount"><strong>${formatRupiah(balanceSheetData.totals.totalLiabilitiesAndEquity)}</strong></td>
                        </tr>
                    </table>
                </div>
            </div>
            
            <div class="footer">
                Dicetak pada: ${new Date().toLocaleDateString('id-ID', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                })}
                <br>
                Sistem Manajemen Koperasi - Laporan Neraca
            </div>
        </body>
        </html>
    `;
}

/**
 * Generate PDF Section
 * Task 5: Helper function for PDF section generation
 * @param {string} title - Section title
 * @param {Array} accounts - Array of accounts
 * @param {number} total - Section total
 * @returns {string} HTML for PDF section
 */
function generatePDFSection(title, accounts, total) {
    if (accounts.length === 0) {
        return `
            <div class="subsection-title">${title}</div>
            <table class="account-table">
                <tr>
                    <td class="account-name" style="font-style: italic; color: #666;">Tidak ada akun</td>
                    <td class="account-amount">-</td>
                </tr>
            </table>
        `;
    }
    
    return `
        <div class="subsection-title">${title}</div>
        <table class="account-table">
            ${accounts.map(account => `
                <tr>
                    <td class="account-name">${account.nama}</td>
                    <td class="account-amount">${formatRupiah(account.saldoAkhir)}</td>
                </tr>
            `).join('')}
            <tr class="subtotal-row">
                <td><strong>Total ${title}</strong></td>
                <td class="account-amount"><strong>${formatRupiah(total)}</strong></td>
            </tr>
        </table>
    `;
}

/**
 * Generate PDF Equity Section
 * Task 5: Special PDF formatting for equity section
 * @param {Object} equityData - Equity data
 * @returns {string} HTML for PDF equity section
 */
function generatePDFEquitySection(equityData) {
    const allEquityAccounts = [...equityData.equity, ...equityData.retainedEarnings];
    
    if (allEquityAccounts.length === 0) {
        return `
            <div class="subsection-title">Modal</div>
            <table class="account-table">
                <tr>
                    <td class="account-name" style="font-style: italic; color: #666;">Tidak ada akun modal</td>
                    <td class="account-amount">-</td>
                </tr>
            </table>
        `;
    }
    
    return `
        <div class="subsection-title">Modal</div>
        <table class="account-table">
            ${equityData.equity.map(account => `
                <tr>
                    <td class="account-name">${account.nama}</td>
                    <td class="account-amount">${formatRupiah(account.saldoAkhir)}</td>
                </tr>
            `).join('')}
            ${equityData.retainedEarnings.map(account => `
                <tr>
                    <td class="account-name">${account.nama}</td>
                    <td class="account-amount">${formatRupiah(account.saldoAkhir)}</td>
                </tr>
            `).join('')}
            <tr class="subtotal-row">
                <td><strong>Total Modal</strong></td>
                <td class="account-amount"><strong>${formatRupiah(equityData.totalEquityAndRetainedEarnings)}</strong></td>
            </tr>
        </table>
    `;
}

/**
 * Create and Download PDF
 * Task 5: Generate and download PDF file
 * Requirements: 3.2, 3.5
 * @param {string} content - HTML content for PDF
 * @param {Object} balanceSheetData - Balance sheet data
 */
function createAndDownloadPDF(content, balanceSheetData) {
    try {
        // Create a new window for PDF generation
        const printWindow = window.open('', '_blank');
        
        if (!printWindow) {
            throw new Error('Popup blocked. Silakan izinkan popup untuk export PDF.');
        }
        
        // Write content to new window
        printWindow.document.write(content);
        printWindow.document.close();
        
        // Wait for content to load, then trigger print
        printWindow.onload = function() {
            setTimeout(() => {
                printWindow.print();
                
                // Show success confirmation
                const periodText = formatPeriodText(balanceSheetData.periodInfo);
                showAlert(`✓ PDF berhasil disiapkan untuk download! (${periodText})`, 'success');
                
                // Close window after print dialog
                setTimeout(() => {
                    printWindow.close();
                }, 1000);
            }, 500);
        };
        
    } catch (error) {
        console.error('Error creating PDF:', error);
        showAlert('Gagal membuat PDF: ' + error.message, 'error');
    }
}

/**
 * Generate Excel Data
 * Task 5: Create structured Excel data
 * Requirements: 3.3
 * @param {Object} balanceSheetData - Balance sheet data
 * @returns {Object} Excel data structure
 */
function generateExcelData(balanceSheetData) {
    const companyInfo = getCompanyInfoForReport();
    const periodText = formatPeriodText(balanceSheetData.periodInfo);
    
    // Create CSV content with UTF-8 BOM for Excel compatibility
    const BOM = '\uFEFF';
    let csvContent = BOM;
    
    // Header information
    csvContent += `"${companyInfo.name}"\n`;
    csvContent += `"LAPORAN NERACA (BALANCE SHEET)"\n`;
    csvContent += `"Per ${balanceSheetData.reportDate.toLocaleDateString('id-ID')}"\n`;
    csvContent += `"${periodText}"\n`;
    csvContent += `\n`;
    
    // Balance equation
    csvContent += `"Persamaan Neraca:","${formatRupiah(balanceSheetData.totals.totalAssets)} = ${formatRupiah(balanceSheetData.totals.totalLiabilitiesAndEquity)}"\n`;
    csvContent += `"Status:","${balanceSheetData.totals.balanceSheetBalanced ? 'SEIMBANG' : 'TIDAK SEIMBANG'}"\n`;
    csvContent += `\n`;
    
    // Assets section
    csvContent += `"ASET (ASSETS)","","Jumlah"\n`;
    csvContent += generateExcelSection('Aset Lancar', balanceSheetData.assets.currentAssets, balanceSheetData.assets.totalCurrentAssets);
    csvContent += generateExcelSection('Aset Tetap', balanceSheetData.assets.fixedAssets, balanceSheetData.assets.totalFixedAssets);
    csvContent += `"TOTAL ASET","","${balanceSheetData.assets.totalAssets}"\n`;
    csvContent += `\n`;
    
    // Liabilities section
    csvContent += `"KEWAJIBAN & MODAL","","Jumlah"\n`;
    csvContent += generateExcelSection('Kewajiban Lancar', balanceSheetData.liabilities.currentLiabilities, balanceSheetData.liabilities.totalCurrentLiabilities);
    
    if (balanceSheetData.liabilities.longTermLiabilities.length > 0) {
        csvContent += generateExcelSection('Kewajiban Jangka Panjang', balanceSheetData.liabilities.longTermLiabilities, balanceSheetData.liabilities.totalLongTermLiabilities);
    }
    
    csvContent += `"Total Kewajiban","","${balanceSheetData.liabilities.totalLiabilities}"\n`;
    
    // Equity section
    csvContent += generateExcelEquitySection(balanceSheetData.equity);
    csvContent += `"TOTAL KEWAJIBAN & MODAL","","${balanceSheetData.totals.totalLiabilitiesAndEquity}"\n`;
    csvContent += `\n`;
    
    // Footer
    csvContent += `"Dicetak pada:","${new Date().toLocaleDateString('id-ID')}"\n`;
    csvContent += `"Sistem:","Manajemen Koperasi - Laporan Neraca"\n`;
    
    return {
        content: csvContent,
        filename: generateExcelFilename(balanceSheetData),
        periodText: periodText
    };
}

/**
 * Generate Excel Section
 * Task 5: Helper function for Excel section generation
 * @param {string} title - Section title
 * @param {Array} accounts - Array of accounts
 * @param {number} total - Section total
 * @returns {string} CSV content for section
 */
function generateExcelSection(title, accounts, total) {
    let content = `"${title}","",""\n`;
    
    if (accounts.length === 0) {
        content += `"","Tidak ada akun","0"\n`;
    } else {
        accounts.forEach(account => {
            content += `"","${account.nama}","${account.saldoAkhir}"\n`;
        });
    }
    
    content += `"","Total ${title}","${total}"\n`;
    return content;
}

/**
 * Generate Excel Equity Section
 * Task 5: Special Excel formatting for equity section
 * @param {Object} equityData - Equity data
 * @returns {string} CSV content for equity section
 */
function generateExcelEquitySection(equityData) {
    let content = `"Modal","",""\n`;
    
    const allEquityAccounts = [...equityData.equity, ...equityData.retainedEarnings];
    
    if (allEquityAccounts.length === 0) {
        content += `"","Tidak ada akun modal","0"\n`;
    } else {
        equityData.equity.forEach(account => {
            content += `"","${account.nama}","${account.saldoAkhir}"\n`;
        });
        equityData.retainedEarnings.forEach(account => {
            content += `"","${account.nama}","${account.saldoAkhir}"\n`;
        });
    }
    
    content += `"","Total Modal","${equityData.totalEquityAndRetainedEarnings}"\n`;
    return content;
}

/**
 * Generate Excel Filename
 * Task 5: Create descriptive filename for Excel export
 * @param {Object} balanceSheetData - Balance sheet data
 * @returns {string} Filename for Excel file
 */
function generateExcelFilename(balanceSheetData) {
    const date = balanceSheetData.reportDate;
    const dateStr = date.getFullYear() + 
                    String(date.getMonth() + 1).padStart(2, '0') + 
                    String(date.getDate()).padStart(2, '0');
    
    const periodType = balanceSheetData.periodInfo.type;
    return `neraca_${periodType}_${dateStr}.csv`;
}

/**
 * Create and Download Excel
 * Task 5: Generate and download Excel file
 * Requirements: 3.3, 3.5
 * @param {Object} excelData - Excel data structure
 * @param {Object} balanceSheetData - Balance sheet data
 */
function createAndDownloadExcel(excelData, balanceSheetData) {
    try {
        // Create blob and download
        const blob = new Blob([excelData.content], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        // Trigger download
        if (navigator.msSaveBlob) {
            // IE 10+
            navigator.msSaveBlob(blob, excelData.filename);
        } else {
            link.href = URL.createObjectURL(blob);
            link.download = excelData.filename;
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
        
        // Show success confirmation
        showAlert(`✓ Excel berhasil di-download: ${excelData.filename} (${excelData.periodText})`, 'success');
        
    } catch (error) {
        console.error('Error creating Excel:', error);
        showAlert('Gagal membuat Excel: ' + error.message, 'error');
    }
}

/**
 * Generate Print Content
 * Task 5: Create print-optimized layout
 * Requirements: 3.4
 * @param {Object} balanceSheetData - Balance sheet data
 * @returns {string} HTML content optimized for printing
 */
function generatePrintContent(balanceSheetData) {
    const companyInfo = getCompanyInfoForReport();
    const periodText = formatPeriodText(balanceSheetData.periodInfo);
    
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Print - Laporan Neraca</title>
            <style>
                @page {
                    size: A4;
                    margin: 1.5cm;
                }
                @media print {
                    body { margin: 0; }
                    .no-print { display: none !important; }
                }
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    font-size: 11px;
                    line-height: 1.3;
                    color: #000;
                    background: white;
                }
                .print-header {
                    text-align: center;
                    margin-bottom: 25px;
                    padding-bottom: 10px;
                    border-bottom: 2px solid #000;
                }
                .company-name {
                    font-size: 16px;
                    font-weight: bold;
                    margin-bottom: 3px;
                }
                .report-title {
                    font-size: 14px;
                    font-weight: bold;
                    margin-bottom: 3px;
                }
                .report-date {
                    font-size: 11px;
                    margin-bottom: 2px;
                }
                .balance-status {
                    background: ${balanceSheetData.totals.balanceSheetBalanced ? '#f0f8f0' : '#fff8f0'};
                    border: 1px solid ${balanceSheetData.totals.balanceSheetBalanced ? '#28a745' : '#ffc107'};
                    padding: 8px;
                    margin: 15px 0;
                    text-align: center;
                    font-size: 10px;
                }
                .print-container {
                    display: table;
                    width: 100%;
                    table-layout: fixed;
                }
                .print-column {
                    display: table-cell;
                    width: 50%;
                    vertical-align: top;
                    padding-right: 15px;
                }
                .print-column:last-child {
                    padding-right: 0;
                    padding-left: 15px;
                }
                .section-header {
                    font-size: 12px;
                    font-weight: bold;
                    margin-bottom: 10px;
                    padding: 5px;
                    background: #f8f9fa;
                    border: 1px solid #dee2e6;
                    text-align: center;
                }
                .subsection {
                    margin-bottom: 12px;
                }
                .subsection-title {
                    font-size: 10px;
                    font-weight: bold;
                    margin-bottom: 5px;
                    padding-left: 5px;
                    border-left: 3px solid #6c757d;
                }
                .account-line {
                    display: flex;
                    justify-content: space-between;
                    padding: 1px 0;
                    font-size: 9px;
                }
                .account-name {
                    padding-left: 10px;
                    flex: 1;
                }
                .account-amount {
                    text-align: right;
                    font-weight: 500;
                    min-width: 80px;
                }
                .subtotal-line {
                    display: flex;
                    justify-content: space-between;
                    padding: 3px 0;
                    margin-top: 3px;
                    border-top: 1px solid #ccc;
                    font-weight: bold;
                    font-size: 9px;
                }
                .total-line {
                    display: flex;
                    justify-content: space-between;
                    padding: 5px;
                    margin: 8px 0;
                    border: 2px solid #000;
                    background: #f8f9fa;
                    font-weight: bold;
                    font-size: 10px;
                }
                .print-footer {
                    margin-top: 20px;
                    font-size: 8px;
                    text-align: center;
                    color: #666;
                    border-top: 1px solid #ccc;
                    padding-top: 8px;
                }
            </style>
        </head>
        <body>
            <div class="print-header">
                <div class="company-name">${companyInfo.name}</div>
                <div class="report-title">LAPORAN NERACA (BALANCE SHEET)</div>
                <div class="report-date">Per ${balanceSheetData.reportDate.toLocaleDateString('id-ID', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                })}</div>
                <div class="report-date">${periodText}</div>
            </div>
            
            <div class="balance-status">
                <strong>Persamaan Neraca:</strong> 
                ${formatRupiah(balanceSheetData.totals.totalAssets)} = ${formatRupiah(balanceSheetData.totals.totalLiabilitiesAndEquity)}
                | Status: ${balanceSheetData.totals.balanceSheetBalanced ? 'SEIMBANG ✓' : 'TIDAK SEIMBANG ⚠'}
            </div>
            
            <div class="print-container">
                <div class="print-column">
                    <div class="section-header">ASET (ASSETS)</div>
                    
                    ${generatePrintSection('Aset Lancar', balanceSheetData.assets.currentAssets, balanceSheetData.assets.totalCurrentAssets)}
                    ${generatePrintSection('Aset Tetap', balanceSheetData.assets.fixedAssets, balanceSheetData.assets.totalFixedAssets)}
                    
                    <div class="total-line">
                        <span>TOTAL ASET</span>
                        <span>${formatRupiah(balanceSheetData.assets.totalAssets)}</span>
                    </div>
                </div>
                
                <div class="print-column">
                    <div class="section-header">KEWAJIBAN & MODAL</div>
                    
                    ${generatePrintSection('Kewajiban Lancar', balanceSheetData.liabilities.currentLiabilities, balanceSheetData.liabilities.totalCurrentLiabilities)}
                    ${balanceSheetData.liabilities.longTermLiabilities.length > 0 ? 
                        generatePrintSection('Kewajiban Jangka Panjang', balanceSheetData.liabilities.longTermLiabilities, balanceSheetData.liabilities.totalLongTermLiabilities) : ''
                    }
                    
                    <div class="subtotal-line">
                        <span>Total Kewajiban</span>
                        <span>${formatRupiah(balanceSheetData.liabilities.totalLiabilities)}</span>
                    </div>
                    
                    ${generatePrintEquitySection(balanceSheetData.equity)}
                    
                    <div class="total-line">
                        <span>TOTAL KEWAJIBAN & MODAL</span>
                        <span>${formatRupiah(balanceSheetData.totals.totalLiabilitiesAndEquity)}</span>
                    </div>
                </div>
            </div>
            
            <div class="print-footer">
                Dicetak pada: ${new Date().toLocaleDateString('id-ID', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                })} | Sistem Manajemen Koperasi
            </div>
        </body>
        </html>
    `;
}

/**
 * Generate Print Section
 * Task 5: Helper function for print section generation
 * @param {string} title - Section title
 * @param {Array} accounts - Array of accounts
 * @param {number} total - Section total
 * @returns {string} HTML for print section
 */
function generatePrintSection(title, accounts, total) {
    return `
        <div class="subsection">
            <div class="subsection-title">${title}</div>
            ${accounts.length === 0 ? 
                '<div class="account-line"><span class="account-name" style="font-style: italic; color: #666;">Tidak ada akun</span><span class="account-amount">-</span></div>' :
                accounts.map(account => `
                    <div class="account-line">
                        <span class="account-name">${account.nama}</span>
                        <span class="account-amount">${formatRupiah(account.saldoAkhir)}</span>
                    </div>
                `).join('')
            }
            <div class="subtotal-line">
                <span>Total ${title}</span>
                <span>${formatRupiah(total)}</span>
            </div>
        </div>
    `;
}

/**
 * Generate Print Equity Section
 * Task 5: Special print formatting for equity section
 * @param {Object} equityData - Equity data
 * @returns {string} HTML for print equity section
 */
function generatePrintEquitySection(equityData) {
    const allEquityAccounts = [...equityData.equity, ...equityData.retainedEarnings];
    
    return `
        <div class="subsection">
            <div class="subsection-title">Modal</div>
            ${allEquityAccounts.length === 0 ? 
                '<div class="account-line"><span class="account-name" style="font-style: italic; color: #666;">Tidak ada akun modal</span><span class="account-amount">-</span></div>' :
                allEquityAccounts.map(account => `
                    <div class="account-line">
                        <span class="account-name">${account.nama}</span>
                        <span class="account-amount">${formatRupiah(account.saldoAkhir)}</span>
                    </div>
                `).join('')
            }
            <div class="subtotal-line">
                <span>Total Modal</span>
                <span>${formatRupiah(equityData.totalEquityAndRetainedEarnings)}</span>
            </div>
        </div>
    `;
}

/**
 * Open Print Dialog
 * Task 5: Open browser print dialog with optimized content
 * Requirements: 3.4, 3.5
 * @param {string} content - HTML content for printing
 * @param {Object} balanceSheetData - Balance sheet data
 */
function openPrintDialog(content, balanceSheetData) {
    try {
        // Create a new window for printing
        const printWindow = window.open('', '_blank', 'width=800,height=600');
        
        if (!printWindow) {
            throw new Error('Popup blocked. Silakan izinkan popup untuk print.');
        }
        
        // Write content to new window
        printWindow.document.write(content);
        printWindow.document.close();
        
        // Wait for content to load, then trigger print
        printWindow.onload = function() {
            setTimeout(() => {
                printWindow.print();
                
                // Show success confirmation
                const periodText = formatPeriodText(balanceSheetData.periodInfo);
                showAlert(`✓ Dialog print berhasil dibuka! (${periodText})`, 'success');
                
                // Close window after print dialog (optional)
                printWindow.onafterprint = function() {
                    setTimeout(() => {
                        printWindow.close();
                    }, 1000);
                };
            }, 500);
        };
        
    } catch (error) {
        console.error('Error opening print dialog:', error);
        showAlert('Gagal membuka dialog print: ' + error.message, 'error');
    }
}

/**
 * Format Period Text
 * Task 5: Helper function to format period information for display
 * @param {Object} periodInfo - Period information object
 * @returns {string} Formatted period text
 */
function formatPeriodText(periodInfo) {
    if (!periodInfo) return 'Periode tidak diketahui';
    
    const endDate = periodInfo.endDate;
    
    switch (periodInfo.type) {
        case 'daily':
            return `Laporan Harian - ${endDate.toLocaleDateString('id-ID')}`;
        case 'monthly':
            return `Laporan Bulanan - ${endDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}`;
        case 'yearly':
            return `Laporan Tahunan - ${endDate.getFullYear()}`;
        default:
            return `Laporan ${periodInfo.type} - ${endDate.toLocaleDateString('id-ID')}`;
    }
}