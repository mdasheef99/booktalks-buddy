/**
 * Test Component for Moderator Display Functionality
 *
 * This component tests the fixed moderator username display functionality
 * to ensure usernames are properly shown instead of user ID fragments.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, User, CheckCircle, XCircle, AlertTriangle, Database } from 'lucide-react';
import { useClubModerators } from '@/hooks/clubManagement/useClubModerators';
import { supabase } from '@/lib/supabase';

interface ModeratorDisplayTestProps {
  clubId: string;
}

const ModeratorDisplayTest: React.FC<ModeratorDisplayTestProps> = ({ clubId }) => {
  const { moderators, loading, error, refresh } = useClubModerators(clubId);
  const [testResults, setTestResults] = useState<{
    usernameDisplay: boolean;
    userDataJoin: boolean;
    fallbackLogic: boolean;
  }>({
    usernameDisplay: false,
    userDataJoin: false,
    fallbackLogic: false
  });

  const [diagnostics, setDiagnostics] = useState<{
    clubExists: boolean;
    userIsMember: boolean;
    moderatorsTableExists: boolean;
    usersTableExists: boolean;
    rlsError: string | null;
    rawError: any;
  }>({
    clubExists: false,
    userIsMember: false,
    moderatorsTableExists: false,
    usersTableExists: false,
    rlsError: null,
    rawError: null
  });

  useEffect(() => {
    if (moderators.length > 0) {
      const firstModerator = moderators[0];

      // Test 1: Check if user data is properly joined
      const hasUserData = !!firstModerator.user;

      // Test 2: Check if username is available
      const hasUsername = !!(firstModerator.user?.username);

      // Test 3: Check fallback logic works
      const hasFallback = hasUserData || firstModerator.user_id;

      setTestResults({
        usernameDisplay: hasUsername,
        userDataJoin: hasUserData,
        fallbackLogic: hasFallback
      });
    }
  }, [moderators]);

  const handleRefresh = async () => {
    await refresh();
  };

  const runDiagnostics = async () => {
    console.log('Running diagnostics for club:', clubId);

    try {
      // Test 1: Check if club exists
      const { data: club, error: clubError } = await supabase
        .from('book_clubs')
        .select('id, name')
        .eq('id', clubId)
        .single();

      // Test 2: Check if user is a club member
      const { data: membership, error: membershipError } = await supabase
        .from('club_members')
        .select('user_id, role')
        .eq('club_id', clubId)
        .eq('user_id', supabase.auth.getUser().then(u => u.data.user?.id))
        .single();

      // Test 3: Check if club_moderators table is accessible
      const { data: moderatorsTest, error: moderatorsError } = await supabase
        .from('club_moderators')
        .select('id')
        .limit(1);

      // Test 4: Check if users table is accessible
      const { data: usersTest, error: usersError } = await supabase
        .from('users')
        .select('id')
        .limit(1);

      // Test 5: Try the problematic join query
      const { data: joinTest, error: joinError } = await supabase
        .from('club_moderators')
        .select(`
          *,
          users!inner (
            username,
            email,
            displayname
          )
        `)
        .eq('club_id', clubId)
        .limit(1);

      setDiagnostics({
        clubExists: !clubError && !!club,
        userIsMember: !membershipError && !!membership,
        moderatorsTableExists: !moderatorsError,
        usersTableExists: !usersError,
        rlsError: joinError?.message || null,
        rawError: joinError
      });

      console.log('Diagnostics results:', {
        club: { data: club, error: clubError },
        membership: { data: membership, error: membershipError },
        moderators: { error: moderatorsError },
        users: { error: usersError },
        join: { data: joinTest, error: joinError }
      });

    } catch (err) {
      console.error('Diagnostics failed:', err);
      setDiagnostics(prev => ({
        ...prev,
        rawError: err
      }));
    }
  };

  useEffect(() => {
    if (clubId) {
      runDiagnostics();
    }
  }, [clubId]);

  if (loading) {
    return (
      <Card className="p-6">
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading moderators...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <CardContent>
          <div className="flex items-center justify-center py-8 text-red-600">
            <XCircle className="h-8 w-8 mr-2" />
            <span>Error: {error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Database Diagnostics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Diagnostics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="flex items-center gap-2">
              {diagnostics.clubExists ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              <span className="text-sm">Club Exists</span>
            </div>

            <div className="flex items-center gap-2">
              {diagnostics.userIsMember ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              <span className="text-sm">User is Member</span>
            </div>

            <div className="flex items-center gap-2">
              {diagnostics.moderatorsTableExists ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              <span className="text-sm">Moderators Table Access</span>
            </div>

            <div className="flex items-center gap-2">
              {diagnostics.usersTableExists ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              <span className="text-sm">Users Table Access</span>
            </div>
          </div>

          {diagnostics.rlsError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span className="font-medium text-red-800">Database Error</span>
              </div>
              <p className="text-sm text-red-700">{diagnostics.rlsError}</p>
              {diagnostics.rawError && (
                <details className="mt-2">
                  <summary className="text-xs text-red-600 cursor-pointer">Raw Error Details</summary>
                  <pre className="text-xs mt-1 p-2 bg-red-100 rounded overflow-auto">
                    {JSON.stringify(diagnostics.rawError, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          )}

          <div className="mt-4">
            <Button onClick={runDiagnostics} variant="outline" size="sm">
              Re-run Diagnostics
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Test Results Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Moderator Display Test Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              {testResults.userDataJoin ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              <span className="text-sm">User Data Join</span>
            </div>

            <div className="flex items-center gap-2">
              {testResults.usernameDisplay ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              <span className="text-sm">Username Display</span>
            </div>

            <div className="flex items-center gap-2">
              {testResults.fallbackLogic ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              <span className="text-sm">Fallback Logic</span>
            </div>
          </div>

          <div className="mt-4">
            <Button onClick={handleRefresh} variant="outline" size="sm">
              Refresh Test
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Moderator Display Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Moderator Display Preview</CardTitle>
        </CardHeader>
        <CardContent>
          {moderators.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No moderators found for testing
            </div>
          ) : (
            <div className="space-y-4">
              {moderators.map((moderator) => (
                <div key={moderator.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-blue-600" />
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

                  {/* Debug Info */}
                  <div className="mt-3 p-2 bg-gray-50 rounded text-xs">
                    <div><strong>User ID:</strong> {moderator.user_id}</div>
                    <div><strong>Username:</strong> {moderator.user?.username || 'Not available'}</div>
                    <div><strong>Display Name:</strong> {moderator.user?.display_name || 'Not available'}</div>
                    <div><strong>Email:</strong> {moderator.user?.email || 'Not available'}</div>
                    <div><strong>Analytics Access:</strong> {moderator.analytics_access ? 'Yes' : 'No'}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ModeratorDisplayTest;
