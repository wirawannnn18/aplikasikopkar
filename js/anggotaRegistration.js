/**
 * Anggota Registration Module
 * Handles member registration with Supabase authentication integration
 * @version 1.0.0
 */

/**
 * Render halaman registrasi anggota
 */
function renderAnggotaRegistration() {
    const content = document.getElementById('mainContent');
    
    content.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2 style="color: #2d6a4f; font-weight: 700;">
                <i class="bi bi-person-plus-fill me-2"></i>Registrasi Anggota Baru
            </h2>
        </div>
        
        <div class="row justify-content-center">
            <div class="col-lg-8">
                <div class="card shadow">
                    <div class="card-header" style="background: linear-gradient(135deg, #2d6a4f 0%, #52b788 100%); color: white;">
                        <h5 class="mb-0">
                            <i class="bi bi-clipboard-check me-2"></i>Form Pendaftaran Anggota
                        </h5>
                    </div>
                    <div class="card-body p-4">
                        <form id="anggotaRegistrationForm">
                            <!-- Informasi Akun -->
                            <h6 class="mb-3" style="color: #2d6a4f; border-bottom: 2px solid #52b788; padding-bottom: 8px;">
                                <i class="bi bi-shield-lock me-2"></i>Informasi Akun
                            </h6>
                            
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">
                                        <i class="bi bi-person me-1"></i>Username <span class="text-danger">*</span>
                                    </label>
                                    <input type="text" class="form-control" id="regUsername" required>
                                    <small class="text-muted">Username untuk login ke sistem</small>
                                </div>
                                
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">
                                        <i class="bi bi-envelope me-1"></i>Email <span class="text-danger">*</span>
                                    </label>
                                    <input type="email" class="form-control" id="regEmail" required>
                                    <small class="text-muted">Email aktif untuk notifikasi</small>
                                </div>
                            </div>
                            
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">
                                        <i class="bi bi-lock me-1"></i>Password <span class="text-danger">*</span>
                                    </label>
                                    <div class="input-group">
                                        <input type="password" class="form-control" id="regPassword" required>
                                        <button class="btn btn-outline-secondary" type="button" onclick="togglePasswordVisibility('regPassword', 'toggleRegPassword')">
                                            <i class="bi bi-eye" id="toggleRegPassword"></i>
                                        </button>
                                    </div>
                                    <div id="regPasswordStrength" class="mt-2"></div>
                                </div>
                                
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">
                                        <i class="bi bi-lock-fill me-1"></i>Konfirmasi Password <span class="text-danger">*</span>
                                    </label>
                                    <div class="input-group">
                                        <input type="password" class="form-control" id="regPasswordConfirm" required>
                                        <button class="btn btn-outline-secondary" type="button" onclick="togglePasswordVisibility('regPasswordConfirm', 'toggleRegPasswordConfirm')">
                                            <i class="bi bi-eye" id="toggleRegPasswordConfirm"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Informasi Pribadi -->
                            <h6 class="mb-3 mt-4" style="color: #2d6a4f; border-bottom: 2px solid #52b788; padding-bottom: 8px;">
                                <i class="bi bi-person-badge me-2"></i>Informasi Pribadi
                            </h6>
                            
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">
                                        <i class="bi bi-person-fill me-1"></i>Nama Lengkap <span class="text-danger">*</span>
                                    </label>
                                    <input type="text" class="form-control" id="regNama" required>
                                </div>
                                
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">
                                        <i class="bi bi-credit-card me-1"></i>NIK <span class="text-danger">*</span>
                                    </label>
                                    <input type="text" class="form-control" id="regNIK" required maxlength="16" pattern="[0-9]{16}">
                                    <small class="text-muted">16 digit NIK KTP</small>
                                </div>
                            </div>
                            
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">
                                        <i class="bi bi-telephone me-1"></i>No. Telepon <span class="text-danger">*</span>
                                    </label>
                                    <input type="tel" class="form-control" id="regTelepon" required>
                                </div>
                                
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">
                                        <i class="bi bi-building me-1"></i>Departemen <span class="text-danger">*</span>
                                    </label>
                                    <select class="form-select" id="regDepartemen" required>
                                        <option value="">Pilih Departemen</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div class="mb-3">
                                <label class="form-label">
                                    <i class="bi bi-geo-alt me-1"></i>Alamat <span class="text-danger">*</span>
                                </label>
                                <textarea class="form-control" id="regAlamat" rows="3" required></textarea>
                            </div>
                            
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">
                                        <i class="bi bi-calendar me-1"></i>Tanggal Lahir <span class="text-danger">*</span>
                                    </label>
                                    <input type="date" class="form-control" id="regTanggalLahir" required>
                                </div>
                                
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">
                                        <i class="bi bi-calendar-check me-1"></i>Tanggal Bergabung <span class="text-danger">*</span>
                                    </label>
                                    <input type="date" class="form-control" id="regTanggalBergabung" required value="${new Date().toISOString().split('T')[0]}">
                                </div>
                            </div>
                            
                            <!-- Persetujuan -->
                            <div class="mb-4 mt-4">
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" id="regAgree" required>
                                    <label class="form-check-label" for="regAgree">
                                        Saya menyetujui <a href="#" onclick="showTermsAndConditions(); return false;">syarat dan ketentuan</a> keanggotaan koperasi
                                    </label>
                                </div>
                            </div>
                            
                            <div class="d-grid gap-2">
                                <button type="submit" class="btn btn-primary btn-lg">
                                    <i class="bi bi-check-circle me-2"></i>Daftar Sebagai Anggota
                                </button>
                                <button type="button" class="btn btn-outline-secondary" onclick="navigateTo('dashboard')">
                                    <i class="bi bi-x-circle me-2"></i>Batal
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Load departemen list
    loadDepartemenOptions();
    
    // Setup password strength indicator
    initializePasswordStrengthIndicator('regPassword', 'regPasswordStrength');
    
    // Setup form submission
    document.getElementById('anggotaRegistrationForm').addEventListener('submit', handleAnggotaRegistration);
}

/**
 * Load departemen options into select dropdown
 */
function loadDepartemenOptions() {
    try {
        const departemen = JSON.parse(localStorage.getItem('departemen') || '[]');
        const select = document.getElementById('regDepartemen');
        
        if (!select) return;
        
        select.innerHTML = '<option value="">Pilih Departemen</option>';
        
        departemen.forEach(dept => {
            const option = document.createElement('option');
            option.value = dept.id;
            option.textContent = dept.nama;
            select.appendChild(option);
        });
        
        if (departemen.length === 0) {
            select.innerHTML += '<option value="" disabled>Belum ada departemen</option>';
        }
    } catch (error) {
        console.error('Error loading departemen:', error);
    }
}

/**
 * Toggle password visibility
 */
function togglePasswordVisibility(inputId, iconId) {
    const input = document.getElementById(inputId);
    const icon = document.getElementById(iconId);
    
    if (!input || !icon) return;
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('bi-eye');
        icon.classList.add('bi-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('bi-eye-slash');
        icon.classList.add('bi-eye');
    }
}

/**
 * Show terms and conditions modal
 */
function showTermsAndConditions() {
    const modalHtml = `
        <div class="modal fade" id="termsModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="bi bi-file-text me-2"></i>Syarat dan Ketentuan Keanggotaan
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <h6>1. Keanggotaan</h6>
                        <p>Dengan mendaftar sebagai anggota koperasi, Anda menyetujui untuk:</p>
                        <ul>
                            <li>Membayar simpanan pokok sesuai ketentuan yang berlaku</li>
                            <li>Membayar simpanan wajib secara rutin setiap bulan</li>
                            <li>Mematuhi Anggaran Dasar dan Anggaran Rumah Tangga koperasi</li>
                        </ul>
                        
                        <h6>2. Hak Anggota</h6>
                        <ul>
                            <li>Menghadiri dan memberikan suara dalam Rapat Anggota</li>
                            <li>Memilih dan dipilih menjadi pengurus koperasi</li>
                            <li>Mendapatkan pelayanan yang sama dari koperasi</li>
                            <li>Mendapatkan keterangan mengenai perkembangan koperasi</li>
                        </ul>
                        
                        <h6>3. Kewajiban Anggota</h6>
                        <ul>
                            <li>Mematuhi Anggaran Dasar, Anggaran Rumah Tangga, dan Keputusan Rapat Anggota</li>
                            <li>Berpartisipasi dalam kegiatan usaha yang diselenggarakan koperasi</li>
                            <li>Mengembangkan dan memelihara kebersamaan berdasarkan asas kekeluargaan</li>
                        </ul>
                        
                        <h6>4. Privasi Data</h6>
                        <p>Data pribadi Anda akan dijaga kerahasiaannya dan hanya digunakan untuk keperluan administrasi koperasi.</p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Tutup</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    const existingModal = document.getElementById('termsModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('termsModal'));
    modal.show();
}

/**
 * Handle anggota registration form submission
 */
async function handleAnggotaRegistration(e) {
    e.preventDefault();
    
    try {
        // Get form values
        const username = document.getElementById('regUsername').value.trim();
        const email = document.getElementById('regEmail').value.trim();
        const password = document.getElementById('regPassword').value;
        const passwordConfirm = document.getElementById('regPasswordConfirm').value;
        const nama = document.getElementById('regNama').value.trim();
        const nik = document.getElementById('regNIK').value.trim();
        const telepon = document.getElementById('regTelepon').value.trim();
        const departemenId = document.getElementById('regDepartemen').value;
        const alamat = document.getElementById('regAlamat').value.trim();
        const tanggalLahir = document.getElementById('regTanggalLahir').value;
        const tanggalBergabung = document.getElementById('regTanggalBergabung').value;
        const agree = document.getElementById('regAgree').checked;
        
        // Validation
        if (!agree) {
            showAlert('Anda harus menyetujui syarat dan ketentuan!', 'warning');
            return;
        }
        
        if (password !== passwordConfirm) {
            showAlert('Password dan konfirmasi password tidak cocok!', 'warning');
            return;
        }
        
        // Validate password strength
        if (typeof validatePasswordStrength === 'function') {
            const passwordValidation = validatePasswordStrength(password);
            if (!passwordValidation.isValid) {
                showAlert('Password tidak memenuhi persyaratan keamanan: ' + passwordValidation.feedback.join(', '), 'warning');
                return;
            }
        }
        
        // Validate NIK
        if (nik.length !== 16 || !/^\d+$/.test(nik)) {
            showAlert('NIK harus 16 digit angka!', 'warning');
            return;
        }
        
        // Check if username already exists in localStorage
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        if (users.some(u => u.username === username)) {
            showAlert('Username sudah digunakan!', 'warning');
            return;
        }
        
        // Check if NIK already exists
        const anggotaList = JSON.parse(localStorage.getItem('anggota') || '[]');
        if (anggotaList.some(a => a.nik === nik)) {
            showAlert('NIK sudah terdaftar!', 'warning');
            return;
        }
        
        // Show loading
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Mendaftar...';
        
        // Register to Supabase Auth
        let supabaseResult = null;
        if (typeof signUpUser === 'function') {
            supabaseResult = await signUpUser(email, password, {
                username: username,
                name: nama,
                role: 'anggota'
            });
            
            if (!supabaseResult.success) {
                throw new Error(supabaseResult.error || 'Registrasi ke Supabase gagal');
            }
        }
        
        // Generate member ID
        const newAnggotaId = anggotaList.length > 0 ? Math.max(...anggotaList.map(a => a.id)) + 1 : 1;
        const kodeAnggota = generateKodeAnggota(newAnggotaId);
        
        // Create anggota data
        const newAnggota = {
            id: newAnggotaId,
            kode: kodeAnggota,
            nama: nama,
            nik: nik,
            alamat: alamat,
            telepon: telepon,
            email: email,
            tanggalLahir: tanggalLahir,
            tanggalBergabung: tanggalBergabung,
            departemenId: parseInt(departemenId),
            status: 'Aktif',
            statusKeanggotaan: 'Aktif',
            simpananPokok: 0,
            simpananWajib: 0,
            simpananSukarela: 0,
            totalPinjaman: 0,
            createdAt: new Date().toISOString(),
            supabaseUserId: supabaseResult?.data?.user?.id || null
        };
        
        // Save to localStorage
        anggotaList.push(newAnggota);
        localStorage.setItem('anggota', JSON.stringify(anggotaList));
        
        // Also create user account in localStorage for backward compatibility
        const hashedPassword = typeof hashPassword === 'function' ? hashPassword(password) : password;
        const newUserId = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;
        
        users.push({
            id: newUserId,
            username: username,
            password: hashedPassword,
            name: nama,
            role: 'anggota',
            active: true,
            anggotaId: newAnggotaId,
            createdAt: new Date().toISOString(),
            passwordChangedAt: new Date().toISOString(),
            passwordHistory: []
        });
        
        localStorage.setItem('users', JSON.stringify(users));
        
        // Log audit
        if (typeof logAudit === 'function') {
            logAudit('CREATE', 'ANGGOTA', newAnggotaId, {
                action: 'Registrasi anggota baru',
                kode: kodeAnggota,
                nama: nama
            });
        }
        
        // Show success message
        showAlert('Registrasi berhasil! Selamat datang di Koperasi Karyawan.', 'success');
        
        // Reset form
        document.getElementById('anggotaRegistrationForm').reset();
        
        // Navigate to dashboard or login
        setTimeout(() => {
            if (currentUser && ['super_admin', 'administrator'].includes(currentUser.role)) {
                navigateTo('anggota');
            } else {
                navigateTo('dashboard');
            }
        }, 2000);
        
    } catch (error) {
        console.error('Error during registration:', error);
        showAlert('Terjadi kesalahan saat registrasi: ' + error.message, 'danger');
        
        // Restore button
        const submitBtn = e.target.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="bi bi-check-circle me-2"></i>Daftar Sebagai Anggota';
        }
    }
}

/**
 * Generate kode anggota
 */
function generateKodeAnggota(id) {
    const year = new Date().getFullYear().toString().slice(-2);
    const paddedId = id.toString().padStart(4, '0');
    return `AGT-${year}${paddedId}`;
}

/**
 * Setup password strength indicator
 */
function initializePasswordStrengthIndicator(inputId, containerId) {
    const passwordInput = document.getElementById(inputId);
    if (!passwordInput) return;
    
    passwordInput.addEventListener('input', function() {
        const password = this.value;
        
        if (typeof validatePasswordStrength === 'function') {
            const validation = validatePasswordStrength(password);
            showPasswordStrengthIndicator(password, containerId, validation);
        }
    });
}

// Alias for backward compatibility
function setupPasswordStrengthIndicator(inputId, containerId) {
    return initializePasswordStrengthIndicator(inputId, containerId);
}

/**
 * Show password strength indicator
 */
function showPasswordStrengthIndicator(password, containerId, validation) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    if (!password) {
        container.innerHTML = '';
        return;
    }
    
    // Strength colors
    const strengthColors = {
        'very-weak': '#dc3545',
        'weak': '#fd7e14',
        'medium': '#ffc107',
        'strong': '#28a745',
        'very-strong': '#20c997'
    };
    
    const strengthWidth = (validation.score / 100) * 100;
    const strengthColor = strengthColors[validation.strength] || '#6c757d';
    
    let html = `
        <div class="password-strength-container">
            <div class="d-flex justify-content-between align-items-center mb-1">
                <small class="text-muted">Kekuatan Password:</small>
                <small class="fw-bold" style="color: ${strengthColor}">${validation.strengthText}</small>
            </div>
            <div class="progress" style="height: 6px;">
                <div class="progress-bar" 
                     style="width: ${strengthWidth}%; background-color: ${strengthColor};"
                     role="progressbar"></div>
            </div>
    `;
    
    if (validation.feedback && validation.feedback.length > 0) {
        html += `
            <div class="mt-2">
                <small class="text-muted d-block mb-1">Persyaratan:</small>
                <ul class="list-unstyled mb-0" style="font-size: 0.75rem;">
        `;
        
        validation.feedback.forEach(feedback => {
            html += `<li class="text-danger"><i class="bi bi-x-circle me-1"></i>${feedback}</li>`;
        });
        
        html += `</ul></div>`;
    } else {
        html += `<small class="text-success mt-1 d-block"><i class="bi bi-check-circle me-1"></i>Semua persyaratan terpenuhi</small>`;
    }
    
    html += `</div>`;
    
    container.innerHTML = html;
}
