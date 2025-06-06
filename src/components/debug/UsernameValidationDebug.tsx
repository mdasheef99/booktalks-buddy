/**
 * Debug component for testing username validation issues
 * This component helps diagnose the "kant" and "admin" validation problems
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  debugUsernameValidation, 
  testSpecificIssues, 
  listAllUsernamesInDatabase,
  type DebugResult 
} from '@/utils/debug-username-validation';

const UsernameValidationDebug: React.FC = () => {
  const [testUsername, setTestUsername] = useState('');
  const [debugResult, setDebugResult] = useState<DebugResult | null>(null);
  const [allUsernames, setAllUsernames] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleTestUsername = async () => {
    if (!testUsername.trim()) return;
    
    setIsLoading(true);
    try {
      const result = await debugUsernameValidation(testUsername);
      setDebugResult(result);
    } catch (error) {
      console.error('Error testing username:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestSpecificIssues = async () => {
    setIsLoading(true);
    try {
      await testSpecificIssues();
    } catch (error) {
      console.error('Error testing specific issues:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleListAllUsernames = async () => {
    setIsLoading(true);
    try {
      const usernames = await listAllUsernamesInDatabase();
      setAllUsernames(usernames);
    } catch (error) {
      console.error('Error listing usernames:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatJson = (obj: any) => {
    return JSON.stringify(obj, null, 2);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Username Validation Debug Tool</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Test Individual Username */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Test Individual Username</h3>
            <div className="flex gap-2">
              <Input
                value={testUsername}
                onChange={(e) => setTestUsername(e.target.value)}
                placeholder="Enter username to test"
                className="flex-1"
              />
              <Button 
                onClick={handleTestUsername}
                disabled={isLoading || !testUsername.trim()}
              >
                Test Username
              </Button>
            </div>
          </div>

          {/* Quick Test Buttons */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Quick Tests</h3>
            <div className="flex gap-2 flex-wrap">
              <Button 
                onClick={() => { setTestUsername('kant'); handleTestUsername(); }}
                disabled={isLoading}
                variant="outline"
              >
                Test "kant"
              </Button>
              <Button 
                onClick={() => { setTestUsername('admin'); handleTestUsername(); }}
                disabled={isLoading}
                variant="outline"
              >
                Test "admin"
              </Button>
              <Button 
                onClick={() => { setTestUsername('Kant'); handleTestUsername(); }}
                disabled={isLoading}
                variant="outline"
              >
                Test "Kant"
              </Button>
              <Button 
                onClick={() => { setTestUsername('ADMIN'); handleTestUsername(); }}
                disabled={isLoading}
                variant="outline"
              >
                Test "ADMIN"
              </Button>
            </div>
          </div>

          {/* Comprehensive Tests */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Comprehensive Tests</h3>
            <div className="flex gap-2">
              <Button 
                onClick={handleTestSpecificIssues}
                disabled={isLoading}
                variant="secondary"
              >
                Test Specific Issues (Check Console)
              </Button>
              <Button 
                onClick={handleListAllUsernames}
                disabled={isLoading}
                variant="secondary"
              >
                List All DB Usernames
              </Button>
            </div>
          </div>

          {/* Results Display */}
          {debugResult && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Debug Results for "{debugResult.username}"</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Format Validation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                      {formatJson(debugResult.formatValidation)}
                    </pre>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Database Query</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                      {formatJson(debugResult.databaseQuery)}
                    </pre>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Availability Check</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                      Available: {String(debugResult.availabilityCheck)}
                    </pre>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Comprehensive Validation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                      {formatJson(debugResult.comprehensiveValidation)}
                    </pre>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <p><strong>Normalized:</strong> {debugResult.normalizedUsername}</p>
                    <p><strong>Is Reserved Word:</strong> {String(debugResult.isReservedWord)}</p>
                    <p><strong>Format Valid:</strong> {String(debugResult.formatValidation?.isValid)}</p>
                    <p><strong>Available:</strong> {String(debugResult.availabilityCheck)}</p>
                    <p><strong>Overall Valid:</strong> {String(debugResult.comprehensiveValidation?.isValid)}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* All Usernames Display */}
          {allUsernames.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">All Usernames in Database ({allUsernames.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2 text-xs">
                  {allUsernames.map((username, index) => (
                    <div key={index} className="bg-gray-100 p-1 rounded">
                      {username}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Instructions</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p>1. Test individual usernames using the input field above</p>
              <p>2. Use quick test buttons to test specific cases</p>
              <p>3. Check browser console for detailed logs</p>
              <p>4. "Test Specific Issues" runs comprehensive tests for reported problems</p>
              <p>5. "List All DB Usernames" shows what's actually in the database</p>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
};

export default UsernameValidationDebug;
