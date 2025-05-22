import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import UserName from '@/components/common/UserName';
import UserTierBadge from '@/components/common/UserTierBadge';
import { formatUserIdentity } from '@/utils/usernameValidation';
import { getUserProfile } from '@/services/profileService';
import {
  checkUsersWithDisplayNames,
  addTestDisplayNames,
  verifyUserDisplayName,
  getAllUsersForDebugging
} from '@/utils/displayNameTestUtils';

/**
 * Debug component to test UserName display issues with tier badges
 */
const UserNameDebugTest: React.FC = () => {
  const [realUserProfiles, setRealUserProfiles] = useState<any[]>([]);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);

  // Mock user data for testing
  const mockUsers = [
    {
      id: 'user1',
      username: 'asheef',
      displayname: null,
      account_tier: 'privileged',
      role: 'member'
    },
    {
      id: 'user2',
      username: 'taleb1',
      displayname: null,
      account_tier: 'free',
      role: 'member'
    },
    {
      id: 'user3',
      username: 'kant',
      displayname: null,
      account_tier: 'privileged',
      role: 'member'
    },
    {
      id: 'user4',
      username: 'asdfgh',
      displayname: null,
      account_tier: 'privileged',
      role: 'admin'
    },
    {
      id: 'user5',
      username: 'kafka',
      displayname: 'Franz Kafka',
      account_tier: 'privileged_plus',
      role: 'member'
    },
    {
      id: 'user6',
      username: 'test_user',
      displayname: 'Test Display Name',
      account_tier: 'privileged',
      role: 'member'
    }
  ];

  // Test with real user data
  useEffect(() => {
    const fetchRealUsers = async () => {
      try {
        const { supabase } = await import('@/lib/supabase');
        const { data, error } = await supabase
          .from('users')
          .select('id, username, displayname, account_tier')
          .limit(10);

        if (error) {
          setDebugInfo(`Error fetching users: ${error.message}`);
        } else {
          setRealUserProfiles(data || []);
          setDebugInfo(`Fetched ${data?.length || 0} real users from database`);
        }
      } catch (err) {
        setDebugInfo(`Error: ${err}`);
      }
    };

    fetchRealUsers();
  }, []);

  // Test functions
  const runDisplayNameTests = async () => {
    setIsRunningTests(true);
    const results = [];

    try {
      // Test 1: Check existing users with display names
      const existingResult = await checkUsersWithDisplayNames();
      results.push({ test: 'Check Existing Display Names', ...existingResult });

      // Test 2: Get all users for debugging
      const allUsersResult = await getAllUsersForDebugging();
      results.push({ test: 'Get All Users', ...allUsersResult });

      // Test 3: Add test display names if needed
      if (existingResult.data && existingResult.data.length === 0) {
        const addResult = await addTestDisplayNames();
        results.push({ test: 'Add Test Display Names', ...addResult });
      }

      // Test 4: Verify specific user if available
      if (realUserProfiles.length > 0) {
        const verifyResult = await verifyUserDisplayName(realUserProfiles[0].id);
        results.push({ test: 'Verify User Display Name', ...verifyResult });
      }

      setTestResults(results);
    } catch (error) {
      results.push({ test: 'Error', success: false, message: `${error}` });
      setTestResults(results);
    } finally {
      setIsRunningTests(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">UserName Component Debug Test</h1>

      {/* Debug Info */}
      <Card className="p-4 bg-blue-50">
        <h2 className="text-lg font-semibold mb-2">Debug Information</h2>
        <p className="text-sm">{debugInfo}</p>
        <div className="mt-2">
          <h3 className="font-medium">Real Users from Database:</h3>
          <div className="text-xs space-y-1 max-h-32 overflow-y-auto">
            {realUserProfiles.map((user, index) => (
              <div key={index} className="border-l-2 border-blue-300 pl-2">
                ID: {user.id?.substring(0, 8)}... | Username: {user.username} | Display: {user.displayname || 'null'} | Tier: {user.account_tier}
              </div>
            ))}
          </div>
        </div>
        <div className="mt-4">
          <Button
            onClick={runDisplayNameTests}
            disabled={isRunningTests}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isRunningTests ? 'Running Tests...' : 'Run Display Name Tests'}
          </Button>
        </div>
      </Card>

      {/* Test Results */}
      {testResults.length > 0 && (
        <Card className="p-4 bg-yellow-50">
          <h2 className="text-lg font-semibold mb-2">Test Results</h2>
          <div className="space-y-2">
            {testResults.map((result, index) => (
              <div key={index} className={`p-2 rounded border-l-4 ${result.success ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}>
                <div className="font-medium">{result.test}</div>
                <div className="text-sm">{result.message}</div>
                {result.data && (
                  <div className="text-xs mt-1 max-h-20 overflow-y-auto">
                    <pre>{JSON.stringify(result.data, null, 2)}</pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Test 0: Real User Data Testing */}
      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-4">Test 0: Real User Data from Database</h2>
        <div className="space-y-3">
          {realUserProfiles.slice(0, 5).map((user) => (
            <div key={user.id} className="flex items-center gap-3 p-2 border rounded">
              <div className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center text-xs">
                {user.username?.substring(0, 2).toUpperCase() || 'U'}
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-600">
                  Raw DB: {user.username} | {user.displayname || 'NO DISPLAY NAME'} | {user.account_tier}
                </div>
                <div className="font-medium">
                  UserName component:
                  <UserName
                    userId={user.id}
                    displayFormat="full"
                    showTierBadge={true}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Test 1: Basic UserName rendering */}
      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-4">Test 1: Basic UserName Rendering</h2>
        <div className="space-y-3">
          {mockUsers.map((user) => (
            <div key={user.id} className="flex items-center gap-3 p-2 border rounded">
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs">
                {user.username.substring(0, 2).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-600">
                  Raw data: {user.username} | {user.account_tier} | {user.role}
                </div>
                <div className="font-medium">
                  UserName component:
                  <UserName
                    userId={user.id}
                    displayFormat="full"
                    showTierBadge={true}
                    withRole={user.role}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Test 2: Tier Badge Isolation */}
      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-4">Test 2: Tier Badge Isolation</h2>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span>Privileged Badge:</span>
            <UserTierBadge tier="privileged" size="sm" />
            <UserTierBadge tier="privileged" size="md" />
            <UserTierBadge tier="privileged" size="lg" />
          </div>
          <div className="flex items-center gap-2">
            <span>Privileged+ Badge:</span>
            <UserTierBadge tier="privileged_plus" size="sm" />
            <UserTierBadge tier="privileged_plus" size="md" />
            <UserTierBadge tier="privileged_plus" size="lg" />
          </div>
          <div className="flex items-center gap-2">
            <span>Free Badge:</span>
            <UserTierBadge tier="free" size="sm" />
            <span>(should be null)</span>
          </div>
        </div>
      </Card>

      {/* Test 3: Layout Testing */}
      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-4">Test 3: Layout Testing</h2>
        <div className="space-y-4">
          <div className="border p-3">
            <h3 className="text-sm font-medium mb-2">Member List Layout (like screenshots)</h3>
            <div className="space-y-3">
              {mockUsers.slice(0, 4).map((user) => (
                <div key={user.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-200 rounded-full flex items-center justify-center text-xs font-medium">
                    {user.username.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <UserName
                      userId={user.id}
                      linkToProfile
                      withRole={user.role}
                      displayFormat="full"
                      showTierBadge={true}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border p-3">
            <h3 className="text-sm font-medium mb-2">Discussion Layout</h3>
            <div className="space-y-3">
              {mockUsers.slice(0, 2).map((user) => (
                <div key={user.id} className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Started by</span>
                  <UserName
                    userId={user.id}
                    linkToProfile
                    displayFormat="full"
                    showTierBadge={true}
                  />
                  <span className="text-sm text-gray-600">• 4/11/2025, 7:44:17 AM</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Test 4: formatUserIdentity Function */}
      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-4">Test 4: formatUserIdentity Function</h2>
        <div className="space-y-2">
          {mockUsers.map((user) => (
            <div key={user.id} className="text-sm">
              <strong>{user.username}:</strong>
              <div className="ml-4">
                <div>display-primary: {formatUserIdentity(user.displayname, user.username, 'display-primary')}</div>
                <div>full: {formatUserIdentity(user.displayname, user.username, 'full')}</div>
                <div>username-primary: {formatUserIdentity(user.displayname, user.username, 'username-primary')}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Test 5: CSS Debugging */}
      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-4">Test 5: CSS Layout Debugging</h2>
        <div className="space-y-4">
          <div className="border-2 border-red-200 p-2">
            <h3 className="text-sm font-medium mb-2">With visible borders for debugging</h3>
            <div className="flex items-center gap-1 border border-blue-200">
              <span className="border border-green-200 flex items-center gap-1">
                <span className="font-medium border border-yellow-200">asheef</span>
                <span className="text-gray-500 text-sm border border-purple-200">(member)</span>
              </span>
              <div className="border border-red-200">
                <UserTierBadge tier="privileged" size="sm" />
              </div>
            </div>
          </div>

          <div className="border-2 border-green-200 p-2">
            <h3 className="text-sm font-medium mb-2">Overflow Testing</h3>
            <div className="w-32 border border-blue-200 overflow-hidden">
              <UserName
                userId="user1"
                displayFormat="full"
                showTierBadge={true}
                withRole="member"
              />
            </div>
          </div>

          <div className="border-2 border-purple-200 p-2">
            <h3 className="text-sm font-medium mb-2">Mobile Responsive Test</h3>
            <div className="max-w-xs border border-blue-200">
              <UserName
                userId="user5"
                displayFormat="full"
                showTierBadge={true}
                withRole="member"
              />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default UserNameDebugTest;
