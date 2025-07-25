/**
 * Real-time Chat Health Monitoring Script
 * Monitors key metrics after race condition fix deployment
 */

// Add to useBookDiscussion hook for production monitoring
const MONITORING_CONFIG = {
  enabled: process.env.NODE_ENV === 'production',
  logInterval: 30000, // 30 seconds
  metricsEndpoint: '/api/metrics/realtime'
};

class RealtimeHealthMonitor {
  constructor() {
    this.metrics = {
      subscriptionSetupTime: [],
      presenceUpdateLatency: [],
      messageDeliveryLatency: [],
      subscriptionErrors: 0,
      successfulConnections: 0,
      activeSubscriptions: 0
    };
    
    this.startTime = Date.now();
    this.lastMetricsReport = Date.now();
  }

  // Track subscription setup performance
  trackSubscriptionSetup(startTime, endTime, type) {
    if (!MONITORING_CONFIG.enabled) return;
    
    const duration = endTime - startTime;
    this.metrics.subscriptionSetupTime.push({
      type,
      duration,
      timestamp: Date.now()
    });
    
    this.metrics.successfulConnections++;
    
    console.log(`[Monitor] ${type} subscription setup: ${duration}ms`);
  }

  // Track presence update latency
  trackPresenceUpdate(updateTime) {
    if (!MONITORING_CONFIG.enabled) return;
    
    const latency = Date.now() - updateTime;
    this.metrics.presenceUpdateLatency.push({
      latency,
      timestamp: Date.now()
    });
    
    console.log(`[Monitor] Presence update latency: ${latency}ms`);
  }

  // Track message delivery performance
  trackMessageDelivery(sentTime) {
    if (!MONITORING_CONFIG.enabled) return;
    
    const latency = Date.now() - sentTime;
    this.metrics.messageDeliveryLatency.push({
      latency,
      timestamp: Date.now()
    });
    
    console.log(`[Monitor] Message delivery latency: ${latency}ms`);
  }

  // Track subscription errors
  trackSubscriptionError(error, type) {
    if (!MONITORING_CONFIG.enabled) return;
    
    this.metrics.subscriptionErrors++;
    
    console.error(`[Monitor] ${type} subscription error:`, error);
    
    // Send error to monitoring service
    this.reportError(error, type);
  }

  // Track active subscription count
  updateActiveSubscriptions(count) {
    if (!MONITORING_CONFIG.enabled) return;
    
    this.metrics.activeSubscriptions = count;
  }

  // Generate health report
  generateHealthReport() {
    const now = Date.now();
    const timeSinceStart = now - this.startTime;
    
    // Calculate averages for recent data (last 5 minutes)
    const recentCutoff = now - (5 * 60 * 1000);
    
    const recentSetupTimes = this.metrics.subscriptionSetupTime
      .filter(m => m.timestamp > recentCutoff)
      .map(m => m.duration);
    
    const recentPresenceLatency = this.metrics.presenceUpdateLatency
      .filter(m => m.timestamp > recentCutoff)
      .map(m => m.latency);
    
    const recentMessageLatency = this.metrics.messageDeliveryLatency
      .filter(m => m.timestamp > recentCutoff)
      .map(m => m.latency);

    const report = {
      timestamp: now,
      uptime: timeSinceStart,
      metrics: {
        avgSubscriptionSetupTime: this.calculateAverage(recentSetupTimes),
        avgPresenceLatency: this.calculateAverage(recentPresenceLatency),
        avgMessageLatency: this.calculateAverage(recentMessageLatency),
        totalErrors: this.metrics.subscriptionErrors,
        successfulConnections: this.metrics.successfulConnections,
        activeSubscriptions: this.metrics.activeSubscriptions,
        errorRate: this.metrics.subscriptionErrors / Math.max(this.metrics.successfulConnections, 1)
      },
      health: {
        status: this.determineHealthStatus(),
        issues: this.identifyIssues()
      }
    };

    return report;
  }

  // Calculate average of array
  calculateAverage(arr) {
    if (arr.length === 0) return 0;
    return arr.reduce((sum, val) => sum + val, 0) / arr.length;
  }

  // Determine overall health status
  determineHealthStatus() {
    const report = this.generateHealthReport();
    const metrics = report.metrics;
    
    // Health criteria based on our success metrics
    const criteria = {
      maxSetupTime: 2000, // 2 seconds
      maxPresenceLatency: 2000, // 2 seconds
      maxMessageLatency: 1000, // 1 second
      maxErrorRate: 0.05 // 5%
    };
    
    if (metrics.avgSubscriptionSetupTime > criteria.maxSetupTime ||
        metrics.avgPresenceLatency > criteria.maxPresenceLatency ||
        metrics.avgMessageLatency > criteria.maxMessageLatency ||
        metrics.errorRate > criteria.maxErrorRate) {
      return 'DEGRADED';
    }
    
    return 'HEALTHY';
  }

  // Identify specific issues
  identifyIssues() {
    const issues = [];
    const metrics = this.generateHealthReport().metrics;
    
    if (metrics.avgSubscriptionSetupTime > 2000) {
      issues.push('Slow subscription setup');
    }
    
    if (metrics.avgPresenceLatency > 2000) {
      issues.push('High presence update latency');
    }
    
    if (metrics.avgMessageLatency > 1000) {
      issues.push('High message delivery latency');
    }
    
    if (metrics.errorRate > 0.05) {
      issues.push('High error rate');
    }
    
    if (metrics.activeSubscriptions > 100) {
      issues.push('Potential memory leak - high subscription count');
    }
    
    return issues;
  }

  // Report error to monitoring service
  async reportError(error, type) {
    try {
      await fetch(MONITORING_CONFIG.metricsEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'error',
          category: 'realtime_subscription',
          subcategory: type,
          error: error.message,
          stack: error.stack,
          timestamp: Date.now(),
          userAgent: navigator.userAgent,
          url: window.location.href
        })
      });
    } catch (e) {
      console.warn('Failed to report error to monitoring service:', e);
    }
  }

  // Start periodic reporting
  startPeriodicReporting() {
    if (!MONITORING_CONFIG.enabled) return;
    
    setInterval(() => {
      const report = this.generateHealthReport();
      console.log('[Monitor] Health Report:', report);
      
      // Send to monitoring service
      this.sendHealthReport(report);
      
    }, MONITORING_CONFIG.logInterval);
  }

  // Send health report to monitoring service
  async sendHealthReport(report) {
    try {
      await fetch(MONITORING_CONFIG.metricsEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'health_report',
          ...report
        })
      });
    } catch (e) {
      console.warn('Failed to send health report:', e);
    }
  }
}

// Export for use in useBookDiscussion hook
export const realtimeMonitor = new RealtimeHealthMonitor();

// Auto-start monitoring in production
if (MONITORING_CONFIG.enabled) {
  realtimeMonitor.startPeriodicReporting();
}
