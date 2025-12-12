# Maintenance & Troubleshooting Guide for Developers

## Development Environment Setup

### Prerequisites
```bash
# Required software versions
Node.js: v16.x or higher
PostgreSQL: v13.x or higher
Redis: v6.x or higher
Git: v2.30 or higher

# Development tools
npm install -g nodemon
npm install -g jest
npm install -g eslint
npm install -g prettier
```

### Local Development Setup
```bash
# Clone repository
git clone https://github.com/koperasi/dashboard-analytics.git
cd dashboard-analytics

# Install dependencies
npm install

# Setup environment
cp .env.example .env.development
# Edit .env.development dengan local settings

# Setup database
createdb dashboard_analytics_dev
npm run migrate:dev

# Seed development data
npm run seed:dev

# Start development server
npm run dev
```

## Code Architecture

### Project Structure
```
dashboard-analytics/
├── src/
│   ├── components/          # React components
│   ├── services/           # Business logic services
│   ├── utils/              # Utility functions
│   ├── hooks/              # Custom React hooks
│   ├── types/              # TypeScript type definitions
│   └── tests/              # Test files
├── public/                 # Static assets
├── docs/                   # Documentation
├── scripts/                # Build dan deployment scripts
└── config/                 # Configuration files
```

### Component Guidelines
```javascript
// Component template
import React, { useState, useEffect } from 'react';
import { ComponentProps } from './types';

/**
 * Component description
 * @param props - Component properties
 * @returns JSX element
 */
export const ComponentName: React.FC<ComponentProps> = ({ 
  prop1, 
  prop2 
}) => {
  const [state, setState] = useState(initialState);
  
  useEffect(() => {
    // Side effects
  }, [dependencies]);
  
  const handleAction = () => {
    // Event handlers
  };
  
  return (
    <div className="component-name">
      {/* Component JSX */}
    </div>
  );
};
```

## Testing Guidelines

### Unit Testing
```javascript
// Test template
import { render, screen, fireEvent } from '@testing-library/react';
import { ComponentName } from './ComponentName';

describe('ComponentName', () => {
  const defaultProps = {
    prop1: 'value1',
    prop2: 'value2'
  };
  
  it('should render correctly', () => {
    render(<ComponentName {...defaultProps} />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
  
  it('should handle user interactions', () => {
    const mockHandler = jest.fn();
    render(<ComponentName {...defaultProps} onAction={mockHandler} />);
    
    fireEvent.click(screen.getByRole('button'));
    expect(mockHandler).toHaveBeenCalledWith(expectedArgs);
  });
});
```

### Property-Based Testing
```javascript
// Property-based test template
import fc from 'fast-check';
import { validateKPICalculation } from './kpiCalculations';

describe('KPI Calculations Properties', () => {
  test('KPI calculation should be consistent', () => {
    fc.assert(fc.property(
      fc.record({
        revenue: fc.float({ min: 0, max: 1000000 }),
        expenses: fc.float({ min: 0, max: 1000000 }),
        members: fc.integer({ min: 1, max: 10000 })
      }),
      (data) => {
        const result = validateKPICalculation(data);
        
        // Properties that should always hold
        expect(result.profitMargin).toBeGreaterThanOrEqual(0);
        expect(result.profitMargin).toBeLessThanOrEqual(100);
        expect(result.revenuePerMember).toBeGreaterThanOrEqual(0);
      }
    ));
  });
});
```

## Common Issues dan Solutions

### Performance Issues

#### Issue: Slow Widget Rendering
```javascript
// Problem: Large datasets causing slow renders
// Solution: Implement virtualization

import { FixedSizeList as List } from 'react-window';

const VirtualizedTable = ({ data }) => {
  const Row = ({ index, style }) => (
    <div style={style}>
      {data[index].name} - {data[index].value}
    </div>
  );
  
  return (
    <List
      height={400}
      itemCount={data.length}
      itemSize={35}
      width="100%"
    >
      {Row}
    </List>
  );
};
```

#### Issue: Memory Leaks
```javascript
// Problem: Event listeners not cleaned up
// Solution: Proper cleanup in useEffect

useEffect(() => {
  const handleResize = () => {
    // Handle window resize
  };
  
  window.addEventListener('resize', handleResize);
  
  // Cleanup function
  return () => {
    window.removeEventListener('resize', handleResize);
  };
}, []);
```

### Data Issues

#### Issue: Stale Data
```javascript
// Problem: Data not updating
// Solution: Implement proper cache invalidation

const useDataWithCache = (key, fetcher) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await fetcher();
        setData(result);
        
        // Cache with TTL
        localStorage.setItem(key, JSON.stringify({
          data: result,
          timestamp: Date.now(),
          ttl: 5 * 60 * 1000 // 5 minutes
        }));
      } catch (error) {
        console.error('Data fetch error:', error);
      } finally {
        setLoading(false);
      }
    };
    
    // Check cache first
    const cached = localStorage.getItem(key);
    if (cached) {
      const { data: cachedData, timestamp, ttl } = JSON.parse(cached);
      if (Date.now() - timestamp < ttl) {
        setData(cachedData);
        setLoading(false);
        return;
      }
    }
    
    fetchData();
  }, [key, fetcher]);
  
  return { data, loading };
};
```

## Debugging Tools

### Browser DevTools
```javascript
// Debug utilities
window.debugDashboard = {
  // Get current dashboard state
  getState: () => {
    return {
      widgets: document.querySelectorAll('.widget').length,
      errors: document.querySelectorAll('.error').length,
      performance: performance.getEntriesByType('navigation')[0]
    };
  },
  
  // Force widget refresh
  refreshWidget: (widgetId) => {
    const widget = document.querySelector(`[data-widget-id="${widgetId}"]`);
    if (widget) {
      widget.dispatchEvent(new CustomEvent('refresh'));
    }
  },
  
  // Clear all caches
  clearCaches: () => {
    localStorage.clear();
    sessionStorage.clear();
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => caches.delete(name));
      });
    }
  }
};
```

### Server-side Debugging
```javascript
// Debug middleware
const debugMiddleware = (req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`${req.method} ${req.path}`, {
      query: req.query,
      body: req.body,
      headers: req.headers,
      timestamp: new Date().toISOString()
    });
  }
  next();
};

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });
  
  res.status(500).json({
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error'
  });
};
```

## Code Quality Standards

### ESLint Configuration
```json
{
  "extends": [
    "eslint:recommended",
    "@typescript-eslint/recommended",
    "react-hooks/recommended"
  ],
  "rules": {
    "no-console": "warn",
    "no-unused-vars": "error",
    "prefer-const": "error",
    "react-hooks/exhaustive-deps": "warn"
  }
}
```

### Prettier Configuration
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2
}
```

## Deployment Procedures

### Development Deployment
```bash
# Build dan test
npm run build
npm run test:all
npm run lint

# Deploy to development
npm run deploy:dev

# Verify deployment
npm run health:check:dev
```

### Production Deployment
```bash
# Pre-deployment checks
npm run pre-deploy:check

# Create deployment branch
git checkout -b deploy/$(date +%Y%m%d-%H%M%S)
git push origin deploy/$(date +%Y%m%d-%H%M%S)

# Deploy to staging first
npm run deploy:staging
npm run test:staging

# Deploy to production
npm run deploy:production
npm run health:check:production
```

## Monitoring dan Alerting

### Custom Metrics
```javascript
// Custom metrics collection
class MetricsCollector {
  constructor() {
    this.metrics = new Map();
  }
  
  increment(metric, tags = {}) {
    const key = `${metric}:${JSON.stringify(tags)}`;
    this.metrics.set(key, (this.metrics.get(key) || 0) + 1);
  }
  
  timing(metric, duration, tags = {}) {
    const key = `${metric}:timing:${JSON.stringify(tags)}`;
    const existing = this.metrics.get(key) || [];
    existing.push(duration);
    this.metrics.set(key, existing);
  }
  
  flush() {
    const data = Object.fromEntries(this.metrics);
    this.metrics.clear();
    
    // Send to monitoring service
    fetch('/api/metrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  }
}

const metrics = new MetricsCollector();

// Usage examples
metrics.increment('widget.render', { type: 'chart' });
metrics.timing('api.response', 150, { endpoint: '/api/data' });
```

## Security Best Practices

### Input Validation
```javascript
// Input sanitization
import DOMPurify from 'dompurify';
import validator from 'validator';

const sanitizeInput = (input) => {
  if (typeof input === 'string') {
    return DOMPurify.sanitize(validator.escape(input));
  }
  return input;
};

// API input validation
const validateApiInput = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: 'Invalid input',
      details: error.details
    });
  }
  next();
};
```

### Authentication Helpers
```javascript
// JWT token validation
const validateToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return { valid: true, user: decoded };
  } catch (error) {
    return { valid: false, error: error.message };
  }
};

// Role-based access control
const requireRole = (roles) => (req, res, next) => {
  const userRole = req.user?.role;
  if (!roles.includes(userRole)) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  next();
};
```