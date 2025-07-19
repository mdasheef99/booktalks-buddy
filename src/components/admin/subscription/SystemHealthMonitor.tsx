/**
 * SystemHealthMonitor Component
 * 
 * Provides real-time system health overview with actionable insights for store owners.
 * Displays health score, issues, and recommendations in a compact, informative format.
 * 
 * Created: 2025-01-16
 * Part of: Admin Dashboard Implementation - Phase 2
 */

import React, { useState, useEffect } from 'react';
import { 
  Heart,
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Clock,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Activity,
  Shield
} from 'lucide-react';
import { getSystemHealth, type SystemHealth } from '@/lib/api/admin/subscriptions';

// =========================
// Component Types
// =========================

interface SystemHealthMonitorProps {
  className?: string;
  autoRefresh?: boolean;
  refreshInterval?: number; // seconds
  compact?: boolean;
}

// =========================
// Sub-Components
// =========================

const HealthGauge: React.FC<{ score: number; status: SystemHealth['status'] }> = ({ score, status }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusBgColor = () => {
    switch (status) {
      case 'healthy': return 'bg-green-100';
      case 'warning': return 'bg-yellow-100';
      case 'critical': return 'bg-red-100';
      default: return 'bg-gray-100';
    }
  };

  const getGaugeColor = () => {
    if (score >= 90) return 'stroke-green-500';
    if (score >= 70) return 'stroke-yellow-500';
    if (score >= 50) return 'stroke-orange-500';
    return 'stroke-red-500';
  };

  const circumference = 2 * Math.PI * 45; // radius = 45
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="flex items-center space-x-4">
      <div className="relative">
        <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-gray-200"
          />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            className={getGaugeColor()}
            style={{
              transition: 'stroke-dashoffset 0.5s ease-in-out',
            }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold text-gray-900">{score}</span>
        </div>
      </div>
      
      <div>
        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusBgColor()} ${getStatusColor()}`}>
          {status === 'healthy' && <CheckCircle className="h-4 w-4 mr-1" />}
          {status === 'warning' && <AlertTriangle className="h-4 w-4 mr-1" />}
          {status === 'critical' && <XCircle className="h-4 w-4 mr-1" />}
          {status === 'unknown' && <Activity className="h-4 w-4 mr-1" />}
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          Health Score: {score}/100
        </div>
      </div>
    </div>
  );
};

const IssuesList: React.FC<{ 
  issues: string[]; 
  recommendations: string[];
  criticalCount: number;
  warningCount: number;
  compact?: boolean;
}> = ({ issues, recommendations, criticalCount, warningCount, compact = false }) => {
  const [showAll, setShowAll] = useState(false);
  const displayLimit = compact ? 2 : 3;
  
  if (issues.length === 0) {
    return (
      <div className="flex items-center space-x-2 text-green-600">
        <CheckCircle className="h-4 w-4" />
        <span className="font-sans text-sm">No issues detected</span>
      </div>
    );
  }

  const displayedIssues = showAll ? issues : issues.slice(0, displayLimit);
  const displayedRecommendations = showAll ? recommendations : recommendations.slice(0, displayLimit);

  return (
    <div className="space-y-3">
      {/* Issue Summary */}
      <div className="flex items-center space-x-4 text-sm">
        {criticalCount > 0 && (
          <div className="flex items-center space-x-1 text-red-600">
            <XCircle className="h-4 w-4" />
            <span>{criticalCount} Critical</span>
          </div>
        )}
        {warningCount > 0 && (
          <div className="flex items-center space-x-1 text-yellow-600">
            <AlertTriangle className="h-4 w-4" />
            <span>{warningCount} Warning</span>
          </div>
        )}
      </div>

      {/* Issues List */}
      {displayedIssues.length > 0 && (
        <div>
          <h5 className="font-sans text-sm font-medium text-gray-900 mb-2">Current Issues</h5>
          <ul className="space-y-1">
            {displayedIssues.map((issue, index) => (
              <li key={index} className="flex items-start space-x-2 text-sm">
                <AlertTriangle className="h-3 w-3 text-red-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">{issue}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommendations List */}
      {displayedRecommendations.length > 0 && (
        <div>
          <h5 className="font-sans text-sm font-medium text-gray-900 mb-2">Recommendations</h5>
          <ul className="space-y-1">
            {displayedRecommendations.map((rec, index) => (
              <li key={index} className="flex items-start space-x-2 text-sm">
                <TrendingUp className="h-3 w-3 text-blue-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Show More/Less Toggle */}
      {(issues.length > displayLimit || recommendations.length > displayLimit) && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="text-bookconnect-brown hover:text-bookconnect-brown/80 text-sm font-medium"
        >
          {showAll ? 'Show Less' : `Show All (${issues.length + recommendations.length} items)`}
        </button>
      )}
    </div>
  );
};

const LoadingSkeleton: React.FC<{ compact?: boolean }> = ({ compact = false }) => (
  <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${compact ? 'p-4' : 'p-6'}`}>
    <div className="flex items-center justify-between mb-4">
      <div className="h-5 bg-gray-200 rounded w-32 animate-pulse"></div>
      <div className="h-6 w-6 bg-gray-200 rounded animate-pulse"></div>
    </div>
    
    <div className="flex items-center space-x-4 mb-4">
      <div className="h-16 w-16 bg-gray-200 rounded-full animate-pulse"></div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
        <div className="h-3 bg-gray-200 rounded w-16 animate-pulse"></div>
      </div>
    </div>
    
    <div className="space-y-2">
      <div className="h-3 bg-gray-200 rounded w-full animate-pulse"></div>
      <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse"></div>
      <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse"></div>
    </div>
  </div>
);

// =========================
// Main Component
// =========================

export const SystemHealthMonitor: React.FC<SystemHealthMonitorProps> = ({
  className = '',
  autoRefresh = true,
  refreshInterval = 30,
  compact = false
}) => {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // =========================
  // Data Fetching
  // =========================

  const fetchHealth = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) setIsRefreshing(true);
      if (!health) setLoading(true);

      const response = await getSystemHealth();
      
      if (response.success && response.data) {
        setHealth(response.data);
        setError(null);
        setLastRefresh(new Date());
      } else {
        setError(response.error || 'Failed to fetch system health');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleManualRefresh = () => {
    fetchHealth(true);
  };

  // =========================
  // Effects
  // =========================

  useEffect(() => {
    fetchHealth();
  }, []);

  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      const interval = setInterval(() => {
        fetchHealth();
      }, refreshInterval * 1000);

      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  // =========================
  // Render Logic
  // =========================

  if (loading && !health) {
    return <LoadingSkeleton compact={compact} />;
  }

  if (error && !health) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-red-200 ${compact ? 'p-4' : 'p-6'} ${className}`}>
        <div className="flex items-center space-x-2 text-red-600 mb-4">
          <XCircle className="h-5 w-5" />
          <span className="font-serif text-lg font-semibold">System Health Unavailable</span>
        </div>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={handleManualRefresh}
          className="bg-bookconnect-brown text-white px-4 py-2 rounded-md hover:bg-bookconnect-brown/90 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!health) return null;

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${compact ? 'p-4' : 'p-6'} ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-serif text-lg font-semibold text-bookconnect-brown flex items-center space-x-2">
            <Heart className="h-5 w-5" />
            <span>System Health</span>
          </h3>
          {lastRefresh && (
            <div className="flex items-center space-x-1 text-xs text-gray-500 mt-1">
              <Clock className="h-3 w-3" />
              <span>Updated: {lastRefresh.toLocaleTimeString()}</span>
            </div>
          )}
        </div>
        
        <button
          onClick={handleManualRefresh}
          disabled={isRefreshing}
          className="p-2 text-gray-600 hover:text-bookconnect-brown transition-colors disabled:opacity-50"
          title="Refresh health status"
        >
          <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Health Score and Status */}
      <div className="mb-6">
        <HealthGauge score={health.score} status={health.status} />
      </div>

      {/* Issues and Recommendations */}
      <IssuesList
        issues={health.issues}
        recommendations={health.recommendations}
        criticalCount={health.criticalIssueCount}
        warningCount={health.warningIssueCount}
        compact={compact}
      />

      {/* Last Health Check Info */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Last system check: {new Date(health.lastChecked).toLocaleString()}</span>
          {autoRefresh && (
            <span>Auto-refresh: {refreshInterval}s</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default SystemHealthMonitor;
