/**
 * Direct Messaging System - UserName Component
 *
 * Simple UserName component for messaging that accepts user object
 * with username and displayname properties.
 */

import React from 'react';

interface MessagingUser {
  id?: string;
  username: string;
  displayname?: string;
}

interface UserNameProps {
  user: MessagingUser;
  showBoth?: boolean;
  fallback?: string;
  className?: string;
}

/**
 * Generate fallback display text from user ID
 */
function getUserIdFallback(userId?: string): string {
  if (!userId) return 'U';
  return userId.charAt(0).toUpperCase();
}

/**
 * UserName component for messaging system
 * Displays user's display name or username with enhanced fallback logic
 */
export function UserName({
  user,
  showBoth = false,
  fallback,
  className = ''
}: UserNameProps) {
  const displayName = user.displayname?.trim();
  const username = user.username?.trim();

  // Enhanced fallback logic
  const getFallbackText = () => {
    if (fallback) return fallback;

    // Try to get user ID from the user object if it has an id property
    const userId = (user as any).id;
    return getUserIdFallback(userId);
  };

  // If no valid user data, use enhanced fallback
  if (!displayName && !username) {
    return <span className={className}>{getFallbackText()}</span>;
  }

  // Show both display name and username when both are available
  if (showBoth && displayName && username) {
    return (
      <span className={className}>
        {displayName} <span className="text-gray-500">(@{username})</span>
      </span>
    );
  }

  // Enhanced display logic:
  // - If display name exists, show it with username in parentheses (when showBoth is true)
  // - If only username exists, show just the username (no parentheses)
  // - If neither exists, use fallback
  if (displayName) {
    if (showBoth && username) {
      return (
        <span className={className}>
          {displayName} <span className="text-gray-500">(@{username})</span>
        </span>
      );
    }
    return <span className={className}>{displayName}</span>;
  }

  // Only username available - show without parentheses
  if (username) {
    return <span className={className}>{username}</span>;
  }

  // Final fallback
  return <span className={className}>{getFallbackText()}</span>;
}
