// Reports Module

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

function downloadCSV(reportName) {
    showAlert('Fitur download CSV dalam pengembangan', 'info');
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
