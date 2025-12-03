# Design Document - Level Super Admin

## Overview

Fitur Level Super Admin menambahkan hierarki akses tertinggi pada aplikasi koperasi. Super Admin memiliki semua hak akses Administrator ditambah kemampuan khusus untuk mengelola user Administrator dan mengakses fitur-fitur sistem tingkat lanjut. Implementasi ini memastikan kontrol penuh sistem tetap berada di tangan pemilik atau pengelola utama koperasi, sambil mempertahankan keamanan dan hierarki akses yang jelas.

Fitur ini akan diintegrasikan ke dalam sistem autentikasi yang ada (js/auth.js), sistem inisialisasi (js/app.js), dan tampilan HTML (index.html) tanpa mengubah fungsionalitas yang sudah ada untuk role lainnya.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     User Interface Layer                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Login Page   │  │ Navigation   │  │ User Mgmt UI │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Authentication Layer                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Login Handler│  │ Role Checker │  │ Permission   │      │
│  │              │  │              │  │ Validator    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Business Logic Layer                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ User Manager │  │ Menu Builder │  │ System       │      │
│  │              │  │              │  │ Settings     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Data Storage Layer                      │
│                    (LocalStorage)                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ users        │  │ currentUser  │  │ systemConfig │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### Component Interaction Flow

```
User Login → Authentication → Role Validation → Menu Rendering → Feature Access
     │              │                │                  │              │
     │              │                │                  │              │
     ▼              ▼                ▼                  ▼              ▼
[Credentials] [Check Role]  [Super Admin?]    [Build Menu]   [Check Permission]
                                   │                                   │
                                   ├─ Yes → Full Access               │
                                   └─ No  → Limited Access            │
```

## Components and Interfaces

### 1. Authentication Module (js/auth.js)

#### Modified Functions

**handleLogin()**
- Validates user credentials
- Checks user active status
- Sets currentUser with role information
- Redirects to main app

**renderMenu()**
- Builds navigation menu based on user role
- Adds "Pengaturan Sistem" menu for Super Admin
- Filters menu items by role permissions

**getRoleName(role)**
- Returns display name for role
- Adds mapping for 'super_admin' → 'Super Admin'

**getRoleBadgeClass(role)**
- Returns Bootstrap badge class for role
- Adds 'bg-dark' class for Super Admin

#### New Functions

**isSuperAdmin()**
```javascript
function isSuperAdmin() {
    return currentUser && currentUser.role === 'super_admin';
}
```

**canManageAdmins()**
```javascript
function canManageAdmins() {
    return isSuperAdmin();
}
```

**filterUsersByPermission(users)**
```javascript
function filterUsersByPermission(users) {
    if (isSuperAdmin()) {
        return users; // Super Admin sees all users
    }
    // Non-Super Admin cannot see Super Admin accounts
    return users.filter(u => u.role !== 'super_admin');
}
```

**getAvailableRoles()**
```javascript
function getAvailableRoles() {
    if (isSuperAdmin()) {
        return [
            { value: 'super_admin', label: 'Super Admin - Akses Penuh Sistem' },
            { value: 'administrator', label: 'Administrator - Akses Penuh Operasional' },
            { value: 'keuangan', label: 'Admin Keuangan - Akses Keuangan' },
            { value: 'kasir', label: 'Kasir - Akses POS' }
        ];
    }
    return [
        { value: 'administrator', label: 'Administrator - Akses Penuh Operasional' },
        { value: 'keuangan', label: 'Admin Keuangan - Akses Keuangan' },
        { value: 'kasir', label: 'Kasir - Akses POS' }
    ];
}
```

**renderSystemSettings()**
```javascript
function renderSystemSettings() {
    if (!isSuperAdmin()) {
        showAlert('Akses ditolak. Hanya Super Admin yang dapat mengakses halaman ini.', 'danger');
        navigateTo('dashboard');
        return;
    }
    
    // Render system settings page
    const content = document.getElementById('mainContent');
    content.innerHTML = `
        <h2>Pengaturan Sistem</h2>
        <div class="card">
            <div class="card-body">
                <h5>Konfigurasi Sistem</h5>
                <!-- System configuration options -->
            </div>
        </div>
    `;
}
```

#### Modified User Management Functions

**renderManajemenUser()**
- Filters user list based on current user role
- Shows all users for Super Admin
- Hides Super Admin accounts from non-Super Admin users

**showUserModal()**
- Populates role dropdown based on user permissions
- Uses getAvailableRoles() to determine available options

**saveUser()**
- Validates role selection against user permissions
- Prevents non-Super Admin from creating/editing Super Admin accounts
- Adds additional validation for Super Admin operations

**deleteUser()**
- Prevents deletion of currently logged-in user
- Prevents deletion of Super Admin accounts by non-Super Admin users
- Adds confirmation for critical operations

### 2. Application Initialization Module (js/app.js)

#### Modified Functions

**initializeDefaultData()**
- Creates default Super Admin account if none exists
- Preserves existing user data during upgrade
- Ensures data integrity

```javascript
function initializeDefaultData() {
    // Default users with Super Admin
    if (!localStorage.getItem('users')) {
        const defaultUsers = [
            { 
                id: 1, 
                username: 'superadmin', 
                password: 'super123', 
                name: 'Super Administrator', 
                role: 'super_admin',
                active: true
            },
            { 
                id: 2, 
                username: 'admin', 
                password: 'admin123', 
                name: 'Administrator', 
                role: 'administrator',
                active: true
            },
            { 
                id: 3, 
                username: 'keuangan', 
                password: 'keuangan123', 
                name: 'Admin Keuangan', 
                role: 'keuangan',
                active: true
            },
            { 
                id: 4, 
                username: 'kasir', 
                password: 'kasir123', 
                name: 'Kasir', 
                role: 'kasir',
                active: true
            }
        ];
        localStorage.setItem('users', JSON.stringify(defaultUsers));
    } else {
        // Upgrade existing data: add Super Admin if not exists
        ensureSuperAdminExists();
    }
    
    // ... rest of initialization
}
```

**getRoleName(role)**
- Adds mapping for 'super_admin' role

#### New Functions

**ensureSuperAdminExists()**
```javascript
function ensureSuperAdminExists() {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const hasSuperAdmin = users.some(u => u.role === 'super_admin');
    
    if (!hasSuperAdmin) {
        const newId = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;
        users.push({
            id: newId,
            username: 'superadmin',
            password: 'super123',
            name: 'Super Administrator',
            role: 'super_admin',
            active: true
        });
        localStorage.setItem('users', JSON.stringify(users));
        console.log('Super Admin account created during upgrade');
    }
}
```

### 3. User Interface (index.html)

#### Modified Elements

**Login Page**
- Updates default account information to include Super Admin credentials

```html
<small class="text-muted d-block mt-2">
    <strong>Super Admin:</strong> superadmin/super123<br>
    <strong>Admin:</strong> admin/admin123<br>
    <strong>Keuangan:</strong> keuangan/keuangan123<br>
    <strong>Kasir:</strong> kasir/kasir123
</small>
```

## Data Models

### User Model

```javascript
{
    id: number,              // Unique identifier
    username: string,        // Login username
    password: string,        // Login password (plain text in localStorage)
    name: string,           // Full name
    role: string,           // 'super_admin' | 'administrator' | 'keuangan' | 'kasir'
    active: boolean         // Account status
}
```

### Role Hierarchy

```
super_admin (Level 4)
    │
    ├─ Full system access
    ├─ Manage all users including Administrators
    ├─ Access system settings
    └─ View audit logs
    
administrator (Level 3)
    │
    ├─ Full operational access
    ├─ Manage Keuangan and Kasir users
    └─ Cannot see or manage Super Admin accounts
    
keuangan (Level 2)
    │
    ├─ Financial module access
    └─ Limited user management
    
kasir (Level 1)
    │
    └─ POS access only
```

### Menu Configuration

```javascript
const menus = {
    super_admin: [
        // All administrator menus plus:
        { icon: 'bi-gear-fill', text: 'Pengaturan Sistem', page: 'system-settings' },
        { icon: 'bi-shield-lock', text: 'Audit Log', page: 'audit-log' },
        // ... all administrator menus
    ],
    administrator: [
        // Existing administrator menus
    ],
    keuangan: [
        // Existing keuangan menus
    ],
    kasir: [
        // Existing kasir menus
    ]
};
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, I identified the following redundancies:
- Properties 1.4 and 1.2 both test Super Admin menu access - can be combined
- Properties 2.5 and 3.1 both test Administrator filtering of Super Admin accounts - duplicate
- Properties 3.2 and 3.3 both test Administrator role options - duplicate
- Properties 1.3 can be split into two focused properties for badge class and role name

The following properties provide comprehensive, non-redundant coverage:

### Property 1: Super Admin account creation on initialization
*For any* initial system state without a Super Admin account, when the system initializes, the users array should contain at least one user with role 'super_admin'
**Validates: Requirements 1.1, 5.1, 5.3**

### Property 2: Super Admin menu completeness
*For any* Super Admin user, the rendered menu should contain all Administrator menu items plus Super Admin-specific menu items (Pengaturan Sistem, Audit Log)
**Validates: Requirements 1.2, 1.4, 4.1**

### Property 3: Role badge styling consistency
*For any* valid role string, getRoleBadgeClass should return a valid Bootstrap badge class, and 'super_admin' should return 'bg-dark'
**Validates: Requirements 1.3**

### Property 4: Role name display
*For any* valid role string, getRoleName should return a human-readable name, and 'super_admin' should return 'Super Admin'
**Validates: Requirements 1.3**

### Property 5: Super Admin sees all users
*For any* user list, when filterUsersByPermission is called by a Super Admin, it should return the complete unfiltered list
**Validates: Requirements 1.5**

### Property 6: Super Admin role options completeness
*For any* Super Admin user, getAvailableRoles should return all four role options including 'super_admin'
**Validates: Requirements 2.1**

### Property 7: Super Admin can edit any role
*For any* user and any target role, when a Super Admin calls saveUser, the operation should succeed (assuming valid data)
**Validates: Requirements 2.2**

### Property 8: Super Admin cannot delete self
*For any* Super Admin user, when attempting to delete their own account, the system should prevent the deletion
**Validates: Requirements 2.3**

### Property 9: Administrator cannot manage Super Admin accounts
*For any* Administrator user, when attempting to create or edit a user with role 'super_admin', the system should reject the operation
**Validates: Requirements 2.4, 3.5**

### Property 10: Administrator cannot see Super Admin accounts
*For any* user list containing Super Admin accounts, when filterUsersByPermission is called by an Administrator, the returned list should not contain any users with role 'super_admin'
**Validates: Requirements 2.5, 3.1**

### Property 11: Administrator role options exclusion
*For any* Administrator user, getAvailableRoles should not include 'super_admin' in the returned options
**Validates: Requirements 3.2, 3.3**

### Property 12: Non-Super Admin access denial
*For any* non-Super Admin user, when attempting to access renderSystemSettings, the system should deny access and redirect to dashboard
**Validates: Requirements 3.4**

### Property 13: Non-Super Admin menu exclusion
*For any* user with role 'administrator', 'keuangan', or 'kasir', the rendered menu should not contain the "Pengaturan Sistem" menu item
**Validates: Requirements 4.3**

### Property 14: Upgrade preserves existing users
*For any* existing users array, when ensureSuperAdminExists is called, all existing user objects should remain unchanged in the resulting array
**Validates: Requirements 5.2**

### Property 15: No duplicate Super Admin creation
*For any* users array that already contains a Super Admin, when ensureSuperAdminExists is called, the number of Super Admin accounts should not increase
**Validates: Requirements 5.4**

## Error Handling

### Authentication Errors

1. **Invalid Credentials**
   - Display clear error message: "Username atau password salah!"
   - Do not reveal which field is incorrect (security best practice)

2. **Inactive Account**
   - Display message: "Akun Anda telah dinonaktifkan. Hubungi administrator!"
   - Prevent login even with correct credentials

3. **Missing User Data**
   - Initialize default users including Super Admin
   - Log warning to console

### Permission Errors

1. **Unauthorized Access Attempt**
   - Display alert: "Akses ditolak. Hanya Super Admin yang dapat mengakses halaman ini."
   - Redirect to dashboard
   - Log attempt for audit purposes

2. **Invalid Role Assignment**
   - Display alert: "Anda tidak memiliki izin untuk menetapkan role ini!"
   - Prevent save operation
   - Keep form open for correction

3. **Self-Deletion Attempt**
   - Display alert: "Anda tidak dapat menghapus akun yang sedang digunakan!"
   - Prevent deletion
   - Keep user list displayed

### Data Integrity Errors

1. **Duplicate Username**
   - Display alert: "Username sudah digunakan!"
   - Highlight username field
   - Keep form open for correction

2. **Missing Required Fields**
   - Display alert: "Semua field harus diisi!"
   - Highlight empty fields
   - Prevent save operation

3. **Invalid Password Length**
   - Display alert: "Password minimal 6 karakter!"
   - Highlight password field
   - Keep form open for correction

### Upgrade/Migration Errors

1. **Corrupted User Data**
   - Attempt to repair data structure
   - Create backup before modification
   - Log errors to console
   - Initialize with defaults if repair fails

2. **LocalStorage Full**
   - Display alert: "Penyimpanan penuh. Hapus data yang tidak diperlukan."
   - Prevent new data creation
   - Suggest data cleanup

## Testing Strategy

### Unit Testing

Unit tests will verify specific examples and edge cases:

1. **Authentication Tests**
   - Test login with valid Super Admin credentials
   - Test login with invalid credentials
   - Test login with inactive account
   - Test logout functionality

2. **Role Management Tests**
   - Test getRoleName with each role type
   - Test getRoleBadgeClass with each role type
   - Test role name with undefined/null input
   - Test badge class with invalid role

3. **Permission Tests**
   - Test isSuperAdmin with Super Admin user
   - Test isSuperAdmin with non-Super Admin user
   - Test isSuperAdmin with null user
   - Test canManageAdmins with various roles

4. **User Filtering Tests**
   - Test filterUsersByPermission with Super Admin
   - Test filterUsersByPermission with Administrator
   - Test filterUsersByPermission with empty user list
   - Test filterUsersByPermission with mixed roles

5. **Initialization Tests**
   - Test initializeDefaultData with empty localStorage
   - Test ensureSuperAdminExists with no Super Admin
   - Test ensureSuperAdminExists with existing Super Admin
   - Test upgrade scenario with old data structure

### Property-Based Testing

Property-based tests will verify universal properties across all inputs using **fast-check** library for JavaScript. Each test will run a minimum of 100 iterations.

**Library Selection**: fast-check (https://github.com/dubzzz/fast-check)
- Mature and well-maintained PBT library for JavaScript
- Excellent TypeScript support
- Rich set of built-in arbitraries
- Good integration with Jest

**Test Configuration**:
```javascript
fc.assert(
    fc.property(/* arbitraries */, (/* params */) => {
        // property test
    }),
    { numRuns: 100 } // Minimum 100 iterations
);
```

**Property Test Requirements**:
1. Each property-based test MUST be tagged with a comment referencing the design document
2. Tag format: `// Feature: level-superadmin, Property {number}: {property_text}`
3. Each correctness property MUST be implemented by a SINGLE property-based test
4. Tests should use smart generators that constrain to valid input space

**Example Property Test Structure**:
```javascript
// Feature: level-superadmin, Property 1: Super Admin account creation on initialization
test('Property 1: System creates Super Admin on initialization', () => {
    fc.assert(
        fc.property(
            fc.array(fc.record({
                id: fc.integer(),
                username: fc.string(),
                password: fc.string(),
                name: fc.string(),
                role: fc.constantFrom('administrator', 'keuangan', 'kasir'),
                active: fc.boolean()
            })),
            (users) => {
                // Test that initialization creates Super Admin
                // when none exists
            }
        ),
        { numRuns: 100 }
    );
});
```

### Integration Testing

Integration tests will verify component interactions:

1. **Login to Menu Flow**
   - Test complete login flow for Super Admin
   - Verify menu rendering after login
   - Test navigation to Super Admin features

2. **User Management Flow**
   - Test creating user as Super Admin
   - Test editing user as Super Admin
   - Test deleting user as Super Admin
   - Test same operations as Administrator

3. **Permission Enforcement Flow**
   - Test accessing restricted pages as different roles
   - Test attempting unauthorized operations
   - Verify error messages and redirects

4. **Upgrade Flow**
   - Test system upgrade from old version
   - Verify Super Admin creation
   - Verify existing data preservation

### Test Coverage Goals

- Unit tests: Cover all functions and edge cases
- Property tests: Cover all 15 correctness properties
- Integration tests: Cover all user workflows
- Target: 90%+ code coverage for modified files

### Testing Tools

- **Test Framework**: Jest
- **Property Testing**: fast-check
- **Assertions**: Jest built-in matchers
- **Mocking**: Jest mock functions for localStorage
- **Coverage**: Jest coverage reporter

## Implementation Notes

### Backward Compatibility

The implementation must maintain backward compatibility with existing installations:

1. **Data Migration**
   - Detect existing user data structure
   - Add Super Admin account without disrupting existing users
   - Preserve all existing user credentials and settings

2. **Default Credentials**
   - Super Admin: superadmin/super123
   - Clearly document in login page and user guide

3. **Graceful Degradation**
   - System should work even if Super Admin features are not used
   - Existing Administrator accounts retain full operational access

### Security Considerations

1. **Password Storage**
   - Current implementation uses plain text in localStorage
   - Document security limitations
   - Recommend password change after first login

2. **Role Validation**
   - Always validate role on server-side operations (when backend is added)
   - Never trust client-side role checks alone
   - Implement role validation in all sensitive operations

3. **Audit Trail**
   - Log all Super Admin operations (future enhancement)
   - Track user management changes
   - Monitor permission escalation attempts

### Performance Considerations

1. **User Filtering**
   - Filter operations are O(n) where n is number of users
   - Acceptable for small to medium user bases (< 1000 users)
   - Consider indexing if user base grows significantly

2. **Menu Rendering**
   - Menu is rendered once per page load
   - Minimal performance impact
   - Consider caching if menu becomes complex

3. **LocalStorage Access**
   - Minimize localStorage reads/writes
   - Cache user data in memory during session
   - Batch updates when possible

### Future Enhancements

1. **Audit Logging**
   - Implement comprehensive audit trail
   - Track all user management operations
   - Store logs in separate storage mechanism

2. **Advanced System Settings**
   - Add system configuration options
   - Implement backup/restore functionality
   - Add data export/import features

3. **Multi-Factor Authentication**
   - Add 2FA for Super Admin accounts
   - Implement email verification
   - Add security questions

4. **Role Permissions Matrix**
   - Create granular permission system
   - Allow custom role creation
   - Implement permission inheritance
