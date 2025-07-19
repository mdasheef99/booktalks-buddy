/**
 * ProblematicUsersTable Component
 * 
 * Displays users with subscription/tier mismatches in a detailed, actionable table format.
 * Provides filtering, sorting, and quick action capabilities for store owners.
 * 
 * Created: 2025-01-16
 * Part of: Admin Dashboard Implementation - Phase 2
 */

import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  User, 
  Mail, 
  Shield, 
  Crown, 
  Filter,
  ArrowUpDown,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { getProblematicUsers, type ProblematicUser } from '@/lib/api/admin/subscriptions';

// =========================
// Component Types
// =========================

interface ProblematicUsersTableProps {
  className?: string;
  maxHeight?: string;
  onUserAction?: (userId: string, action: string) => void;
}

type SortField = 'username' | 'membershipTier' | 'severity' | 'actionRequired';
type SortDirection = 'asc' | 'desc';
type SeverityFilter = 'all' | 'critical' | 'warning' | 'info';

// =========================
// Sub-Components
// =========================

const SeverityBadge: React.FC<{ severity: ProblematicUser['severity'] }> = ({ severity }) => {
  const getStyles = () => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'info':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStyles()}`}>
      {severity.charAt(0).toUpperCase() + severity.slice(1)}
    </span>
  );
};

const TierIcon: React.FC<{ tier: string }> = ({ tier }) => {
  switch (tier) {
    case 'PRIVILEGED':
      return <Shield className="h-4 w-4 text-bookconnect-sage" />;
    case 'PRIVILEGED_PLUS':
      return <Crown className="h-4 w-4 text-bookconnect-brown" />;
    default:
      return <User className="h-4 w-4 text-gray-500" />;
  }
};

const LoadingSkeleton: React.FC = () => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
    <div className="flex items-center justify-between mb-4">
      <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
      <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
    </div>
    
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center space-x-4 p-3 border border-gray-200 rounded">
          <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-40 animate-pulse"></div>
          <div className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div>
        </div>
      ))}
    </div>
  </div>
);

// =========================
// Main Component
// =========================

export const ProblematicUsersTable: React.FC<ProblematicUsersTableProps> = ({
  className = '',
  maxHeight = '400px',
  onUserAction
}) => {
  const [users, setUsers] = useState<ProblematicUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Filtering and sorting state
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all');
  const [sortField, setSortField] = useState<SortField>('severity');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // =========================
  // Data Fetching
  // =========================

  const fetchUsers = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) setIsRefreshing(true);
      if (!users.length) setLoading(true);

      const response = await getProblematicUsers();
      
      if (response.success && response.data) {
        setUsers(response.data);
        setError(null);
      } else {
        setError(response.error || 'Failed to fetch problematic users');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleManualRefresh = () => {
    fetchUsers(true);
  };

  // =========================
  // Filtering and Sorting
  // =========================

  const filteredAndSortedUsers = React.useMemo(() => {
    let filtered = users;

    // Apply severity filter
    if (severityFilter !== 'all') {
      filtered = filtered.filter(user => user.severity === severityFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortField) {
        case 'username':
          aValue = a.username || a.email || '';
          bValue = b.username || b.email || '';
          break;
        case 'membershipTier':
          aValue = a.membershipTier;
          bValue = b.membershipTier;
          break;
        case 'severity':
          const severityOrder = { critical: 3, warning: 2, info: 1 };
          aValue = severityOrder[a.severity];
          bValue = severityOrder[b.severity];
          break;
        case 'actionRequired':
          aValue = a.actionRequired;
          bValue = b.actionRequired;
          break;
        default:
          return 0;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue);
        return sortDirection === 'asc' ? comparison : -comparison;
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }

      return 0;
    });

    return filtered;
  }, [users, severityFilter, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const toggleRowExpansion = (userId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId);
    } else {
      newExpanded.add(userId);
    }
    setExpandedRows(newExpanded);
  };

  // =========================
  // Effects
  // =========================

  useEffect(() => {
    fetchUsers();
  }, []);

  // =========================
  // Render Logic
  // =========================

  if (loading && !users.length) {
    return <LoadingSkeleton />;
  }

  if (error && !users.length) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-red-200 p-6 ${className}`}>
        <div className="flex items-center space-x-2 text-red-600 mb-4">
          <AlertTriangle className="h-5 w-5" />
          <span className="font-serif text-lg font-semibold">Problematic Users Unavailable</span>
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

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-serif text-lg font-semibold text-bookconnect-brown">
            Problematic Users
          </h3>
          <p className="font-sans text-sm text-gray-600">
            {filteredAndSortedUsers.length} of {users.length} users requiring attention
          </p>
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

      {/* Filters and Controls */}
      <div className="flex items-center space-x-4 mb-4">
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value as SeverityFilter)}
            className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-bookconnect-brown"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical Only</option>
            <option value="warning">Warning Only</option>
            <option value="info">Info Only</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden border border-gray-200 rounded-lg">
        <div className="overflow-x-auto" style={{ maxHeight }}>
          {filteredAndSortedUsers.length === 0 ? (
            <div className="p-8 text-center">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h4 className="font-serif text-lg font-medium text-gray-900 mb-2">
                No Problematic Users Found
              </h4>
              <p className="text-gray-600">
                {severityFilter === 'all' 
                  ? 'All users have valid subscription/tier combinations.'
                  : `No users found with ${severityFilter} severity issues.`}
              </p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="w-8"></th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('username')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>User</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('membershipTier')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Tier</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('severity')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Severity</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Issue
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('actionRequired')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Action</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAndSortedUsers.map((user) => (
                  <React.Fragment key={user.userId}>
                    <tr className="hover:bg-gray-50">
                      <td className="px-2 py-4">
                        <button
                          onClick={() => toggleRowExpansion(user.userId)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          {expandedRows.has(user.userId) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <div>
                            <div className="font-sans text-sm font-medium text-gray-900">
                              {user.username || 'No username'}
                            </div>
                            {user.email && (
                              <div className="font-sans text-xs text-gray-500 flex items-center space-x-1">
                                <Mail className="h-3 w-3" />
                                <span>{user.email}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <TierIcon tier={user.membershipTier} />
                          <span className="font-sans text-sm text-gray-900">
                            {user.membershipTier.replace('_', ' ')}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <SeverityBadge severity={user.severity} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-sans text-sm text-gray-900 max-w-xs truncate">
                          {user.issueDescription}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-sans text-sm text-gray-700">
                          {user.actionRequired.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                    
                    {/* Expanded Row Details */}
                    {expandedRows.has(user.userId) && (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 bg-gray-50">
                          <div className="space-y-3">
                            <div>
                              <h5 className="font-sans text-sm font-medium text-gray-900 mb-2">
                                Issue Details
                              </h5>
                              <p className="font-sans text-sm text-gray-700">
                                {user.issueDescription}
                              </p>
                            </div>
                            
                            <div>
                              <h5 className="font-sans text-sm font-medium text-gray-900 mb-2">
                                Recommended Action
                              </h5>
                              <p className="font-sans text-sm text-gray-700">
                                {user.actionRequired === 'downgrade_tier' && 
                                  'Downgrade user membership tier to match subscription status.'}
                                {user.actionRequired === 'verify_subscription' && 
                                  'Verify if user has valid subscription that system missed.'}
                                {user.actionRequired === 'contact_user' && 
                                  'Contact user to resolve subscription payment or renewal.'}
                                {user.actionRequired === 'manual_review' && 
                                  'Manual review required - complex subscription situation.'}
                              </p>
                            </div>
                            
                            <div className="flex items-center space-x-2 pt-2">
                              <button
                                onClick={() => onUserAction?.(user.userId, 'view_profile')}
                                className="inline-flex items-center space-x-1 text-bookconnect-brown hover:text-bookconnect-brown/80 text-sm"
                              >
                                <ExternalLink className="h-3 w-3" />
                                <span>View Profile</span>
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProblematicUsersTable;
