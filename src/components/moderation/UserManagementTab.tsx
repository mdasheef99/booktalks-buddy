/**
 * User Management Tab Component
 * 
 * Provides centralized user account management within the ModerationDashboard.
 * Displays recent account actions and provides quick access to user management functions.
 * 
 * Created: 2025-01-17
 * Part of: Phase 3 - Admin Interface Integration
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Users, 
  UserX, 
  UserCheck, 
  Trash2, 
  Clock,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { UserAccountManager } from '@/components/admin/UserAccountManager';
import { getUserAccountStatus, type AccountStatus } from '@/lib/api/admin/accountManagement';
import UserName from '@/components/common/UserName';

// =========================
// Types and Interfaces
// =========================

interface UserManagementTabProps {
  storeId?: string;
}

interface RecentUser {
  id: string;
  username: string | null;
  email: string | null;
  membership_tier: string;
  account_status: string | null;
  status_changed_at: string | null;
  deleted_at: string | null;
}

interface ModerationAction {
  id: string;
  action_type: string;
  target_user_id: string;
  moderator_username: string;
  reason: string;
  created_at: string;
  severity: string;
  status: string;
}

// =========================
// Main Component
// =========================

export const UserManagementTab: React.FC<UserManagementTabProps> = ({ storeId }) => {
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [recentActions, setRecentActions] = useState<ModerationAction[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [userAccountStatuses, setUserAccountStatuses] = useState<Record<string, AccountStatus>>({});
  
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadRecentUsers(),
        loadRecentActions()
      ]);
    } catch (error) {
      console.error('Error loading user management data:', error);
      toast.error('Failed to load user management data');
    } finally {
      setLoading(false);
    }
  };

  const loadRecentUsers = async () => {
    try {
      // Load users with recent status changes or new registrations
      const { data, error } = await supabase
        .from('users')
        .select('id, username, email, membership_tier, account_status, status_changed_at, deleted_at, created_at')
        .or('status_changed_at.not.is.null,account_status.not.is.null')
        .order('status_changed_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      const users = data || [];
      setRecentUsers(users);

      // Load account statuses
      const statuses: Record<string, AccountStatus> = {};
      for (const user of users) {
        try {
          const status = await getUserAccountStatus(user.id);
          statuses[user.id] = status;
        } catch (error) {
          console.error(`Error loading status for user ${user.id}:`, error);
          statuses[user.id] = {
            account_status: user.account_status as any || 'active',
            status_changed_at: user.status_changed_at,
            deleted_at: user.deleted_at
          };
        }
      }
      setUserAccountStatuses(statuses);

    } catch (error) {
      console.error('Error loading recent users:', error);
    }
  };

  const loadRecentActions = async () => {
    try {
      // Load recent moderation actions related to user management
      const { data, error } = await supabase
        .from('moderation_actions')
        .select('id, action_type, target_user_id, moderator_username, reason, created_at, severity, status')
        .in('action_type', ['user_suspension', 'user_ban', 'club_restriction'])
        .order('created_at', { ascending: false })
        .limit(15);

      if (error) throw error;

      setRecentActions(data || []);
    } catch (error) {
      console.error('Error loading recent actions:', error);
    }
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'suspended':
        return <Badge variant="destructive">Suspended</Badge>;
      case 'deleted':
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800">Deleted</Badge>;
      case 'active':
      case null:
        return <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'user_suspension':
        return <UserX className="h-4 w-4 text-orange-500" />;
      case 'user_ban':
        return <Trash2 className="h-4 w-4 text-red-500" />;
      case 'club_restriction':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Users className="h-4 w-4 text-gray-500" />;
    }
  };

  const filteredUsers = recentUsers.filter(user =>
    searchQuery === '' ||
    user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Account Management
          </h3>
          <p className="text-sm text-muted-foreground">
            Manage user accounts, suspensions, and view recent moderation actions
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate('/admin/users')}
            className="flex items-center gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            Full User List
          </Button>
          <Button onClick={loadData} variant="outline" size="sm">
            <Clock className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Account Changes</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search users..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No recent account changes</p>
                </div>
              ) : (
                filteredUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <UserName userId={user.id} linkToProfile />
                        {getStatusBadge(user.account_status)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {user.email} • {user.membership_tier}
                      </p>
                      {user.status_changed_at && (
                        <p className="text-xs text-muted-foreground">
                          Status changed: {new Date(user.status_changed_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    
                    <UserAccountManager
                      userId={user.id}
                      currentStatus={userAccountStatuses[user.id] || { account_status: user.account_status as any || 'active' }}
                      username={user.username || undefined}
                      storeId={storeId}
                      onStatusChange={(newStatus) => {
                        setUserAccountStatuses(prev => ({
                          ...prev,
                          [user.id]: newStatus
                        }));
                        
                        // Update the user in the list
                        setRecentUsers(prev => prev.map(u =>
                          u.id === user.id
                            ? { ...u, account_status: newStatus.account_status, status_changed_at: newStatus.status_changed_at }
                            : u
                        ));
                      }}
                    />
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Moderation Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No recent moderation actions</p>
                </div>
              ) : (
                recentActions.map((action) => (
                  <div key={action.id} className="flex items-start gap-3 p-3 border rounded-lg">
                    {getActionIcon(action.action_type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">
                          {action.action_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {action.severity}
                        </Badge>
                        <Badge variant={action.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                          {action.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">
                        Target: <UserName userId={action.target_user_id} linkToProfile />
                      </p>
                      <p className="text-xs text-muted-foreground mb-1">
                        By: {action.moderator_username}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {action.reason}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(action.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
