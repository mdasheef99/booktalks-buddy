/**
 * Test Runner Component for Reading Progress Feature
 * This component can be temporarily added to test the progress functionality
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { runAllTests } from '@/lib/api/bookclubs/progress/test-functionality';

interface TestRunnerProps {
  clubId?: string;
  bookId?: string;
}

export const ProgressTestRunner: React.FC<TestRunnerProps> = ({ 
  clubId: defaultClubId, 
  bookId: defaultBookId 
}) => {
  const { user } = useAuth();
  const [clubId, setClubId] = useState(defaultClubId || '');
  const [bookId, setBookId] = useState(defaultBookId || '');
  const [secondUserId, setSecondUserId] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<string[]>([]);

  const handleRunTests = async () => {
    if (!user?.id || !clubId) {
      setResults(['❌ Error: User ID and Club ID are required']);
      return;
    }

    setIsRunning(true);
    setResults(['🚀 Starting tests...']);

    // Capture console logs
    const originalLog = console.log;
    const originalError = console.error;
    const logs: string[] = [];

    console.log = (...args) => {
      const message = args.join(' ');
      logs.push(message);
      setResults(prev => [...prev, message]);
      originalLog(...args);
    };

    console.error = (...args) => {
      const message = '❌ ' + args.join(' ');
      logs.push(message);
      setResults(prev => [...prev, message]);
      originalError(...args);
    };

    try {
      await runAllTests(
        user.id, 
        clubId, 
        bookId || undefined, 
        secondUserId || undefined
      );
    } catch (error) {
      console.error('Test execution failed:', error);
    } finally {
      // Restore console
      console.log = originalLog;
      console.error = originalError;
      setIsRunning(false);
    }
  };

  const clearResults = () => {
    setResults([]);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>📊 Reading Progress Feature Test Runner</CardTitle>
        <CardDescription>
          Test the reading progress tracking functionality to ensure everything is working correctly.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Test Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="clubId">Club ID *</Label>
            <Input
              id="clubId"
              value={clubId}
              onChange={(e) => setClubId(e.target.value)}
              placeholder="Enter club ID to test"
              disabled={isRunning}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bookId">Book ID (Optional)</Label>
            <Input
              id="bookId"
              value={bookId}
              onChange={(e) => setBookId(e.target.value)}
              placeholder="Enter book ID (optional)"
              disabled={isRunning}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="secondUserId">Second User ID (Optional)</Label>
            <Input
              id="secondUserId"
              value={secondUserId}
              onChange={(e) => setSecondUserId(e.target.value)}
              placeholder="For privacy tests"
              disabled={isRunning}
            />
          </div>
          <div className="space-y-2">
            <Label>Current User ID</Label>
            <Input
              value={user?.id || 'Not logged in'}
              disabled
              className="bg-gray-50"
            />
          </div>
        </div>

        {/* Test Controls */}
        <div className="flex gap-3">
          <Button 
            onClick={handleRunTests}
            disabled={isRunning || !user?.id || !clubId}
            className="bg-bookconnect-brown hover:bg-bookconnect-brown/90"
          >
            {isRunning ? '🔄 Running Tests...' : '🚀 Run All Tests'}
          </Button>
          <Button 
            onClick={clearResults}
            variant="outline"
            disabled={isRunning}
          >
            🗑️ Clear Results
          </Button>
        </div>

        {/* Test Results */}
        {results.length > 0 && (
          <div className="space-y-2">
            <Label>Test Results:</Label>
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
              {results.map((result, index) => (
                <div key={index} className="mb-1">
                  {result}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-semibold text-blue-900 mb-2">📋 Test Instructions:</h4>
          <ul className="text-blue-800 text-sm space-y-1">
            <li>1. Make sure you're logged in and are a member of the test club</li>
            <li>2. Enter a valid Club ID (you must be a member or club lead)</li>
            <li>3. Optionally enter a Book ID to test book-specific progress</li>
            <li>4. Optionally enter a second User ID to test privacy features</li>
            <li>5. Click "Run All Tests" to execute the test suite</li>
            <li>6. Check the results to ensure all tests pass ✅</li>
          </ul>
        </div>

        {/* Warning */}
        <div className="bg-yellow-50 p-4 rounded-lg">
          <h4 className="font-semibold text-yellow-900 mb-2">⚠️ Important Notes:</h4>
          <ul className="text-yellow-800 text-sm space-y-1">
            <li>• This will create and modify actual progress data in the database</li>
            <li>• Only use this in development/testing environments</li>
            <li>• Make sure you have proper permissions for the club</li>
            <li>• Remove this component before production deployment</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProgressTestRunner;
