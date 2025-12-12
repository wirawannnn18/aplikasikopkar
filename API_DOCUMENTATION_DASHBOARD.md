# API Documentation - Dashboard Analytics & KPI

## Overview
Dashboard Analytics & KPI menyediakan RESTful API untuk integrasi dengan sistem eksternal dan pengembangan aplikasi custom.

## Base URL
```
Production: https://api.koperasi.com/dashboard/v1
Development: https://dev-api.koperasi.com/dashboard/v1
```

## Authentication
```javascript
// JWT Token Authentication
Authorization: Bearer <jwt_token>

// API Key Authentication (alternative)
X-API-Key: <api_key>
```

## Core Endpoints

### Dashboard Management
```javascript
// Get dashboard configuration
GET /dashboards/{dashboardId}

// Update dashboard layout
PUT /dashboards/{dashboardId}/layout
Body: {
  "widgets": [...],
  "layout": {...}
}

// Create new dashboard
POST /dashboards
Body: {
  "name": "Custom Dashboard",
  "layout": {...},
  "permissions": [...]
}
```

### Widget Operations
```javascript
// Get widget data
GET /widgets/{widgetId}/data?startDate=2024-01-01&endDate=2024-12-31

// Update widget configuration
PUT /widgets/{widgetId}/config
Body: {
  "dataSource": "members",
  "aggregation": "sum",
  "filters": {...}
}

// Create custom widget
POST /widgets
Body: {
  "type": "kpi",
  "config": {...},
  "permissions": [...]
}
```

### Data Analytics
```javascript
// Get KPI metrics
GET /analytics/kpi?metrics=financial_health,member_growth&period=monthly

// Get trend analysis
GET /analytics/trends/{metric}?period=12months

// Get member analytics
GET /analytics/members?segment=active&startDate=2024-01-01
```

### Export Services
```javascript
// Generate PDF report
POST /export/pdf
Body: {
  "dashboardId": "main",
  "widgets": ["widget1", "widget2"],
  "format": "A4"
}

// Generate Excel export
POST /export/excel
Body: {
  "data": {...},
  "sheets": [...],
  "formatting": true
}
```

## Response Format
```javascript
{
  "success": true,
  "data": {...},
  "meta": {
    "timestamp": "2024-12-12T10:00:00Z",
    "version": "1.0.0"
  }
}
```

## Error Handling
```javascript
{
  "success": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Invalid date range",
    "details": {...}
  }
}
```