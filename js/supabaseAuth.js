/**
 * Supabase Authentication Module
 * Replaces localStorage-based authentication with Supabase Auth
 * @version 2.0.1 - Fixed initialization errors
 */

// Supabase configuration
const SUPABASE_URL = 'https://etjdnbumjdsueqdffsks.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0amRuYnVtamRzdWVxZGZmc2tzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1Njg3NTYsImV4cCI6MjA4MTE0NDc1Nn0.ETy2kWOr6XPJ26XvAfeRH8NGh3s5BzI3NGarp4pJhtc';

// Initialize Supabase client
let supabaseClient = null;

// Global variables
// Note: currentUser is declared in js/app.js
let currentSession = null;

/**
 * Ensure Supabase client is initialized
 */
function ensureSupabaseClient() {
    if (!supabaseClient && window.supabase) {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
    return supabaseClient;
}

/**
 * Initialize Supabase authentication
 */
async function initSupabaseAuth() {
    try {
        // Initialize Supabase client
        const client = ensureSupabaseClient();
        
        if (!client) {
            console.error('Supabase client not available');
            return;
        }
        
        // Get initial session
        const { data: { session }, error } = await client.auth.getSession();
        
        if (error) {
            console.error('Error getting session:', error);
            return;
        }
        
        if (session) {
            await handleAuthStateChange(session);
        }
        
        // Listen for auth state changes
        client.auth.onAuthStateChange(async (event, session) => {
            console.log('Auth state changed:', event, session);
            
            if (event === 'SIGNED_IN' && session) {
                await handleAuthStateChange(session);
            } else if (event === 'SIGNED_OUT') {
                handleSignOut();
            }
        });
        
    } catch (error) {
        console.error('Error initializing Supabase auth:', error);
    }
}

/**
 * Handle authentication state change
 */
async function handleAuthStateChange(session) {
    try {
        const client = ensureSupabaseClient();
        if (!client) return;
        
        currentSession = session;
        
        // Get user profile from database
        const { data: profile, error } = await client
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
            
        if (error) {
            console.error('Error fetching user profile:', error);
            return;
        }
        
        if (profile) {
            currentUser = {
                id: profile.id,
                username: profile.username,
                name: profile.name,
                role: profile.role,
                active: profile.active,
                email: session.user.email
            };
            
            // Update last login
            await updateLastLogin(profile.id);
            
            // Show main app if we're on login page
            if (document.getElementById('loginPage') && !document.getElementById('loginPage').classList.contains('d-none')) {
                if (typeof showMainApp === 'function') {
                    showMainApp();
                }
            }
        }
        
    } catch (error) {
        console.error('Error handling auth state change:', error);
    }
}

/**
 * Handle sign out
 */
function handleSignOut() {
    currentUser = null;
    currentSession = null;
    
    // Show login page
    if (document.getElementById('mainApp')) {
        document.getElementById('mainApp').classList.add('d-none');
    }
    if (document.getElementById('loginPage')) {
        document.getElementById('loginPage').classList.remove('d-none');
    }
}

/**
 * Sign in with email and password
 */
async function signInWithPassword(email, password) {
    try {
        const client = ensureSupabaseClient();
        if (!client) {
            throw new Error('Supabase client not available');
        }
        
        const { data, error } = await client.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) {
            throw error;
        }
        
        return { success: true, data };
        
    } catch (error) {
        console.error('Sign in error:', error);
        return { 
            success: false, 
            error: error.message || 'Login failed'
        };
    }
}

/**
 * Sign up new user
 */
async function signUpUser(email, password, userData) {
    try {
        const client = ensureSupabaseClient();
        if (!client) {
            throw new Error('Supabase client not available');
        }
        
        const { data, error } = await client.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    username: userData.username,
                    name: userData.name,
                    role: userData.role || 'anggota'
                }
            }
        });
        
        if (error) {
            throw error;
        }
        
        return { success: true, data };
        
    } catch (error) {
        console.error('Sign up error:', error);
        return { 
            success: false, 
            error: error.message || 'Registration failed'
        };
    }
}

/**
 * Sign out current user
 */
async function signOut() {
    try {
        const client = ensureSupabaseClient();
        if (!client) {
            throw new Error('Supabase client not available');
        }
        
        const { error } = await client.auth.signOut();
        
        if (error) {
            throw error;
        }
        
        return { success: true };
        
    } catch (error) {
        console.error('Sign out error:', error);
        return { 
            success: false, 
            error: error.message || 'Sign out failed'
        };
    }
}

/**
 * Update user password
 */
async function updatePassword(newPassword) {
    try {
        const client = ensureSupabaseClient();
        if (!client) {
            throw new Error('Supabase client not available');
        }
        
        const { data, error } = await client.auth.updateUser({
            password: newPassword
        });
        
        if (error) {
            throw error;
        }
        
        // Update password changed timestamp
        if (currentUser) {
            await client
                .from('profiles')
                .update({ password_changed_at: new Date().toISOString() })
                .eq('id', currentUser.id);
        }
        
        return { success: true, data };
        
    } catch (error) {
        console.error('Update password error:', error);
        return { 
            success: false, 
            error: error.message || 'Password update failed'
        };
    }
}

/**
 * Update user profile
 */
async function updateProfile(profileData) {
    try {
        const client = ensureSupabaseClient();
        if (!client) {
            throw new Error('Supabase client not available');
        }
        
        if (!currentUser) {
            throw new Error('No authenticated user');
        }
        
        const { data, error } = await client
            .from('profiles')
            .update({
                ...profileData,
                updated_at: new Date().toISOString()
            })
            .eq('id', currentUser.id)
            .select()
            .single();
            
        if (error) {
            throw error;
        }
        
        // Update current user object
        Object.assign(currentUser, data);
        
        return { success: true, data };
        
    } catch (error) {
        console.error('Update profile error:', error);
        return { 
            success: false, 
            error: error.message || 'Profile update failed'
        };
    }
}

/**
 * Get all users (admin only)
 */
async function getAllUsers() {
    try {
        const client = ensureSupabaseClient();
        if (!client) {
            throw new Error('Supabase client not available');
        }
        
        if (!currentUser || !['super_admin', 'administrator'].includes(currentUser.role)) {
            throw new Error('Insufficient permissions');
        }
        
        const { data, error } = await client
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });
            
        if (error) {
            throw error;
        }
        
        return { success: true, data };
        
    } catch (error) {
        console.error('Get users error:', error);
        return { 
            success: false, 
            error: error.message || 'Failed to fetch users'
        };
    }
}

/**
 * Create new user (admin only)
 */
async function createUser(userData) {
    try {
        const client = ensureSupabaseClient();
        if (!client) {
            throw new Error('Supabase client not available');
        }
        
        if (!currentUser || !['super_admin', 'administrator'].includes(currentUser.role)) {
            throw new Error('Insufficient permissions');
        }
        
        // Create auth user
        const { data: authData, error: authError } = await client.auth.admin.createUser({
            email: userData.email,
            password: userData.password,
            user_metadata: {
                username: userData.username,
                name: userData.name,
                role: userData.role
            }
        });
        
        if (authError) {
            throw authError;
        }
        
        return { success: true, data: authData };
        
    } catch (error) {
        console.error('Create user error:', error);
        return { 
            success: false, 
            error: error.message || 'Failed to create user'
        };
    }
}

/**
 * Update user (admin only)
 */
async function updateUser(userId, userData) {
    try {
        const client = ensureSupabaseClient();
        if (!client) {
            throw new Error('Supabase client not available');
        }
        
        if (!currentUser || !['super_admin', 'administrator'].includes(currentUser.role)) {
            throw new Error('Insufficient permissions');
        }
        
        const { data, error } = await client
            .from('profiles')
            .update({
                ...userData,
                updated_at: new Date().toISOString()
            })
            .eq('id', userId)
            .select()
            .single();
            
        if (error) {
            throw error;
        }
        
        return { success: true, data };
        
    } catch (error) {
        console.error('Update user error:', error);
        return { 
            success: false, 
            error: error.message || 'Failed to update user'
        };
    }
}

/**
 * Delete user (admin only)
 */
async function deleteUser(userId) {
    try {
        const client = ensureSupabaseClient();
        if (!client) {
            throw new Error('Supabase client not available');
        }
        
        if (!currentUser || !['super_admin', 'administrator'].includes(currentUser.role)) {
            throw new Error('Insufficient permissions');
        }
        
        // Delete from auth.users (will cascade to profiles)
        const { error } = await client.auth.admin.deleteUser(userId);
        
        if (error) {
            throw error;
        }
        
        return { success: true };
        
    } catch (error) {
        console.error('Delete user error:', error);
        return { 
            success: false, 
            error: error.message || 'Failed to delete user'
        };
    }
}

/**
 * Update last login timestamp
 */
async function updateLastLogin(userId) {
    try {
        const client = ensureSupabaseClient();
        if (!client) return;
        
        await client
            .from('profiles')
            .update({ last_login: new Date().toISOString() })
            .eq('id', userId);
    } catch (error) {
        console.error('Error updating last login:', error);
    }
}

/**
 * Record login attempt for rate limiting
 */
async function recordLoginAttempt(username, success, ipAddress = null) {
    try {
        const client = ensureSupabaseClient();
        if (!client) return;
        
        await client
            .from('login_attempts')
            .insert({
                username: username,
                success: success,
                ip_address: ipAddress,
                attempted_at: new Date().toISOString()
            });
    } catch (error) {
        console.error('Error recording login attempt:', error);
    }
}

/**
 * Check rate limiting for login attempts
 */
async function checkRateLimit(username) {
    try {
        const client = ensureSupabaseClient();
        if (!client) return false;
        
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
        
        const { data, error } = await client
            .from('login_attempts')
            .select('*')
            .eq('username', username)
            .eq('success', false)
            .gte('attempted_at', fiveMinutesAgo);
            
        if (error) {
            console.error('Error checking rate limit:', error);
            return false;
        }
        
        return data.length >= 5; // Rate limited if 5 or more failed attempts
        
    } catch (error) {
        console.error('Error checking rate limit:', error);
        return false;
    }
}

/**
 * Handle login form submission
 */
async function handleLogin() {
    try {
        const usernameInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');
        const errorDiv = document.getElementById('loginError');
        
        if (!usernameInput || !passwordInput || !errorDiv) {
            console.error('Required form elements not found');
            return;
        }
        
        const username = usernameInput.value.trim();
        const password = passwordInput.value;
        
        // Clear previous errors
        errorDiv.classList.add('d-none');
        
        // Input validation
        if (!username || !password) {
            showLoginError('Username dan password harus diisi!');
            return;
        }
        
        // Check rate limiting
        const isRateLimited = await checkRateLimit(username);
        if (isRateLimited) {
            showLoginError('Terlalu banyak percobaan login. Coba lagi dalam 5 menit.');
            return;
        }
        
        // For migration period, try to find user by username first
        // In production, you would use email directly
        const email = username.includes('@') ? username : `${username}@koperasi.local`;
        
        // Attempt sign in
        const result = await signInWithPassword(email, password);
        
        if (result.success) {
            // Record successful login
            await recordLoginAttempt(username, true);
        } else {
            // Record failed login
            await recordLoginAttempt(username, false);
            showLoginError('Username atau password salah!');
        }
        
    } catch (error) {
        console.error('Login error:', error);
        showLoginError('Terjadi kesalahan sistem. Silakan coba lagi.');
    }
}

/**
 * Handle logout
 */
async function handleLogout() {
    try {
        const result = await signOut();
        
        if (result.success) {
            // Redirect to login page
            window.location.reload();
        } else {
            console.error('Logout failed:', result.error);
        }
        
    } catch (error) {
        console.error('Logout error:', error);
    }
}

/**
 * Show login error message
 */
function showLoginError(message) {
    const errorDiv = document.getElementById('loginError');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.classList.remove('d-none');
    }
}

/**
 * Check if user has permission for specific role
 */
function hasPermission(requiredRole) {
    if (!currentUser) return false;
    
    const roleHierarchy = {
        'anggota': 1,
        'kasir': 2,
        'keuangan': 3,
        'administrator': 4,
        'super_admin': 5
    };
    
    const userLevel = roleHierarchy[currentUser.role] || 0;
    const requiredLevel = roleHierarchy[requiredRole] || 0;
    
    return userLevel >= requiredLevel;
}

/**
 * Get current user
 */
function getCurrentUser() {
    return currentUser;
}

/**
 * Get current session
 */
function getCurrentSession() {
    return currentSession;
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Wait for supabaseClient to be available
    setTimeout(() => {
        initSupabaseAuth();
    }, 100);
    
    // Attach login form handler
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleLogin();
        });
    }
});

// Export functions for global use
window.supabaseAuth = {
    signInWithPassword,
    signUpUser,
    signOut,
    updatePassword,
    updateProfile,
    getAllUsers,
    createUser,
    updateUser,
    deleteUser,
    getCurrentUser,
    getCurrentSession,
    hasPermission,
    handleLogin,
    handleLogout
};