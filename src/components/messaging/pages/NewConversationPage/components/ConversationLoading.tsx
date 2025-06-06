/**
 * Conversation Loading Component
 * 
 * Displays loading states for conversation operations
 */

import React from 'react';
import type { ConversationLoadingProps } from '../types';

/**
 * Conversation Loading Component
 */
export const ConversationLoading: React.FC<ConversationLoadingProps> = ({
  isStarting,
  isValidating
}) => {
  const isLoading = isStarting || isValidating;

  if (!isLoading) {
    return null;
  }

  return (
    <div className="flex items-center justify-center py-8">
      <div className="flex items-center gap-3 text-gray-600">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-bookconnect-sage"></div>
        <span className="text-sm">
          {isStarting ? 'Starting conversation...' : 'Validating...'}
        </span>
      </div>
    </div>
  );
};
