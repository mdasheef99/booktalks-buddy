import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, Upload, Check } from 'lucide-react';
import ProfileForm from '@/components/profile/ProfileForm/ProfileForm';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Test component for the integrated profile form with avatar upload
 * This component demonstrates the complete profile editing workflow including avatar upload
 */

const ProfileFormIntegrationTest: React.FC = () => {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [profileUpdated, setProfileUpdated] = useState(false);

  const handleProfileUpdated = () => {
    setProfileUpdated(true);
    setShowForm(false);
    setTimeout(() => setProfileUpdated(false), 3000);
  };

  const handleCancel = () => {
    setShowForm(false);
  };

  if (!user) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Card>
          <CardContent className="p-8 text-center">
            <User className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Authentication Required</h2>
            <p className="text-gray-500">Please log in to test the profile form integration.</p>
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
          Profile Form Integration Test
        </h1>
        <p className="text-gray-600">
          Testing the complete profile editing workflow with avatar upload functionality
        </p>
      </div>

      {/* Success Message */}
      {profileUpdated && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 text-green-700">
              <Check className="h-5 w-5" />
              <span className="font-medium">Profile updated successfully!</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Integration Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Features Integrated:</h4>
              <div className="space-y-1">
                <Badge variant="outline" className="text-green-600 border-green-600">
                  ✓ Avatar Upload in ProfileForm
                </Badge>
                <Badge variant="outline" className="text-green-600 border-green-600">
                  ✓ Multi-Tier Image Processing
                </Badge>
                <Badge variant="outline" className="text-green-600 border-green-600">
                  ✓ Database Integration
                </Badge>
                <Badge variant="outline" className="text-green-600 border-green-600">
                  ✓ Progress Tracking
                </Badge>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">User Info:</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>User ID:</strong> {user.id}</p>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Form Status:</strong> {showForm ? 'Open' : 'Closed'}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Test Controls</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={() => setShowForm(true)}
              disabled={showForm}
              className="bg-bookconnect-terracotta hover:bg-bookconnect-terracotta/90"
            >
              {showForm ? 'Form Already Open' : 'Open Profile Form'}
            </Button>
            
            {showForm && (
              <Button
                variant="outline"
                onClick={() => setShowForm(false)}
              >
                Close Form
              </Button>
            )}
          </div>
          
          <div className="text-sm text-gray-600">
            <p><strong>Test Instructions:</strong></p>
            <ol className="list-decimal list-inside space-y-1 mt-2">
              <li>Click "Open Profile Form" to display the integrated form</li>
              <li>Try uploading a profile picture using the avatar selector</li>
              <li>Fill in other profile information (display name, bio, etc.)</li>
              <li>Save the form to test the complete workflow</li>
              <li>Verify that all avatar sizes are generated and saved</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {/* Profile Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Integrated Profile Form</CardTitle>
          </CardHeader>
          <CardContent>
            <ProfileForm
              onCancel={handleCancel}
              onProfileUpdated={handleProfileUpdated}
            />
          </CardContent>
        </Card>
      )}

      {/* Technical Details */}
      <Card>
        <CardHeader>
          <CardTitle>Technical Implementation Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Components Updated:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• <code>ProfileForm.tsx</code> - Added avatar handling</li>
                <li>• <code>BasicInfoSection.tsx</code> - Integrated AvatarSelector</li>
                <li>• <code>useProfileFormData.ts</code> - Added avatar URLs</li>
                <li>• <code>AvatarSelector.tsx</code> - Multi-tier callback</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Database Fields:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• <code>avatar_url</code> - Legacy compatibility</li>
                <li>• <code>avatar_thumbnail_url</code> - 100x100 size</li>
                <li>• <code>avatar_medium_url</code> - 300x300 size</li>
                <li>• <code>avatar_full_url</code> - 600x600 size</li>
              </ul>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Workflow:</h4>
            <div className="text-sm text-gray-600">
              <p>1. User uploads image via AvatarSelector in BasicInfoSection</p>
              <p>2. ProfileImageService processes image into 3 optimized sizes</p>
              <p>3. All avatar URLs are updated in ProfileFormData</p>
              <p>4. Form save updates both auth metadata and users table</p>
              <p>5. Multi-tier avatar system is fully integrated</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileFormIntegrationTest;
