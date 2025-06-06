/**
 * New Conversation Page - Main Component
 * 
 * Page for starting new conversations by entering a username
 */

import React from 'react';
import { MessagingHeaderWithBack } from '../../components/MessagingHeader';
import { PermissionCheck } from './components/PermissionCheck';
import { UserSelectionForm } from './components/UserSelectionForm';
import { MessageComposition } from './components/MessageComposition';
import { ConversationInstructions } from './components/ConversationInstructions';
import { ConversationFooter } from './components/ConversationFooter';
import { ConversationLoading } from './components/ConversationLoading';
import { useNewConversation } from './hooks/useNewConversation';
import type { NewConversationPageProps } from './types';

/**
 * New Conversation Page Component
 */
export const NewConversationPage: React.FC<NewConversationPageProps> = ({ 
  className = '' 
}) => {
  const {
    formData,
    permissions,
    isLoading,
    canSubmit,
    actions
  } = useNewConversation();

  return (
    <div className={`max-w-md mx-auto h-screen flex flex-col bg-white ${className}`}>
      {/* Header */}
      <MessagingHeaderWithBack
        title="New Message"
        onBack={actions.handleBack}
      />

      {/* Content */}
      <div className="flex-1 p-4 space-y-6">
        {/* Permission Check */}
        <PermissionCheck permissions={permissions} />

        {/* User Selection Form */}
        <UserSelectionForm
          username={formData.username}
          selectedUser={formData.selectedUser}
          isLoading={isLoading}
          canInitiate={permissions.canInitiate}
          onUsernameChange={actions.handleUsernameChange}
          onUserSelect={actions.handleUserSelect}
          onClearSelection={actions.handleClearSelection}
        />

        {/* Message Composition - only show when user is selected */}
        {formData.selectedUser && (
          <MessageComposition
            selectedUser={formData.selectedUser}
            message={formData.message}
            isLoading={isLoading}
            canInitiate={permissions.canInitiate}
            canSubmit={canSubmit}
            onMessageChange={actions.handleMessageChange}
            onSubmit={actions.handleStartConversation}
          />
        )}

        {/* Instructions - hide when user is selected */}
        {!formData.selectedUser && (
          <ConversationInstructions
            onBackToMessages={actions.handleBack}
          />
        )}

        {/* Loading State */}
        <ConversationLoading
          isStarting={isLoading}
          isValidating={false}
        />
      </div>

      {/* Footer */}
      <ConversationFooter />
    </div>
  );
};
