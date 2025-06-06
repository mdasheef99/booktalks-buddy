/**
 * Conversation Instructions Component
 * 
 * Displays instructions and tips for starting conversations
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import type { ConversationInstructionsProps } from '../types';

/**
 * Conversation Instructions Component
 */
export const ConversationInstructions: React.FC<ConversationInstructionsProps> = ({
  onBackToMessages
}) => {
  return (
    <div className="space-y-4">
      {/* Instructions */}
      <InstructionCard />

      {/* Recent conversations hint */}
      <AlternativeActions onBackToMessages={onBackToMessages} />
    </div>
  );
};

/**
 * Instruction Card Component
 */
const InstructionCard: React.FC = () => {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="text-sm text-blue-800">
        <p className="font-medium mb-2 flex items-center">
          <Search className="h-4 w-4 mr-2" />
          How to start a conversation:
        </p>
        <ul className="space-y-1 text-blue-700 text-xs leading-relaxed">
          <li>• Start typing a username to see suggestions</li>
          <li>• Click on a suggestion or use arrow keys to select</li>
          <li>• You can only message people in your book clubs</li>
          <li>• After selecting a user, write your message below</li>
        </ul>
      </div>
    </div>
  );
};

/**
 * Alternative Actions Component
 */
interface AlternativeActionsProps {
  onBackToMessages: () => void;
}

const AlternativeActions: React.FC<AlternativeActionsProps> = ({
  onBackToMessages
}) => {
  return (
    <div className="text-center">
      <p className="text-sm text-gray-500 mb-2">
        Or continue an existing conversation
      </p>
      <Button
        variant="outline"
        size="sm"
        onClick={onBackToMessages}
        className="text-bookconnect-sage border-bookconnect-sage hover:bg-bookconnect-sage hover:text-white"
      >
        View Messages
      </Button>
    </div>
  );
};
