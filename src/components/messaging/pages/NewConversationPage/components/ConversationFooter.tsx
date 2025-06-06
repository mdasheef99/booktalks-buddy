/**
 * Conversation Footer Component
 * 
 * Displays tips and tier information at the bottom of the page
 */

import React from 'react';
import type { ConversationFooterProps } from '../types';

/**
 * Conversation Footer Component
 */
export const ConversationFooter: React.FC<ConversationFooterProps> = ({
  className = ''
}) => {
  return (
    <div className={`p-4 bg-gray-50 border-t ${className}`}>
      <div className="text-center">
        <TipSection />
        <TierInformation />
      </div>
    </div>
  );
};

/**
 * Tip Section Component
 */
const TipSection: React.FC = () => {
  return (
    <p className="text-xs text-gray-600 mb-2">
      💡 Tip: Type at least 2 characters to see username suggestions
    </p>
  );
};

/**
 * Tier Information Component
 */
const TierInformation: React.FC = () => {
  return (
    <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
      <span>Free: Reply only</span>
      <span>•</span>
      <span>Privileged: Start conversations</span>
      <span>•</span>
      <span>Privileged+: Full access</span>
    </div>
  );
};
