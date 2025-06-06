import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, User, Check, X } from 'lucide-react';
import { ProfileAvatar } from '@/components/ui/SmartAvatar';
import { useAuth } from '@/contexts/AuthContext';
import { getUserProfile } from '@/services/profileService';
import type { UserProfile } from '@/services/profileService';

/**
 * Test component to verify avatar display functionality
 * This component helps debug avatar display issues after upload
 */

const AvatarDisplayTest: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const loadProfile = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const userProfile = await getUserProfile(user.id);
      setProfile(userProfile);
      setLastRefresh(new Date());
      console.log('Loaded profile:', userProfile);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [user]);

  const handleRefresh = () => {
    loadProfile();
  };

  if (!user) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Card>
          <CardContent className="p-8 text-center">
            <User className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Authentication Required</h2>
            <p className="text-gray-500">Please log in to test avatar display functionality.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Avatar Display Test
        </h1>
        <p className="text-gray-600">
          Testing avatar display functionality after upload
        </p>
      </div>

      {/* Profile Data */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Data
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Avatar Display */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Avatar Display</h4>
              <div className="flex flex-col items-center space-y-3">
                <ProfileAvatar
                  profile={profile}
                  className="border-4 border-white shadow-md"
                />
                <p className="text-sm text-gray-600 text-center">
                  Current avatar display
                </p>
              </div>
            </div>
            
            {/* Avatar URLs */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Avatar URLs</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium w-20">Legacy:</span>
                  {profile?.avatar_url ? (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      <Check className="h-3 w-3 mr-1" />
                      Set
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-red-600 border-red-600">
                      <X className="h-3 w-3 mr-1" />
                      None
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium w-20">Thumb:</span>
                  {profile?.avatar_thumbnail_url ? (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      <Check className="h-3 w-3 mr-1" />
                      Set
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-red-600 border-red-600">
                      <X className="h-3 w-3 mr-1" />
                      None
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium w-20">Medium:</span>
                  {profile?.avatar_medium_url ? (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      <Check className="h-3 w-3 mr-1" />
                      Set
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-red-600 border-red-600">
                      <X className="h-3 w-3 mr-1" />
                      None
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium w-20">Full:</span>
                  {profile?.avatar_full_url ? (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      <Check className="h-3 w-3 mr-1" />
                      Set
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-red-600 border-red-600">
                      <X className="h-3 w-3 mr-1" />
                      None
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Profile Details */}
          <div className="border-t pt-4">
            <h4 className="font-medium text-gray-900 mb-2">Profile Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Username:</span> {profile?.username || 'N/A'}
              </div>
              <div>
                <span className="font-medium">Display Name:</span> {profile?.displayname || 'N/A'}
              </div>
              <div>
                <span className="font-medium">Email:</span> {profile?.email || 'N/A'}
              </div>
              <div>
                <span className="font-medium">Last Refresh:</span> {lastRefresh.toLocaleTimeString()}
              </div>
            </div>
          </div>
          
          {/* Raw URLs for Testing */}
          {profile && (
            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-900 mb-2">Raw URLs (for testing)</h4>
              <div className="space-y-2 text-xs font-mono bg-gray-50 p-3 rounded">
                <div><strong>avatar_url:</strong> {profile.avatar_url || 'null'}</div>
                <div><strong>avatar_thumbnail_url:</strong> {profile.avatar_thumbnail_url || 'null'}</div>
                <div><strong>avatar_medium_url:</strong> {profile.avatar_medium_url || 'null'}</div>
                <div><strong>avatar_full_url:</strong> {profile.avatar_full_url || 'null'}</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Testing Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p><strong>1.</strong> Upload an avatar using the profile form</p>
          <p><strong>2.</strong> Check if the avatar URLs are populated above</p>
          <p><strong>3.</strong> Verify that the avatar displays correctly</p>
          <p><strong>4.</strong> Click "Refresh" to reload profile data from the database</p>
          <p><strong>5.</strong> Test the raw URLs by opening them in a new browser tab</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AvatarDisplayTest;
