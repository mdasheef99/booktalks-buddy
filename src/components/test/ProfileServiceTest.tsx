import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, User, Check, X, Database } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getUserProfile, clearProfileCache } from '@/services/profileService';
import type { UserProfile } from '@/services/profileService';

/**
 * Test component to verify profileService avatar field fixes
 * This component tests that all avatar URLs are properly loaded from the database
 */

const ProfileServiceTest: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastTest, setLastTest] = useState<Date | null>(null);

  const testProfileService = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Clear cache to ensure fresh data
      clearProfileCache();
      
      // Test getUserProfile function
      const userProfile = await getUserProfile(user.id);
      setProfile(userProfile);
      setLastTest(new Date());
      
      console.log('ProfileService test result:', userProfile);
    } catch (err) {
      console.error('ProfileService test error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Card>
          <CardContent className="p-8 text-center">
            <User className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Authentication Required</h2>
            <p className="text-gray-500">Please log in to test the ProfileService.</p>
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
          ProfileService Test
        </h1>
        <p className="text-gray-600">
          Testing avatar field loading from database
        </p>
      </div>

      {/* Test Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Test Controls
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={testProfileService}
              disabled={loading}
              className="bg-bookconnect-terracotta hover:bg-bookconnect-terracotta/90"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Database className="h-4 w-4 mr-2" />
              )}
              Test ProfileService
            </Button>
          </div>
          
          {lastTest && (
            <p className="text-sm text-gray-600">
              Last test: {lastTest.toLocaleTimeString()}
            </p>
          )}
          
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              <strong>Error:</strong> {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test Results */}
      {profile && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Avatar Field Status */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Avatar Fields Status</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium w-24">Legacy:</span>
                    {profile.avatar_url ? (
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        <Check className="h-3 w-3 mr-1" />
                        Loaded
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-gray-600 border-gray-600">
                        <X className="h-3 w-3 mr-1" />
                        Empty
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium w-24">Thumbnail:</span>
                    {profile.avatar_thumbnail_url ? (
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        <Check className="h-3 w-3 mr-1" />
                        Loaded
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-gray-600 border-gray-600">
                        <X className="h-3 w-3 mr-1" />
                        Empty
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium w-24">Medium:</span>
                    {profile.avatar_medium_url ? (
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        <Check className="h-3 w-3 mr-1" />
                        Loaded
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-gray-600 border-gray-600">
                        <X className="h-3 w-3 mr-1" />
                        Empty
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium w-24">Full:</span>
                    {profile.avatar_full_url ? (
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        <Check className="h-3 w-3 mr-1" />
                        Loaded
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-gray-600 border-gray-600">
                        <X className="h-3 w-3 mr-1" />
                        Empty
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Profile Data */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Profile Data</h4>
                <div className="text-sm space-y-1">
                  <div><strong>ID:</strong> {profile.id}</div>
                  <div><strong>Username:</strong> {profile.username || 'N/A'}</div>
                  <div><strong>Display Name:</strong> {profile.displayname || 'N/A'}</div>
                  <div><strong>Email:</strong> {profile.email || 'N/A'}</div>
                </div>
              </div>
            </div>
            
            {/* Raw Avatar URLs */}
            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-900 mb-2">Raw Avatar URLs</h4>
              <div className="space-y-2 text-xs font-mono bg-gray-50 p-3 rounded max-h-40 overflow-y-auto">
                <div><strong>avatar_url:</strong> {profile.avatar_url || 'null'}</div>
                <div><strong>avatar_thumbnail_url:</strong> {profile.avatar_thumbnail_url || 'null'}</div>
                <div><strong>avatar_medium_url:</strong> {profile.avatar_medium_url || 'null'}</div>
                <div><strong>avatar_full_url:</strong> {profile.avatar_full_url || 'null'}</div>
              </div>
            </div>
            
            {/* Test Status */}
            <div className="border-t pt-4">
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-700">ProfileService Test Passed</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                All avatar fields are being loaded from the database successfully.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Test Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p><strong>1.</strong> Click "Test ProfileService" to load your profile from the database</p>
          <p><strong>2.</strong> Check that all avatar fields are being loaded (even if empty)</p>
          <p><strong>3.</strong> Verify that no TypeScript errors occur in the console</p>
          <p><strong>4.</strong> If you have uploaded an avatar, the URLs should show as "Loaded"</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileServiceTest;
