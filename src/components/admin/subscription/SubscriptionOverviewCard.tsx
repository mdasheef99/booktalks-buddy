/**
 * SubscriptionOverviewCard Component
 * 
 * Displays comprehensive subscription system metrics in an easily digestible format.
 * Follows BookConnect design patterns and integrates with existing admin dashboard.
 * 
 * Created: 2025-01-16
 * Part of: Admin Dashboard Implementation - Phase 2
 */

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserCheck, 
  UserX, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown,
  RefreshCw,
  Clock,
  Shield,
  Crown
} from 'lucide-react';
import { getSubscriptionOverview, type SubscriptionOverview } from '@/lib/api/admin/subscriptions';

// =========================
// Component Types
// =========================

interface SubscriptionOverviewCardProps {
  className?: string;
  refreshInterval?: number; // Auto-refresh interval in seconds (0 = disabled)
  onDataUpdate?: (data: SubscriptionOverview) => void;
}

interface MetricCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  severity?: 'normal' | 'warning' | 'critical';
  subtitle?: string;
}

// =========================
// Sub-Components
// =========================

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  icon, 
  trend, 
  severity = 'normal',
  subtitle 
}) => {
  const getSeverityStyles = () => {
    switch (severity) {
      case 'critical':
        return 'border-red-200 bg-red-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      default:
        return 'border-gray-200 bg-white';
    }
  };

  const getValueStyles = () => {
    switch (severity) {
      case 'critical':
        return 'text-red-600';
      case 'warning':
        return 'text-yellow-600';
      default:
        return 'text-bookconnect-brown';
    }
  };

  const getTrendIcon = () => {
    if (trend === 'up') return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (trend === 'down') return <TrendingDown className="h-4 w-4 text-red-500" />;
    return null;
  };

  return (
    <div className={`rounded-lg border p-4 ${getSeverityStyles()}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="text-gray-600">{icon}</div>
          <span className="font-sans text-xs text-gray-600 uppercase tracking-wide">
            {title}
          </span>
        </div>
        {getTrendIcon()}
      </div>
      
      <div className="mt-2">
        <div className={`font-mono text-2xl font-bold ${getValueStyles()}`}>
          {value.toLocaleString()}
        </div>
        {subtitle && (
          <div className="font-sans text-xs text-gray-500 mt-1">
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
};

const LoadingSkeleton: React.FC = () => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
    <div className="flex items-center justify-between mb-6">
      <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
      <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-3 bg-gray-200 rounded w-20 animate-pulse"></div>
          </div>
          <div className="h-8 bg-gray-200 rounded w-16 animate-pulse"></div>
        </div>
      ))}
    </div>
  </div>
);

// =========================
// Main Component
// =========================

export const SubscriptionOverviewCard: React.FC<SubscriptionOverviewCardProps> = ({
  className = '',
  refreshInterval = 0,
  onDataUpdate
}) => {
  const [data, setData] = useState<SubscriptionOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // =========================
  // Data Fetching
  // =========================

  const fetchData = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) setIsRefreshing(true);
      if (!data) setLoading(true);

      const response = await getSubscriptionOverview();
      
      if (response.success && response.data) {
        setData(response.data);
        setError(null);
        setLastRefresh(new Date());
        onDataUpdate?.(response.data);
      } else {
        setError(response.error || 'Failed to fetch subscription data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleManualRefresh = () => {
    fetchData(true);
  };

  // =========================
  // Effects
  // =========================

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (refreshInterval > 0) {
      const interval = setInterval(() => {
        fetchData();
      }, refreshInterval * 1000);

      return () => clearInterval(interval);
    }
  }, [refreshInterval]);

  // =========================
  // Render Logic
  // =========================

  if (loading && !data) {
    return <LoadingSkeleton />;
  }

  if (error && !data) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-red-200 p-6 ${className}`}>
        <div className="flex items-center space-x-2 text-red-600 mb-4">
          <AlertTriangle className="h-5 w-5" />
          <span className="font-serif text-lg font-semibold">Subscription Overview Unavailable</span>
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

  if (!data) return null;

  const getHealthStatus = () => {
    if (data.usersWithInvalidEntitlements > 10) return 'critical';
    if (data.usersWithInvalidEntitlements > 0 || data.expiredSubscriptions > 5) return 'warning';
    return 'normal';
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-serif text-lg font-semibold text-bookconnect-brown">
            Subscription Overview
          </h2>
          {lastRefresh && (
            <div className="flex items-center space-x-1 text-xs text-gray-500 mt-1">
              <Clock className="h-3 w-3" />
              <span>Last updated: {lastRefresh.toLocaleTimeString()}</span>
              {data.dataSource === 'fallback_queries' && (
                <span className="text-yellow-600">(Limited data)</span>
              )}
            </div>
          )}
        </div>
        
        <button
          onClick={handleManualRefresh}
          disabled={isRefreshing}
          className="p-2 text-gray-600 hover:text-bookconnect-brown transition-colors disabled:opacity-50"
          title="Refresh data"
        >
          <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard
          title="Active Subscriptions"
          value={data.activeSubscriptions}
          icon={<UserCheck className="h-4 w-4" />}
          subtitle="Currently valid"
        />
        
        <MetricCard
          title="Expired Subscriptions"
          value={data.expiredSubscriptions}
          icon={<UserX className="h-4 w-4" />}
          severity={data.expiredSubscriptions > 5 ? 'warning' : 'normal'}
          subtitle="Need processing"
        />
        
        <MetricCard
          title="Invalid Entitlements"
          value={data.usersWithInvalidEntitlements}
          icon={<AlertTriangle className="h-4 w-4" />}
          severity={data.usersWithInvalidEntitlements > 0 ? 'critical' : 'normal'}
          subtitle="Require attention"
        />
        
        <MetricCard
          title="Privileged Users"
          value={data.privilegedUsers}
          icon={<Shield className="h-4 w-4" />}
          subtitle="Standard premium"
        />
        
        <MetricCard
          title="Privileged Plus Users"
          value={data.privilegedPlusUsers}
          icon={<Crown className="h-4 w-4" />}
          subtitle="Premium plus"
        />
        
        <MetricCard
          title="Total Users"
          value={data.totalUsers}
          icon={<Users className="h-4 w-4" />}
          subtitle="All membership tiers"
        />
      </div>

      {/* System Health Indicator */}
      {getHealthStatus() !== 'normal' && (
        <div className={`mt-4 p-3 rounded-md ${
          getHealthStatus() === 'critical' 
            ? 'bg-red-50 border border-red-200' 
            : 'bg-yellow-50 border border-yellow-200'
        }`}>
          <div className="flex items-center space-x-2">
            <AlertTriangle className={`h-4 w-4 ${
              getHealthStatus() === 'critical' ? 'text-red-500' : 'text-yellow-500'
            }`} />
            <span className={`font-sans text-sm font-medium ${
              getHealthStatus() === 'critical' ? 'text-red-800' : 'text-yellow-800'
            }`}>
              {getHealthStatus() === 'critical' ? 'Critical Issues Detected' : 'System Warnings'}
            </span>
          </div>
          <p className={`font-sans text-xs mt-1 ${
            getHealthStatus() === 'critical' ? 'text-red-700' : 'text-yellow-700'
          }`}>
            {data.usersWithInvalidEntitlements > 0 && 
              `${data.usersWithInvalidEntitlements} users have subscription/tier mismatches. `}
            {data.expiredSubscriptions > 5 && 
              `${data.expiredSubscriptions} expired subscriptions need processing.`}
          </p>
        </div>
      )}
    </div>
  );
};

export default SubscriptionOverviewCard;
