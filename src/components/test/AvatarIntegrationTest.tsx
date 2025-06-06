import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

// Import all avatar components
import SmartAvatar, {
  NavAvatar,
  NavAvatarLarge,
  ListAvatar,
  CardAvatar,
  CardAvatarLarge,
  ProfileAvatar,
  ProfileAvatarLarge,
  ProfileAvatarXL,
  MessageAvatar,
  CommentAvatar,
  MentionAvatar,
  AvatarGroup
} from '@/components/ui/SmartAvatar';

import UserAvatar from '@/components/common/UserAvatar';
import AvatarSelector from '@/components/profile/AvatarSelector';
import { ProfileImageService } from '@/services/ProfileImageService';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Comprehensive test component for the multi-tier avatar system
 * This component demonstrates all avatar variants and tests the upload functionality
 */

const AvatarIntegrationTest: React.FC = () => {
  const { user } = useAuth();
  const [testProfile, setTestProfile] = useState({
    id: user?.id || 'test-user',
    username: 'testuser',
    displayname: 'Test User',
    email: 'test@example.com',
    avatar_url: null,
    avatar_thumbnail_url: null,
    avatar_medium_url: null,
    avatar_full_url: null,
    bio: 'Testing the multi-tier avatar system'
  });

  const [uploading, setUploading] = useState(false);

  // Test file upload
  const handleTestUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      const avatarUrls = await ProfileImageService.uploadAvatar(
        file,
        user.id,
        (progress) => {
          console.log('Upload progress:', progress);
        }
      );

      // Update test profile with new URLs
      setTestProfile(prev => ({
        ...prev,
        avatar_url: avatarUrls.legacy,
        avatar_thumbnail_url: avatarUrls.thumbnail,
        avatar_medium_url: avatarUrls.medium,
        avatar_full_url: avatarUrls.full
      }));

      toast.success('Test upload successful!');
    } catch (error) {
      console.error('Test upload failed:', error);
      toast.error('Test upload failed');
    } finally {
      setUploading(false);
    }
  };

  // Reset test profile
  const resetProfile = () => {
    setTestProfile(prev => ({
      ...prev,
      avatar_url: null,
      avatar_thumbnail_url: null,
      avatar_medium_url: null,
      avatar_full_url: null
    }));
  };

  const mockProfiles = [
    { ...testProfile, id: '1', username: 'user1', displayname: 'User One' },
    { ...testProfile, id: '2', username: 'user2', displayname: 'User Two' },
    { ...testProfile, id: '3', username: 'user3', displayname: 'User Three' },
  ];

  return (
    <div className="p-6 space-y-8 max-w-6xl mx-auto">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Multi-Tier Avatar System Test
        </h1>
        <p className="text-gray-600">
          Testing all avatar components and upload functionality
        </p>
      </div>

      {/* Upload Test Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Test
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <label htmlFor="test-upload" className="cursor-pointer">
              <Button disabled={uploading} asChild>
                <span>
                  {uploading ? 'Uploading...' : 'Test Upload'}
                </span>
              </Button>
            </label>
            <input
              id="test-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleTestUpload}
              disabled={uploading}
            />
            <Button variant="outline" onClick={resetProfile}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>
          
          <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <p className="text-sm font-medium mb-2">Thumbnail (100x100)</p>
              <div className="h-16 w-16 mx-auto bg-white rounded border-2 border-dashed border-gray-300 flex items-center justify-center">
                {testProfile.avatar_thumbnail_url ? (
                  <img src={testProfile.avatar_thumbnail_url} alt="Thumbnail" className="h-full w-full object-cover rounded" />
                ) : (
                  <span className="text-xs text-gray-400">None</span>
                )}
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium mb-2">Medium (300x300)</p>
              <div className="h-16 w-16 mx-auto bg-white rounded border-2 border-dashed border-gray-300 flex items-center justify-center">
                {testProfile.avatar_medium_url ? (
                  <img src={testProfile.avatar_medium_url} alt="Medium" className="h-full w-full object-cover rounded" />
                ) : (
                  <span className="text-xs text-gray-400">None</span>
                )}
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium mb-2">Full (600x600)</p>
              <div className="h-16 w-16 mx-auto bg-white rounded border-2 border-dashed border-gray-300 flex items-center justify-center">
                {testProfile.avatar_full_url ? (
                  <img src={testProfile.avatar_full_url} alt="Full" className="h-full w-full object-cover rounded" />
                ) : (
                  <span className="text-xs text-gray-400">None</span>
                )}
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium mb-2">Legacy</p>
              <div className="h-16 w-16 mx-auto bg-white rounded border-2 border-dashed border-gray-300 flex items-center justify-center">
                {testProfile.avatar_url ? (
                  <img src={testProfile.avatar_url} alt="Legacy" className="h-full w-full object-cover rounded" />
                ) : (
                  <span className="text-xs text-gray-400">None</span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SmartAvatar Variants */}
      <Card>
        <CardHeader>
          <CardTitle>SmartAvatar Variants</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            <div className="text-center space-y-2">
              <MentionAvatar profile={testProfile as any} />
              <Badge variant="outline">Mention (24px)</Badge>
            </div>
            <div className="text-center space-y-2">
              <CommentAvatar profile={testProfile as any} />
              <Badge variant="outline">Comment (32px)</Badge>
            </div>
            <div className="text-center space-y-2">
              <NavAvatar profile={testProfile as any} />
              <Badge variant="outline">Nav (32px)</Badge>
            </div>
            <div className="text-center space-y-2">
              <MessageAvatar profile={testProfile as any} />
              <Badge variant="outline">Message (36px)</Badge>
            </div>
            <div className="text-center space-y-2">
              <NavAvatarLarge profile={testProfile as any} />
              <Badge variant="outline">Nav Large (40px)</Badge>
            </div>
            <div className="text-center space-y-2">
              <ListAvatar profile={testProfile as any} />
              <Badge variant="outline">List (48px)</Badge>
            </div>
            <div className="text-center space-y-2">
              <CardAvatar profile={testProfile as any} />
              <Badge variant="outline">Card (64px)</Badge>
            </div>
            <div className="text-center space-y-2">
              <CardAvatarLarge profile={testProfile as any} />
              <Badge variant="outline">Card Large (80px)</Badge>
            </div>
            <div className="text-center space-y-2">
              <ProfileAvatar profile={testProfile as any} />
              <Badge variant="outline">Profile (96px)</Badge>
            </div>
            <div className="text-center space-y-2">
              <ProfileAvatarLarge profile={testProfile as any} />
              <Badge variant="outline">Profile Large (128px)</Badge>
            </div>
            <div className="text-center space-y-2">
              <ProfileAvatarXL profile={testProfile as any} />
              <Badge variant="outline">Profile XL (160px)</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Legacy UserAvatar Component */}
      <Card>
        <CardHeader>
          <CardTitle>Legacy UserAvatar Component (Updated)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="text-center space-y-2">
              <UserAvatar userId={testProfile.id} size="xxs" />
              <Badge variant="outline">XXS</Badge>
            </div>
            <div className="text-center space-y-2">
              <UserAvatar userId={testProfile.id} size="xs" />
              <Badge variant="outline">XS</Badge>
            </div>
            <div className="text-center space-y-2">
              <UserAvatar userId={testProfile.id} size="sm" />
              <Badge variant="outline">SM</Badge>
            </div>
            <div className="text-center space-y-2">
              <UserAvatar userId={testProfile.id} size="md" />
              <Badge variant="outline">MD</Badge>
            </div>
            <div className="text-center space-y-2">
              <UserAvatar userId={testProfile.id} size="lg" />
              <Badge variant="outline">LG</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Avatar Group */}
      <Card>
        <CardHeader>
          <CardTitle>Avatar Group</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-2">Small group (max 3)</p>
              <AvatarGroup profiles={mockProfiles} context="listItem" max={3} />
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-2">Large group (max 5)</p>
              <AvatarGroup profiles={[...mockProfiles, ...mockProfiles]} context="card" max={5} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AvatarSelector Component */}
      <Card>
        <CardHeader>
          <CardTitle>AvatarSelector Component</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <AvatarSelector
              currentAvatarUrl={testProfile.avatar_url || ''}
              onAvatarChange={(url) => setTestProfile(prev => ({ ...prev, avatar_url: url }))}
              userProfile={testProfile}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AvatarIntegrationTest;
