# Technology Stack & Build System

## Core Technologies

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Custom styling with CSS variables
- **Vanilla JavaScript (ES6+)** - No framework dependencies
- **Bootstrap 5.3.0** - UI component library
- **Bootstrap Icons** - Icon library

### Data Persistence
- **LocalStorage** - Offline data storage (legacy/fallback)
- **Supabase** - Cloud PostgreSQL database (production)
- **PostgreSQL** - Relational database with RLS (Row Level Security)

### External Libraries
- **Papa Parse 5.4.1** - CSV parsing
- **SheetJS (xlsx) 0.18.5** - Excel file handling

### Testing
- **Jest 29.7.0** - Unit testing framework
- **fast-check 3.23.2** - Property-based testing
- **jest-environment-jsdom** - DOM testing environment

### Development Tools
- **Node.js** - Development server
- **Babel** - JavaScript transpilation (for tests)
- **PowerShell/Bash** - Deployment scripts

## Project Structure

```
├── index.html              # Main entry point
├── css/                    # Stylesheets
│   ├── style.css          # Main stylesheet
│   └── [feature].css      # Feature-specific styles
├── js/                     # JavaScript modules
│   ├── app.js             # Core application logic
│   ├── auth.js            # Authentication
│   ├── [module].js        # Feature modules
│   ├── shared/            # Shared services
│   ├── migration/         # Data migration scripts
│   ├── monitoring/        # Performance monitoring
│   └── [feature]/         # Feature-specific folders
├── __tests__/             # Jest test files
├── database-setup.sql     # Database schema
└── .kiro/specs/           # Feature specifications
```

## Common Commands

### Development
```bash
# Start development server
npm run dev
# Access at http://localhost:3000

# Run all tests
npm test

# Run Jest tests
npm run test:jest

# Watch mode for tests
npm run test:watch

# Run integration tests
npm run test:integration

# Run property-based tests
npm run test:property
```

### Production
```bash
# Setup production environment
npm run setup

# Verify production readiness
npm run verify:production

# Deploy (integrated payment system)
npm run deploy:integrasi

# Rollback deployment
npm run deploy:rollback

# Health check
npm run deploy:health-check
```

### Database
```sql
-- Run database-setup.sql in Supabase SQL Editor
-- Creates all tables, indexes, RLS policies, and default data
```

## Code Organization Patterns

### Module Structure
- Each feature has dedicated JavaScript file(s)
- Complex features use folder structure (e.g., `js/transformasi-barang/`)
- Shared utilities in `js/shared/`
- Migration scripts in `js/migration/`

### Naming Conventions
- **Files**: camelCase for JS (e.g., `pembayaranHutangPiutang.js`)
- **Functions**: camelCase (e.g., `calculateTotal()`)
- **Classes**: PascalCase (e.g., `ValidationEngine`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_CREDIT_LIMIT`)
- **CSS Classes**: kebab-case (e.g., `.sidebar-menu`)

### Data Storage Keys
- LocalStorage keys use descriptive names: `anggota`, `masterBarang`, `transaksiPOS`
- Supabase tables use snake_case: `anggota`, `master_barang`, `transaksi_pos`

## Authentication System

### Supabase Auth (Current)
- Email/password authentication
- Row Level Security (RLS) policies
- Session management with JWT tokens
- Migration from legacy LocalStorage auth

### Legacy Auth (Compatibility)
- LocalStorage-based authentication
- Maintained for backward compatibility during migration
- See `js/authMigration.js` for migration logic

## Testing Strategy

### Unit Tests
- Located in `__tests__/` directory
- Test individual functions and modules
- Use Jest with jsdom environment

### Property-Based Tests
- Use fast-check library
- Test invariants and edge cases
- Located alongside unit tests

### Integration Tests
- Test feature workflows end-to-end
- Verify module interactions
- HTML test files for manual testing (e.g., `test_*.html`)

### Manual Testing
- HTML test pages in root directory
- Debug tools (e.g., `debug_*.html`)
- Comprehensive test checklists in markdown files

## Build & Deployment

### No Build Step Required
- Static HTML/CSS/JS files
- No transpilation needed for production
- Direct deployment to static hosting (Vercel, Netlify, etc.)

### Deployment Targets
- **Vercel** - Primary hosting platform
- **Local Server** - Development and testing
- **File System** - Offline usage (double-click index.html)

## Browser Compatibility

- **Chrome/Edge** - Recommended (best performance)
- **Firefox** - Fully supported
- **Safari** - Supported
- **Mobile Browsers** - Responsive design supported

## Performance Considerations

- Lazy loading for large datasets
- Pagination for tables
- Caching strategies for frequently accessed data
- Performance monitoring via `js/monitoring/PerformanceMonitor.js`