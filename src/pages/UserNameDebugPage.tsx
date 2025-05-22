import React from 'react';
import UserNameDebugTest from '@/components/testing/UserNameDebugTest';

/**
 * Debug page for testing UserName component issues
 * Access via /debug/username-display
 */
const UserNameDebugPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <UserNameDebugTest />
      </div>
    </div>
  );
};

export default UserNameDebugPage;
