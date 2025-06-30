/**
 * Legacy Profile Redirect Component
 * Handles redirection from old /profile/:userId URLs to new /user/:username URLs
 */

import React, { useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { getUsernameById } from '@/lib/usernameResolution';
import { Loader2 } from 'lucide-react';

const LegacyProfileRedirect: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const resolveUsername = async () => {
      if (!userId) {
        setError(true);
        setLoading(false);
        return;
      }

      try {
        const resolvedUsername = await getUsernameById(userId);
        if (resolvedUsername) {
          setUsername(resolvedUsername);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error('Error resolving username for legacy profile URL:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    resolveUsername();
  }, [userId]);

  // Show loading state while resolving username
  if (loading) {
    return (
      <div className="min-h-screen bg-bookconnect-cream flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-bookconnect-brown" />
          <p className="text-bookconnect-brown">Redirecting to profile...</p>
        </div>
      </div>
    );
  }

  // Redirect to new URL format if username was resolved
  if (username) {
    return <Navigate to={`/user/${username}`} replace />;
  }

  // Show error state if username couldn't be resolved
  if (error) {
    return (
      <div className="min-h-screen bg-bookconnect-cream flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h1 className="text-2xl font-serif font-bold text-bookconnect-brown mb-4">
              Profile Not Found
            </h1>
            <p className="text-gray-600 mb-6">
              The profile you're looking for could not be found. This might be because:
            </p>
            <ul className="text-left text-gray-600 mb-6 space-y-2">
              <li>• The user no longer exists</li>
              <li>• The profile link is outdated</li>
              <li>• There was an error loading the profile</li>
            </ul>
            <div className="space-y-3">
              <button
                onClick={() => window.history.back()}
                className="w-full bg-bookconnect-brown text-white px-4 py-2 rounded-lg hover:bg-bookconnect-brown/90 transition-colors"
              >
                Go Back
              </button>
              <a
                href="/book-club"
                className="block w-full bg-bookconnect-cream text-bookconnect-brown px-4 py-2 rounded-lg border border-bookconnect-brown hover:bg-bookconnect-brown hover:text-white transition-colors text-center"
              >
                Browse Book Clubs
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Fallback (shouldn't reach here)
  return <Navigate to="/book-club" replace />;
};

export default LegacyProfileRedirect;
