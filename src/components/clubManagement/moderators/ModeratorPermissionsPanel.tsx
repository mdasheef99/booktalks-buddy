/**
 * Moderator Permissions Panel Component
 *
 * Allows club leads to manage moderator permissions,
 * including analytics access toggles.
 */

import React, { useState } from 'react';
import { Shield, BarChart3, Settings, Users, MessageSquare, Palette, Save, AlertCircle, Plus, UserPlus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useClubModerators } from '@/hooks/useClubManagement';
import { ModeratorsErrorBoundary } from '@/components/clubManagement/ClubManagementErrorBoundary';
import AddModeratorDialog from './AddModeratorDialog';

interface ModeratorPermissionsPanelProps {
  clubId: string;
  isClubLead?: boolean;
}

interface PermissionConfig {
  key: keyof ModeratorPermissions;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  comingSoon?: boolean;
}

interface ModeratorPermissions {
  analytics_access: boolean;
  meeting_management_access: boolean;
  customization_access: boolean;
  content_moderation_access: boolean;
  member_management_access: boolean;
}

const ModeratorPermissionsPanel: React.FC<ModeratorPermissionsPanelProps> = ({
  clubId,
  isClubLead = false
}) => {
  const { moderators, loading, error, updatePermissions, refresh } = useClubModerators(clubId);
  const [saving, setSaving] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);

  const permissionConfigs: PermissionConfig[] = [
    {
      key: 'analytics_access',
      label: 'Analytics Access',
      description: 'View club analytics and metrics',
      icon: <BarChart3 className="h-4 w-4" />,
      color: 'text-blue-600'
    },
    {
      key: 'content_moderation_access',
      label: 'Content Moderation',
      description: 'Moderate discussions and posts',
      icon: <MessageSquare className="h-4 w-4" />,
      color: 'text-green-600'
    },
    {
      key: 'meeting_management_access',
      label: 'Meeting Management',
      description: 'Create and manage club meetings',
      icon: <Settings className="h-4 w-4" />,
      color: 'text-purple-600',
      comingSoon: true
    },
    {
      key: 'member_management_access',
      label: 'Member Management',
      description: 'Manage club membership',
      icon: <Users className="h-4 w-4" />,
      color: 'text-orange-600'
    },
    {
      key: 'customization_access',
      label: 'Club Customization',
      description: 'Customize club appearance',
      icon: <Palette className="h-4 w-4" />,
      color: 'text-pink-600',
      comingSoon: true
    }
  ];

  const handlePermissionToggle = async (
    moderatorId: string,
    permissionKey: keyof ModeratorPermissions,
    enabled: boolean
  ) => {
    setSaving(moderatorId);
    setSaveError(null);

    try {
      await updatePermissions(moderatorId, {
        [permissionKey]: enabled
      });
    } catch (err) {
      console.error('Failed to update permissions:', err);
      setSaveError('Failed to update permissions. Please try again.');
    } finally {
      setSaving(null);
    }
  };

  const handleAddModerator = () => {
    setShowAddDialog(true);
  };

  const handleModeratorAdded = async () => {
    // Refresh the moderators list to show the new moderator
    await refresh();
  };

  // Permission check
  if (!isClubLead) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Shield className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Club Lead Access Required</h3>
          <p className="text-gray-600 text-center max-w-md">
            Only club leads can manage moderator permissions.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Loading state
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Moderator Permissions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                    <div className="space-y-2">
                      <div className="h-4 w-32 bg-gray-200 rounded"></div>
                      <div className="h-3 w-24 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                  <div className="h-6 w-12 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
          <h3 className="text-lg font-semibold text-red-900 mb-2">Failed to Load Moderators</h3>
          <p className="text-red-600 text-center max-w-md">{error}</p>
        </CardContent>
      </Card>
    );
  }

  const activeModerators = moderators.filter(mod => mod.is_active && mod.role === 'moderator');

  return (
    <ModeratorsErrorBoundary clubId={clubId}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Moderator Permissions
              </CardTitle>
              <CardDescription>
                Manage what moderators can access and control in your club
              </CardDescription>
            </div>
            {activeModerators.length > 0 && (
              <Button
                onClick={handleAddModerator}
                className="flex items-center gap-2"
                variant="outline"
              >
                <UserPlus className="h-4 w-4" />
                Add Moderator
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {saveError && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{saveError}</AlertDescription>
            </Alert>
          )}

          {activeModerators.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Moderators</h3>
              <p className="text-gray-600 mb-6">
                You haven't appointed any moderators yet. Add moderators to help manage your club.
              </p>
              <Button
                onClick={handleAddModerator}
                className="flex items-center gap-2"
              >
                <UserPlus className="h-4 w-4" />
                Add Moderator
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {activeModerators.map((moderator) => (
                <div key={moderator.id} className="border rounded-lg p-4 space-y-4">
                  {/* Moderator Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Shield className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {moderator.user?.display_name || moderator.user?.username || `Moderator ${moderator.user_id.slice(-8)}`}
                        </div>
                        {moderator.user?.display_name && moderator.user?.username && (
                          <div className="text-sm text-gray-500">
                            @{moderator.user.username}
                          </div>
                        )}
                        <div className="text-sm text-gray-600">
                          Appointed {new Date(moderator.appointed_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <Badge variant="secondary">Moderator</Badge>
                  </div>

                  {/* Permissions Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {permissionConfigs.map((config) => {
                      const isEnabled = moderator[config.key];
                      const isSaving = saving === moderator.id;

                      return (
                        <div
                          key={config.key}
                          className={`flex items-center justify-between p-3 rounded-lg border ${
                            config.comingSoon ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-200'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`${config.color} ${config.comingSoon ? 'opacity-50' : ''}`}>
                              {config.icon}
                            </div>
                            <div>
                              <div className={`font-medium text-sm ${config.comingSoon ? 'text-gray-500' : 'text-gray-900'}`}>
                                {config.label}
                                {config.comingSoon && (
                                  <Badge variant="outline" className="ml-2 text-xs">
                                    Coming Soon
                                  </Badge>
                                )}
                              </div>
                              <div className={`text-xs ${config.comingSoon ? 'text-gray-400' : 'text-gray-600'}`}>
                                {config.description}
                              </div>
                            </div>
                          </div>
                          <Switch
                            checked={isEnabled}
                            disabled={isSaving || config.comingSoon}
                            onCheckedChange={(checked) =>
                              handlePermissionToggle(moderator.id, config.key, checked)
                            }
                          />
                        </div>
                      );
                    })}
                  </div>

                  {/* Saving Indicator */}
                  {saving === moderator.id && (
                    <div className="flex items-center gap-2 text-sm text-blue-600">
                      <Save className="h-4 w-4 animate-spin" />
                      Saving permissions...
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Permission Info */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">📋 Permission Guide</h4>
            <div className="text-sm text-blue-800 space-y-1">
              <p><strong>Analytics Access:</strong> View club statistics and member activity</p>
              <p><strong>Content Moderation:</strong> Delete posts and manage discussions</p>
              <p><strong>Member Management:</strong> Add/remove members and manage roles</p>
              <p className="text-blue-600"><strong>Note:</strong> Some features are coming in future phases</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Moderator Dialog */}
      <AddModeratorDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        clubId={clubId}
        onSuccess={handleModeratorAdded}
      />
    </ModeratorsErrorBoundary>
  );
};

export default ModeratorPermissionsPanel;
