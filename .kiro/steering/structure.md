# Project Structure & Organization

## Directory Structure

### Root Level
```
├── index.html                    # Main application entry point
├── package.json                  # Dependencies and scripts
├── database-setup.sql           # PostgreSQL schema setup
├── server.js                    # Development server
├── jest.config.cjs              # Jest testing configuration
├── .babelrc                     # Babel configuration for tests
├── vercel.json                  # Vercel deployment config
└── README.md                    # Project documentation
```

### Core Application Files
```
├── css/                         # Stylesheets
│   ├── style.css               # Main application styles
│   ├── itemSearch.css          # Item search component styles
│   ├── pos-enhanced.css        # POS-specific styles
│   └── [feature].css           # Feature-specific stylesheets
├── js/                         # JavaScript modules
│   ├── app.js                  # Core application logic
│   ├── auth.js                 # Authentication system
│   ├── utils.js                # Utility functions
│   └── [module].js             # Feature modules
└── public/                     # Static assets (if any)
```

### JavaScript Module Organization

#### Core Modules
```
js/
├── app.js                      # Main application controller
├── auth.js                     # Legacy authentication
├── supabaseAuth.js            # Supabase authentication
├── authMigration.js           # Auth migration logic
├── utils.js                   # Common utilities
└── auditUtils.js              # Audit logging utilities
```

#### Feature Modules
```
js/
├── koperasi.js                # Member management
├── simpanan.js                # Savings management
├── pinjaman.js                # Loan management
├── pos.js                     # Point of Sales
├── inventory.js               # Inventory management
├── keuangan.js                # Financial/accounting
├── reports.js                 # Reporting system
└── backup.js                  # Backup/restore functionality
```

#### Complex Feature Folders
```
js/
├── shared/                    # Shared services
│   ├── SharedPaymentServices.js
│   ├── EnhancedAuditLogger.js
│   ├── UnifiedTransactionModel.js
│   └── [SharedService].js
├── transformasi-barang/       # Item transformation system
│   ├── types.js
│   ├── DataModels.js
│   ├── ValidationEngine.js
│   ├── StockManager.js
│   └── [Component].js
├── import-tagihan/           # Bill import system
│   ├── ImportTagihanManager.js
│   ├── ValidationEngine.js
│   ├── FileParser.js
│   └── [Component].js
├── migration/                # Data migration scripts
│   ├── TransactionMigration.js
│   └── UpdatedQueryFunctions.js
└── monitoring/               # Performance monitoring
    ├── PerformanceMonitor.js
    └── ErrorTracker.js
```

### Testing Structure
```
__tests__/                     # Jest unit tests
├── [module].test.js          # Module-specific tests
├── import-tagihan/           # Feature test suites
│   ├── ImportTagihanManager.test.js
│   ├── ValidationEngine.test.js
│   └── [Component].test.js
└── integrasi-pembayaran-laporan/
    ├── ComprehensiveIntegrationTests.test.js
    └── PerformanceTests.test.js
```

### Manual Testing Files
```
# HTML test files (root level)
test_[feature].html            # Manual testing pages
debug_[feature].html           # Debug utilities
fix_[issue].html              # Issue-specific fixes
```

### Documentation Structure
```
# Root level documentation
README.md                      # Main project documentation
START_HERE.md                 # Quick start guide
CARA_BUKA_APLIKASI_SIMPLE.md  # Simple usage guide

# Feature documentation
PANDUAN_[FEATURE].md          # User guides
IMPLEMENTASI_[FEATURE].md     # Implementation docs
TROUBLESHOOTING_[FEATURE].md  # Troubleshooting guides
QUICK_REFERENCE_[FEATURE].md  # Quick references

# Technical documentation
TECHNICAL_DOCUMENTATION_[FEATURE].md
API_DOCUMENTATION_[FEATURE].md
DEPLOYMENT_GUIDE_[FEATURE].md
```

### Specification Structure
```
.kiro/specs/                   # Feature specifications
├── [feature-name]/           # Feature specification folder
│   ├── requirements.md       # Business requirements
│   ├── design.md            # Technical design
│   ├── tasks.md             # Implementation tasks
│   └── quick-reference.md   # Quick reference (optional)
└── [another-feature]/
    ├── requirements.md
    ├── design.md
    └── tasks.md
```

## File Naming Conventions

### JavaScript Files
- **Core modules**: `[module].js` (e.g., `koperasi.js`, `pos.js`)
- **Feature modules**: `[featureName].js` (camelCase)
- **Complex features**: `[feature]/[Component].js` (PascalCase for components)
- **Shared services**: `[ServiceName].js` (PascalCase)
- **Test files**: `[module].test.js`

### CSS Files
- **Main stylesheet**: `style.css`
- **Feature styles**: `[feature-name].css` (kebab-case)
- **Component styles**: `[componentName].css` (camelCase)

### Documentation Files
- **User guides**: `PANDUAN_[FEATURE].md` (UPPER_SNAKE_CASE)
- **Technical docs**: `TECHNICAL_DOCUMENTATION_[FEATURE].md`
- **Implementation**: `IMPLEMENTASI_[FEATURE].md`
- **Quick references**: `QUICK_REFERENCE_[FEATURE].md`

### Test Files
- **Manual tests**: `test_[feature].html` (snake_case)
- **Debug tools**: `debug_[feature].html`
- **Fix utilities**: `fix_[issue].html`

## Code Organization Principles

### Module Separation
- Each major feature has its own JavaScript file
- Complex features use folder structure with multiple components
- Shared functionality goes in `js/shared/`
- Migration scripts in `js/migration/`

### Dependency Management
- Core modules loaded first (app.js, auth.js, utils.js)
- Feature modules loaded after core modules
- Shared services loaded before dependent modules
- Migration scripts loaded conditionally

### Data Layer Organization
- LocalStorage keys use descriptive names: `anggota`, `masterBarang`
- Supabase tables use snake_case: `anggota`, `master_barang`
- Migration functions handle data format conversion

### UI Component Structure
- Bootstrap 5 components for consistent styling
- Custom CSS in feature-specific stylesheets
- Responsive design with mobile-first approach
- Accessibility considerations in all components

## Configuration Files

### Package Configuration
- `package.json` - Dependencies and npm scripts
- `jest.config.cjs` - Jest testing configuration
- `.babelrc` - Babel transpilation for tests

### Deployment Configuration
- `vercel.json` - Vercel deployment settings
- `deploy-*.ps1` - PowerShell deployment scripts
- `deploy-*.sh` - Bash deployment scripts

### Database Configuration
- `database-setup.sql` - Complete PostgreSQL schema
- Includes tables, indexes, RLS policies, and default data
- Migration scripts for schema updates

## Development Workflow

### Feature Development
1. Create specification in `.kiro/specs/[feature]/`
2. Implement JavaScript module in `js/`
3. Add CSS styles if needed in `css/`
4. Write unit tests in `__tests__/`
5. Create manual test page `test_[feature].html`
6. Document in appropriate markdown files

### Testing Workflow
1. Unit tests with Jest (`npm run test:jest`)
2. Property-based tests with fast-check
3. Integration tests (`npm run test:integration`)
4. Manual testing with HTML test pages
5. Production readiness verification (`npm run verify:production`)

### Deployment Workflow
1. Run all tests and verifications
2. Use deployment scripts (`npm run deploy:integrasi`)
3. Monitor with health checks (`npm run deploy:health-check`)
4. Rollback if needed (`npm run deploy:rollback`)