/**
 * Authentication Migration Script
 * Migrates users from localStorage to Supabase Auth
 * Fixed version - uses proper Supabase client initialization
 */

// Initialize Supabase client
let supabaseClient = null;

// Supabase configuration
const SUPABASE_URL = 'https://etjdnbumjdsueqdffsks.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0amRuYnVtamRzdWVxZGZmc2tzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1Njg3NTYsImV4cCI6MjA4MTE0NDc1Nn0.ETy2kWOr6XPJ26XvAfeRH8NGh3s5BzI3NGarp4pJhtc';

/**
 * Initialize Supabase client
 */
function initializeSupabase() {
    if (!supabaseClient && window.supabase && window.supabase.createClient) {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('Supabase client initialized');
    }
    return supabaseClient;
}

/**
 * Migrate existing users from localStorage to Supabase
 */
async function migrateUsersToSupabase() {
    try {
        console.log('Starting user migration to Supabase...');
        
        // Initialize Supabase client
        const client = initializeSupabase();
        if (!client) {
            throw new Error('Failed to initialize Supabase client');
        }
        
        // Get existing users from localStorage
        const existingUsers = JSON.parse(localStorage.getItem('users') || '[]');
        
        if (existingUsers.length === 0) {
            console.log('No users found in localStorage to migrate');
            return { success: true, message: 'No users to migrate' };
        }
        
        console.log(`Found ${existingUsers.length} users to migrate`);
        
        const migrationResults = [];
        
        for (const user of existingUsers) {
            try {
                // Create email from username if not exists
                const email = user.email || `${user.username}@koperasi.local`;
                
                // Generate a temporary password for migration
                const tempPassword = 'TempPass123!'; // Users will need to reset this
                
                console.log(`Migrating user: ${user.username} (${email})`);
                
                // Sign up user (this creates both auth.users and profiles entry)
                const { data, error } = await client.auth.signUp({
                    email: email,
                    password: tempPassword,
                    options: {
                        data: {
                            username: user.username,
                            name: user.name,
                            role: user.role || 'anggota'
                        }
                    }
                });
                
                if (error) {
                    console.error(`Failed to migrate user ${user.username}:`, error);
                    migrationResults.push({
                        username: user.username,
                        success: false,
                        error: error.message
                    });
                    continue;
                }
                
                // Update profile with additional data if user was created
                if (data.user) {
                    const { error: profileError } = await client
                        .from('profiles')
                        .update({
                            active: user.active !== false,
                            last_login: user.lastLogin || null,
                            password_changed_at: user.passwordChangedAt || new Date().toISOString()
                        })
                        .eq('id', data.user.id);
                    
                    if (profileError) {
                        console.warn(`Profile update warning for ${user.username}:`, profileError);
                    }
                }
                
                migrationResults.push({
                    username: user.username,
                    email: email,
                    success: true,
                    userId: data.user?.id,
                    tempPassword: tempPassword
                });
                
                console.log(`Successfully migrated user: ${user.username}`);
                
            } catch (userError) {
                console.error(`Error migrating user ${user.username}:`, userError);
                migrationResults.push({
                    username: user.username,
                    success: false,
                    error: userError.message
                });
            }
        }
        
        // Save migration results
        localStorage.setItem('migration_results', JSON.stringify(migrationResults));
        
        // Backup original users data
        localStorage.setItem('users_backup', JSON.stringify(existingUsers));
        
        const successCount = migrationResults.filter(r => r.success).length;
        const failCount = migrationResults.filter(r => !r.success).length;
        
        console.log(`Migration completed: ${successCount} successful, ${failCount} failed`);
        
        return {
            success: true,
            message: `Migration completed: ${successCount} users migrated successfully, ${failCount} failed`,
            results: migrationResults
        };
        
    } catch (error) {
        console.error('Migration error:', error);
        return {
            success: false,
            error: error.message || 'Migration failed'
        };
    }
}

/**
 * Create default super admin user if none exists
 */
async function createDefaultSuperAdmin() {
    try {
        console.log('Checking for super admin user...');
        
        // Initialize Supabase client
        const client = initializeSupabase();
        if (!client) {
            throw new Error('Failed to initialize Supabase client');
        }
        
        // Check if super admin already exists
        const { data: existingAdmin, error } = await client
            .from('profiles')
            .select('*')
            .eq('role', 'super_admin')
            .limit(1);
            
        if (error) {
            console.error('Error checking for super admin:', error);
            return { success: false, error: error.message };
        }
        
        if (existingAdmin && existingAdmin.length > 0) {
            console.log('Super admin already exists');
            return { success: true, message: 'Super admin already exists' };
        }
        
        // Create default super admin
        const defaultAdmin = {
            email: 'admin@koperasi.local',
            password: 'Admin123!',
            username: 'admin',
            name: 'Super Administrator',
            role: 'super_admin'
        };
        
        console.log('Creating default super admin...');
        
        // Sign up admin user
        const { data, error: createError } = await client.auth.signUp({
            email: defaultAdmin.email,
            password: defaultAdmin.password,
            options: {
                data: {
                    username: defaultAdmin.username,
                    name: defaultAdmin.name,
                    role: defaultAdmin.role
                }
            }
        });
        
        if (createError) {
            console.error('Failed to create super admin:', createError);
            return { success: false, error: createError.message };
        }
        
        console.log('Default super admin created successfully');
        
        return {
            success: true,
            message: 'Default super admin created',
            credentials: {
                email: defaultAdmin.email,
                password: defaultAdmin.password,
                username: defaultAdmin.username
            }
        };
        
    } catch (error) {
        console.error('Error creating default super admin:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Show migration UI
 */
function showMigrationUI() {
    const modalHTML = `
        <div class="modal fade" id="migrationModal" tabindex="-1" data-bs-backdrop="static">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header bg-primary text-white">
                        <h5 class="modal-title">
                            <i class="bi bi-arrow-up-circle me-2"></i>Migrasi ke Supabase Auth
                        </h5>
                    </div>
                    <div class="modal-body">
                        <div class="alert alert-info">
                            <i class="bi bi-info-circle me-2"></i>
                            <strong>Migrasi Sistem Autentikasi</strong><br>
                            Sistem akan dimigrasi dari localStorage ke Supabase Auth untuk keamanan yang lebih baik.
                        </div>
                        
                        <div id="migrationStatus">
                            <div class="text-center">
                                <i class="bi bi-database" style="font-size: 3rem; color: #0d6efd;"></i>
                                <h5 class="mt-3">Siap untuk Migrasi</h5>
                                <p class="text-muted">Klik tombol di bawah untuk memulai proses migrasi</p>
                            </div>
                        </div>
                        
                        <div id="migrationProgress" class="d-none">
                            <div class="text-center mb-3">
                                <div class="spinner-border text-primary" role="status">
                                    <span class="visually-hidden">Loading...</span>
                                </div>
                            </div>
                            <div class="progress">
                                <div class="progress-bar progress-bar-striped progress-bar-animated" 
                                     role="progressbar" style="width: 0%"></div>
                            </div>
                            <p class="text-center mt-2 mb-0">Sedang memproses migrasi...</p>
                        </div>
                        
                        <div id="migrationResults" class="d-none">
                            <!-- Results will be populated here -->
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-primary" id="startMigrationBtn" onclick="startMigration()">
                            <i class="bi bi-play-circle me-1"></i>Mulai Migrasi
                        </button>
                        <button type="button" class="btn btn-success d-none" id="completeMigrationBtn" onclick="completeMigration()">
                            <i class="bi bi-check-circle me-1"></i>Selesai
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal
    const existingModal = document.getElementById('migrationModal');
    if (existingModal) existingModal.remove();
    
    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('migrationModal'));
    modal.show();
}

/**
 * Start migration process
 */
async function startMigration() {
    const statusDiv = document.getElementById('migrationStatus');
    const progressDiv = document.getElementById('migrationProgress');
    const resultsDiv = document.getElementById('migrationResults');
    const startBtn = document.getElementById('startMigrationBtn');
    const completeBtn = document.getElementById('completeMigrationBtn');
    
    // Hide status, show progress
    statusDiv.classList.add('d-none');
    progressDiv.classList.remove('d-none');
    startBtn.disabled = true;
    
    try {
        // Update progress
        updateProgress(25, 'Membuat super admin default...');
        
        // Create default super admin
        const adminResult = await createDefaultSuperAdmin();
        
        // Update progress
        updateProgress(50, 'Memulai migrasi user...');
        
        // Migrate existing users
        const migrationResult = await migrateUsersToSupabase();
        
        // Update progress
        updateProgress(100, 'Migrasi selesai!');
        
        // Show results
        setTimeout(() => {
            progressDiv.classList.add('d-none');
            resultsDiv.classList.remove('d-none');
            
            let resultsHTML = '<div class="alert alert-success"><i class="bi bi-check-circle me-2"></i><strong>Migrasi Berhasil!</strong></div>';
            
            if (adminResult.success && adminResult.credentials) {
                resultsHTML += `
                    <div class="alert alert-warning">
                        <h6><i class="bi bi-key me-2"></i>Kredensial Super Admin:</h6>
                        <p class="mb-1"><strong>Email:</strong> ${adminResult.credentials.email}</p>
                        <p class="mb-1"><strong>Username:</strong> ${adminResult.credentials.username}</p>
                        <p class="mb-0"><strong>Password:</strong> ${adminResult.credentials.password}</p>
                        <small class="text-muted">Silakan catat kredensial ini dan ganti password setelah login.</small>
                    </div>
                `;
            }
            
            if (migrationResult.success && migrationResult.results) {
                const successCount = migrationResult.results.filter(r => r.success).length;
                const failCount = migrationResult.results.filter(r => !r.success).length;
                
                resultsHTML += `
                    <div class="alert alert-info">
                        <h6><i class="bi bi-people me-2"></i>Hasil Migrasi User:</h6>
                        <p class="mb-1"><strong>Berhasil:</strong> ${successCount} user</p>
                        <p class="mb-0"><strong>Gagal:</strong> ${failCount} user</p>
                    </div>
                `;
                
                if (successCount > 0) {
                    resultsHTML += `
                        <div class="alert alert-warning">
                            <h6><i class="bi bi-exclamation-triangle me-2"></i>Password Sementara:</h6>
                            <p class="mb-0">Semua user yang berhasil dimigrasi menggunakan password sementara: <strong>TempPass123!</strong></p>
                            <small class="text-muted">User harus mengganti password saat login pertama kali.</small>
                        </div>
                    `;
                }
            }
            
            resultsDiv.innerHTML = resultsHTML;
            completeBtn.classList.remove('d-none');
        }, 1000);
        
    } catch (error) {
        console.error('Migration error:', error);
        
        progressDiv.classList.add('d-none');
        resultsDiv.classList.remove('d-none');
        resultsDiv.innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle me-2"></i>
                <strong>Migrasi Gagal:</strong> ${error.message}
            </div>
        `;
        completeBtn.classList.remove('d-none');
    }
}

/**
 * Update migration progress
 */
function updateProgress(percent, message) {
    const progressBar = document.querySelector('#migrationProgress .progress-bar');
    const progressText = document.querySelector('#migrationProgress p');
    
    if (progressBar) {
        progressBar.style.width = `${percent}%`;
    }
    
    if (progressText) {
        progressText.textContent = message;
    }
}

/**
 * Complete migration and reload page
 */
function completeMigration() {
    // Mark migration as completed
    localStorage.setItem('migration_completed', 'true');
    
    // Reload page to use new auth system
    window.location.reload();
}

/**
 * Check if migration is needed
 */
function checkMigrationNeeded() {
    const migrationCompleted = localStorage.getItem('migration_completed');
    const existingUsers = JSON.parse(localStorage.getItem('users') || '[]');
    
    return !migrationCompleted && existingUsers.length > 0;
}

// Auto-show migration UI if needed
document.addEventListener('DOMContentLoaded', function() {
    // Wait a bit for other scripts to load
    setTimeout(() => {
        if (checkMigrationNeeded()) {
            showMigrationUI();
        }
    }, 1000);
});

// Export functions
window.authMigration = {
    migrateUsersToSupabase,
    createDefaultSuperAdmin,
    showMigrationUI,
    checkMigrationNeeded
};