# Performance Monitoring Setup - Dashboard Analytics & KPI

## Monitoring Architecture

### Monitoring Stack
- **Application Monitoring**: New Relic / DataDog
- **Infrastructure Monitoring**: Prometheus + Grafana
- **Log Management**: ELK Stack (Elasticsearch, Logstash, Kibana)
- **Uptime Monitoring**: Pingdom / UptimeRobot
- **Error Tracking**: Sentry
- **Real User Monitoring**: Google Analytics + Custom metrics

## Application Performance Monitoring

### Key Metrics to Monitor
```javascript
// Performance Metrics
const performanceMetrics = {
  // Response Time Metrics
  responseTime: {
    api: '<200ms',
    dashboard: '<2s',
    export: '<10s'
  },
  
  // Throughput Metrics
  throughput: {
    requests_per_second: '>100',
    concurrent_users: '>50'
  },
  
  // Error Metrics
  errorRates: {
    api_errors: '<0.1%',
    client_errors: '<0.5%',
    server_errors: '<0.01%'
  },
  
  // Resource Utilization
  resources: {
    cpu_usage: '<70%',
    memory_usage: '<80%',
    disk_usage: '<85%'
  }
};
```

### Custom Performance Tracking
```javascript
// Client-side performance tracking
class PerformanceTracker {
  constructor() {
    this.metrics = new Map();
    this.initializeTracking();
  }
  
  initializeTracking() {
    // Track page load performance
    window.addEventListener('load', () => {
      const perfData = performance.getEntriesByType('navigation')[0];
      this.trackMetric('page_load_time', perfData.loadEventEnd - perfData.navigationStart);
    });
    
    // Track dashboard load time
    this.trackDashboardLoad();
    
    // Track widget render time
    this.trackWidgetPerformance();
    
    // Track user interactions
    this.trackUserInteractions();
  }
  
  trackMetric(name, value, tags = {}) {
    const metric = {
      name,
      value,
      timestamp: Date.now(),
      tags: {
        ...tags,
        user_agent: navigator.userAgent,
        viewport: `${window.innerWidth}x${window.innerHeight}`
      }
    };
    
    // Send to monitoring service
    this.sendToMonitoring(metric);
  }
  
  trackDashboardLoad() {
    const startTime = performance.now();
    
    // Wait for dashboard to be fully loaded
    const observer = new MutationObserver(() => {
      const widgets = document.querySelectorAll('.widget');
      const loadedWidgets = document.querySelectorAll('.widget.loaded');
      
      if (widgets.length > 0 && widgets.length === loadedWidgets.length) {
        const loadTime = performance.now() - startTime;
        this.trackMetric('dashboard_load_time', loadTime, {
          widget_count: widgets.length
        });
        observer.disconnect();
      }
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
  }
  
  trackWidgetPerformance() {
    // Track individual widget render times
    const widgets = document.querySelectorAll('.widget');
    widgets.forEach(widget => {
      const widgetType = widget.dataset.type;
      const startTime = performance.now();
      
      widget.addEventListener('widget:loaded', () => {
        const renderTime = performance.now() - startTime;
        this.trackMetric('widget_render_time', renderTime, {
          widget_type: widgetType
        });
      });
    });
  }
  
  sendToMonitoring(metric) {
    // Send to external monitoring service
    fetch('/api/metrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(metric)
    }).catch(console.error);
  }
}

// Initialize performance tracking
const performanceTracker = new PerformanceTracker();
```

## Infrastructure Monitoring

### Prometheus Configuration
```yaml
# prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "dashboard_rules.yml"

scrape_configs:
  - job_name: 'dashboard-app'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/metrics'
    scrape_interval: 5s

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['localhost:9100']

  - job_name: 'postgres-exporter'
    static_configs:
      - targets: ['localhost:9187']

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093
```

### Grafana Dashboard Configuration
```json
{
  "dashboard": {
    "title": "Dashboard Analytics & KPI Monitoring",
    "panels": [
      {
        "title": "Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "95th percentile"
          }
        ]
      },
      {
        "title": "Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "Requests/sec"
          }
        ]
      },
      {
        "title": "Error Rate",
        "type": "singlestat",
        "targets": [
          {
            "expr": "rate(http_requests_total{status=~\"5..\"}[5m]) / rate(http_requests_total[5m]) * 100",
            "legendFormat": "Error Rate %"
          }
        ]
      }
    ]
  }
}
```

## Alert Configuration

### Critical Alerts
```yaml
# dashboard_rules.yml
groups:
  - name: dashboard.rules
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.01
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value }} errors per second"

      - alert: HighResponseTime
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 2
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High response time detected"
          description: "95th percentile response time is {{ $value }} seconds"

      - alert: DatabaseConnectionFailure
        expr: up{job="postgres-exporter"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Database connection failure"
          description: "PostgreSQL database is not responding"

      - alert: HighMemoryUsage
        expr: (node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes > 0.9
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage"
          description: "Memory usage is above 90%"
```

### Notification Channels
```yaml
# alertmanager.yml
global:
  smtp_smarthost: 'smtp.gmail.com:587'
  smtp_from: 'alerts@koperasi.com'

route:
  group_by: ['alertname']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 1h
  receiver: 'web.hook'

receivers:
  - name: 'web.hook'
    email_configs:
      - to: 'devops@koperasi.com'
        subject: 'Dashboard Alert: {{ .GroupLabels.alertname }}'
        body: |
          {{ range .Alerts }}
          Alert: {{ .Annotations.summary }}
          Description: {{ .Annotations.description }}
          {{ end }}
    
    slack_configs:
      - api_url: 'https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK'
        channel: '#alerts'
        title: 'Dashboard Alert'
        text: '{{ range .Alerts }}{{ .Annotations.summary }}{{ end }}'
```

## Log Management

### Structured Logging
```javascript
// Logger configuration
const winston = require('winston');
const { ElasticsearchTransport } = require('winston-elasticsearch');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'dashboard-analytics' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new ElasticsearchTransport({
      level: 'info',
      clientOpts: { node: 'http://localhost:9200' },
      index: 'dashboard-logs'
    })
  ]
});

// Performance logging middleware
const performanceLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request completed', {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: duration,
      user_agent: req.get('User-Agent'),
      ip: req.ip
    });
  });
  
  next();
};
```

## Business Metrics Tracking

### KPI Monitoring
```javascript
// Business metrics tracking
class BusinessMetricsTracker {
  constructor() {
    this.metrics = {
      daily_active_users: 0,
      dashboard_views: 0,
      export_requests: 0,
      widget_interactions: 0,
      error_reports: 0
    };
  }
  
  trackUserActivity(userId, activity) {
    // Track user engagement
    this.incrementMetric('daily_active_users', userId);
    this.incrementMetric(`${activity}_count`);
    
    // Send to analytics
    this.sendToAnalytics({
      event: activity,
      user_id: userId,
      timestamp: Date.now()
    });
  }
  
  trackDashboardPerformance(metrics) {
    // Track dashboard-specific metrics
    const performanceScore = this.calculatePerformanceScore(metrics);
    
    this.sendToAnalytics({
      event: 'dashboard_performance',
      performance_score: performanceScore,
      load_time: metrics.loadTime,
      widget_count: metrics.widgetCount
    });
  }
  
  generateDailyReport() {
    // Generate daily business metrics report
    const report = {
      date: new Date().toISOString().split('T')[0],
      metrics: this.metrics,
      performance: this.getPerformanceMetrics(),
      errors: this.getErrorMetrics()
    };
    
    // Send report to stakeholders
    this.sendReport(report);
  }
}
```