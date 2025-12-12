/**
 * Dashboard Analytics & KPI - Type Definitions
 * 
 * This file contains TypeScript-style interfaces and type definitions
 * for the dashboard system using JSDoc annotations.
 */

/**
 * @typedef {Object} DashboardConfig
 * @property {string} id - Unique dashboard identifier
 * @property {string} userId - User who owns this dashboard
 * @property {string} role - User role (admin, manager, treasurer, etc.)
 * @property {WidgetLayout[]} layout - Array of widget configurations
 * @property {string} theme - Dashboard theme (light, dark, auto)
 * @property {number} refreshInterval - Auto-refresh interval in milliseconds
 * @property {Date} createdAt - Dashboard creation timestamp
 * @property {Date} updatedAt - Last update timestamp
 */

/**
 * @typedef {Object} WidgetConfig
 * @property {string} id - Unique widget identifier
 * @property {WidgetType} type - Widget type
 * @property {string} title - Widget display title
 * @property {Position} position - Widget position on dashboard
 * @property {Size} size - Widget dimensions
 * @property {string} dataSource - Data source identifier
 * @property {number} refreshInterval - Widget-specific refresh interval
 * @property {ChartOptions} chartOptions - Chart configuration options
 * @property {FilterConfig[]} filters - Applied filters
 */

/**
 * @typedef {Object} Position
 * @property {number} x - X coordinate
 * @property {number} y - Y coordinate
 */

/**
 * @typedef {Object} Size
 * @property {number} width - Widget width
 * @property {number} height - Widget height
 */

/**
 * @typedef {Object} KPIMetric
 * @property {string} id - Metric identifier
 * @property {string} name - Metric display name
 * @property {number} value - Current metric value
 * @property {number} previousValue - Previous period value
 * @property {number} changePercent - Percentage change
 * @property {'up'|'down'|'stable'} trend - Trend direction
 * @property {number} target - Target value
 * @property {string} unit - Value unit (currency, percentage, count)
 * @property {string} category - Metric category
 * @property {Date} lastUpdated - Last update timestamp
 */

/**
 * @typedef {Object} AnalyticsData
 * @property {string} metric - Metric name
 * @property {string} period - Time period
 * @property {DataPoint[]} data - Data points array
 * @property {'sum'|'avg'|'count'|'max'|'min'} aggregation - Aggregation method
 * @property {Object} filters - Applied filters
 * @property {Date} generatedAt - Data generation timestamp
 */

/**
 * @typedef {Object} DataPoint
 * @property {string|Date} x - X-axis value (date, category)
 * @property {number} y - Y-axis value
 * @property {string} [label] - Optional label
 * @property {Object} [metadata] - Additional metadata
 */

/**
 * @typedef {Object} ChartOptions
 * @property {'line'|'bar'|'pie'|'doughnut'|'radar'|'heatmap'|'gauge'} type - Chart type
 * @property {boolean} responsive - Responsive sizing
 * @property {boolean} maintainAspectRatio - Maintain aspect ratio
 * @property {Object} scales - Chart scales configuration
 * @property {Object} plugins - Chart plugins configuration
 * @property {string} backgroundColor - Background color
 * @property {string[]} colors - Color palette
 */

/**
 * @typedef {Object} FilterConfig
 * @property {string} field - Field to filter
 * @property {'equals'|'contains'|'range'|'in'} operator - Filter operator
 * @property {any} value - Filter value
 * @property {boolean} active - Filter active state
 */

/**
 * @typedef {'kpi'|'chart'|'table'|'gauge'|'heatmap'|'comparison'} WidgetType
 */

/**
 * @typedef {Object} FinancialHealthScore
 * @property {number} score - Overall health score (0-100)
 * @property {string} grade - Letter grade (A, B, C, D, F)
 * @property {string} status - Status description
 * @property {Object} components - Score components
 * @property {number} components.liquidity - Liquidity score
 * @property {number} components.profitability - Profitability score
 * @property {number} components.efficiency - Efficiency score
 * @property {number} components.growth - Growth score
 */

/**
 * @typedef {Object} MemberSegment
 * @property {string} id - Segment identifier
 * @property {string} name - Segment name
 * @property {string} description - Segment description
 * @property {number} memberCount - Number of members in segment
 * @property {number} avgTransactionValue - Average transaction value
 * @property {number} transactionFrequency - Transaction frequency
 * @property {string} riskLevel - Risk level (low, medium, high)
 */

/**
 * @typedef {Object} TrendAnalysis
 * @property {string} metric - Metric name
 * @property {'increasing'|'decreasing'|'stable'|'volatile'} trend - Trend type
 * @property {number} slope - Trend slope
 * @property {number} correlation - Correlation coefficient
 * @property {number} confidence - Confidence level (0-1)
 * @property {string[]} insights - Generated insights
 */

// Export types for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        // Type definitions are available through JSDoc
    };
}