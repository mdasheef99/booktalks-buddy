import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import UserName from '@/components/common/UserName';
import UsernameField from '@/components/forms/UsernameField';
import DisplayNameField from '@/components/forms/DisplayNameField';
import { EnhancedUsernameDialog } from '@/components/dialogs/EnhancedUsernameDialog';
import { formatUserIdentity } from '@/utils/usernameValidation';

const DualIdentityDemo: React.FC = () => {
  const [showDialog, setShowDialog] = useState(false);
  const [demoUsername, setDemoUsername] = useState('bookworm_jane');
  const [demoDisplayName, setDemoDisplayName] = useState('Jane Smith');

  // Mock user ID for demo purposes
  const mockUserId = 'demo-user-123';

  const handleDialogComplete = (username: string, displayName?: string) => {
    console.log('New identity created:', { username, displayName });
    setShowDialog(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-bookconnect-brown mb-2">
          Dual-Identity System Demo
        </h1>
        <p className="text-gray-600">
          BookConnect's new username and display name system in action
        </p>
      </div>

      {/* Display Format Examples */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Display Format Examples</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Badge variant="outline">Display Primary</Badge>
            <p className="text-sm text-gray-600">Shows display name, falls back to username</p>
            <div className="p-3 bg-gray-50 rounded">
              {formatUserIdentity(demoDisplayName, demoUsername, 'display-primary')}
            </div>
          </div>
          
          <div className="space-y-2">
            <Badge variant="outline">Full Format</Badge>
            <p className="text-sm text-gray-600">Shows both display name and username</p>
            <div className="p-3 bg-gray-50 rounded">
              {formatUserIdentity(demoDisplayName, demoUsername, 'full')}
            </div>
          </div>
          
          <div className="space-y-2">
            <Badge variant="outline">Username Primary</Badge>
            <p className="text-sm text-gray-600">Shows username first, display name secondary</p>
            <div className="p-3 bg-gray-50 rounded">
              {formatUserIdentity(demoDisplayName, demoUsername, 'username-primary')}
            </div>
          </div>
        </div>
      </Card>

      {/* Context Examples */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Context-Appropriate Display</h2>
        <div className="space-y-4">
          <div className="border rounded p-4">
            <h3 className="font-medium mb-2">Discussion Post (Social Context)</h3>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
              <span>
                {formatUserIdentity(demoDisplayName, demoUsername, 'full')} • 2 hours ago
              </span>
            </div>
            <p className="mt-2 text-gray-800">
              "I just finished reading this amazing book! The character development was incredible..."
            </p>
          </div>

          <div className="border rounded p-4">
            <h3 className="font-medium mb-2">Member List (Community Context)</h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div>
                <div className="font-medium">
                  {formatUserIdentity(demoDisplayName, demoUsername, 'display-primary')}
                </div>
                <div className="text-sm text-gray-500">@{demoUsername} • Club Moderator</div>
              </div>
            </div>
          </div>

          <div className="border rounded p-4">
            <h3 className="font-medium mb-2">Moderation Dashboard (Administrative Context)</h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm">{demoUsername}</span>
                <span className="text-gray-500">({demoDisplayName})</span>
              </div>
              <Badge variant="secondary">3 reports</Badge>
            </div>
          </div>
        </div>
      </Card>

      {/* Interactive Demo */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Interactive Demo</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="font-medium">Customize Identity</h3>
            <UsernameField
              value={demoUsername}
              onChange={setDemoUsername}
              placeholder="Enter username"
              showSuggestions={false}
            />
            <DisplayNameField
              value={demoDisplayName}
              onChange={setDemoDisplayName}
              placeholder="Enter display name"
            />
          </div>
          
          <div className="space-y-4">
            <h3 className="font-medium">Live Preview</h3>
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 rounded">
                <p className="text-xs text-blue-600 mb-1">Social contexts:</p>
                <p className="font-medium">
                  {formatUserIdentity(demoDisplayName, demoUsername, 'full')}
                </p>
              </div>
              <div className="p-3 bg-green-50 rounded">
                <p className="text-xs text-green-600 mb-1">Friendly display:</p>
                <p className="font-medium">
                  {formatUserIdentity(demoDisplayName, demoUsername, 'display-primary')}
                </p>
              </div>
              <div className="p-3 bg-purple-50 rounded">
                <p className="text-xs text-purple-600 mb-1">Admin contexts:</p>
                <p className="font-medium">
                  {formatUserIdentity(demoDisplayName, demoUsername, 'username-primary')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Registration Dialog Demo */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Enhanced Registration Experience</h2>
        <p className="text-gray-600 mb-4">
          Try our new user registration dialog that supports both usernames and display names:
        </p>
        <Button onClick={() => setShowDialog(true)}>
          Open Registration Dialog
        </Button>
      </Card>

      {/* Benefits */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">System Benefits</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-green-700 mb-2">For Users</h3>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>• Express personality through display names</li>
              <li>• Maintain consistent identity via usernames</li>
              <li>• Easy recognition in social contexts</li>
              <li>• Professional appearance when needed</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-blue-700 mb-2">For Moderators</h3>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>• Reliable user tracking via stable usernames</li>
              <li>• Clear identification in reports</li>
              <li>• Pattern recognition for repeat offenders</li>
              <li>• Consistent audit trails</li>
            </ul>
          </div>
        </div>
      </Card>

      <EnhancedUsernameDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        onComplete={handleDialogComplete}
        title="Demo Registration"
        description="Experience the dual-identity registration process"
      />
    </div>
  );
};

export default DualIdentityDemo;
