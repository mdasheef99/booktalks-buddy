/**
 * Direct Messaging System - New Conversation Page
 *
 * Page for starting new conversations by entering a username.
 * Includes permission checking, user validation, and navigation to created conversations.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Search, MessageCircle, Users, AlertCircle, Send } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { startConversation, canInitiateConversations } from '@/lib/api/messaging';
import { MessagingHeaderWithBack } from '../components/MessagingHeader';
import { UsernameAutocomplete } from '../components/UsernameAutocomplete';
import { MessagingUser } from '@/lib/api/messaging/types';
import { toast } from 'sonner';

/**
 * New conversation page component
 * Allows users to start conversations by entering usernames
 */
export function NewConversationPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [username, setUsername] = useState('');
  const [selectedUser, setSelectedUser] = useState<MessagingUser | null>(null);
  const [message, setMessage] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  // Check if user can initiate conversations
  const { data: canInitiate, isLoading: isCheckingPermissions } = useQuery({
    queryKey: ['canInitiateConversations', user?.id],
    queryFn: () => canInitiateConversations(user!.id),
    enabled: !!user?.id
  });

  // Start conversation mutation
  const startConversationMutation = useMutation({
    mutationFn: (recipientUsername: string) =>
      startConversation(user!.id, recipientUsername),
    onSuccess: (data) => {
      if (data.is_existing) {
        toast.success('Opened existing conversation');
      } else {
        toast.success('Started new conversation');
      }
      // Navigate to the conversation with the initial message if provided
      if (message.trim()) {
        navigate(`/messages/${data.conversation_id}?initialMessage=${encodeURIComponent(message.trim())}`);
      } else {
        navigate(`/messages/${data.conversation_id}`);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to start conversation');
    }
  });

  /**
   * Handle starting a conversation
   */
  const handleStartConversation = async () => {
    const trimmedUsername = username.trim();

    if (!trimmedUsername) {
      toast.error('Please select a user');
      return;
    }

    if (!canInitiate) {
      toast.error('You need to upgrade to start conversations');
      return;
    }

    // Optional: Require a message for better UX
    if (!message.trim()) {
      toast.error('Please enter a message to start the conversation');
      return;
    }

    startConversationMutation.mutate(trimmedUsername);
  };

  /**
   * Handle username input changes
   */
  const handleUsernameChange = (value: string) => {
    setUsername(value);
    // Clear selected user if username is manually changed
    if (selectedUser && value !== selectedUser.username) {
      setSelectedUser(null);
    }
  };

  /**
   * Handle user selection from autocomplete
   */
  const handleUserSelect = (user: MessagingUser) => {
    setSelectedUser(user);
    setUsername(user.username);
  };

  /**
   * Clear selection and start over
   */
  const handleClearSelection = () => {
    setSelectedUser(null);
    setUsername('');
    setMessage('');
  };

  /**
   * Handle keyboard events
   */
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleStartConversation();
    }
  };

  /**
   * Handle back navigation
   */
  const handleBack = () => {
    navigate('/messages');
  };

  const isLoading = startConversationMutation.isPending || isValidating;
  const canSubmit = username.trim().length > 0 && message.trim().length > 0 && canInitiate && !isLoading;

  return (
    <div className="max-w-md mx-auto h-screen flex flex-col bg-white">
      {/* Header */}
      <MessagingHeaderWithBack
        title="New Message"
        onBack={handleBack}
      />

      {/* Content */}
      <div className="flex-1 p-4 space-y-6">
        {/* Permission check */}
        {isCheckingPermissions ? (
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        ) : !canInitiate ? (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <p className="text-sm text-amber-800 font-medium mb-1">
                  Upgrade Required
                </p>
                <p className="text-xs text-amber-700 leading-relaxed">
                  Only Privileged and Privileged+ members can start new conversations.
                  You can still reply to messages sent to you.
                </p>
                <Button
                  variant="link"
                  size="sm"
                  className="text-amber-700 p-0 h-auto text-xs mt-2"
                  onClick={() => {
                    // TODO: Navigate to upgrade page
                    toast.info('Upgrade feature coming soon');
                  }}
                >
                  Learn about upgrading →
                </Button>
              </div>
            </div>
          </div>
        ) : null}

        {/* Username input section */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <div>
              <UsernameAutocomplete
                value={username}
                onChange={handleUsernameChange}
                onSelect={handleUserSelect}
                placeholder="Start typing a username..."
                disabled={!canInitiate || isLoading}
                className="w-full"
              />
            </div>

            {/* Selected user display */}
            {selectedUser && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-bookconnect-sage/20 rounded-full flex items-center justify-center">
                      <Users className="h-4 w-4 text-bookconnect-sage" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-green-800">
                        @{selectedUser.username}
                      </p>
                      {selectedUser.displayname && selectedUser.displayname !== selectedUser.username && (
                        <p className="text-xs text-green-600">
                          {selectedUser.displayname}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearSelection}
                    className="text-xs"
                  >
                    Change User
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Message composition - only show when user is selected */}
          {selectedUser && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Message
                </label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={`Write your message to @${selectedUser.username}...`}
                  className="min-h-[100px] resize-none"
                  disabled={!canInitiate || isLoading}
                  maxLength={1000}
                />
                <div className="flex justify-between items-center mt-2">
                  <p className="text-xs text-gray-500">
                    {message.length}/1000 characters
                  </p>
                  <Button
                    onClick={handleStartConversation}
                    disabled={!canSubmit}
                    className="flex items-center gap-2 bg-bookconnect-sage hover:bg-bookconnect-sage/90"
                  >
                    <Send className="h-4 w-4" />
                    Send Message
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Instructions - hide when user is selected to make room for message composition */}
          {!selectedUser && (
            <div className="space-y-4">
              {/* Instructions */}
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

              {/* Recent conversations hint */}
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-2">
                  Or continue an existing conversation
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBack}
                  className="text-bookconnect-sage border-bookconnect-sage hover:bg-bookconnect-sage hover:text-white"
                >
                  View Messages
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-3 text-gray-600">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-bookconnect-sage"></div>
              <span className="text-sm">
                {startConversationMutation.isPending ? 'Starting conversation...' : 'Validating...'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Footer with tips */}
      <div className="p-4 bg-gray-50 border-t">
        <div className="text-center">
          <p className="text-xs text-gray-600 mb-2">
            💡 Tip: Type at least 2 characters to see username suggestions
          </p>
          <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
            <span>Free: Reply only</span>
            <span>•</span>
            <span>Privileged: Start conversations</span>
            <span>•</span>
            <span>Privileged+: Full access</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Loading skeleton for new conversation page
 */
export function NewConversationSkeleton() {
  return (
    <div className="max-w-md mx-auto h-screen flex flex-col bg-white">
      {/* Header skeleton */}
      <div className="p-4 border-b bg-bookconnect-sage animate-pulse">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-white/20 rounded mr-3"></div>
          <div className="h-6 bg-white/20 rounded w-32"></div>
        </div>
      </div>

      {/* Content skeleton */}
      <div className="flex-1 p-4 space-y-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="flex gap-2">
            <div className="flex-1 h-10 bg-gray-200 rounded"></div>
            <div className="w-20 h-10 bg-gray-200 rounded"></div>
          </div>
        </div>

        <div className="h-24 bg-gray-100 rounded-lg animate-pulse"></div>
        <div className="h-16 bg-gray-100 rounded-lg animate-pulse"></div>
      </div>

      {/* Footer skeleton */}
      <div className="p-4 bg-gray-50 border-t animate-pulse">
        <div className="h-3 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2 mx-auto"></div>
      </div>
    </div>
  );
}

/**
 * Error state for new conversation page
 */
export function NewConversationError({
  onRetry,
  onBack
}: {
  onRetry?: () => void;
  onBack?: () => void;
}) {
  return (
    <div className="max-w-md mx-auto h-screen flex items-center justify-center bg-white">
      <div className="text-center p-6">
        <div className="text-red-500 mb-4">
          <AlertCircle className="h-12 w-12 mx-auto" />
        </div>
        <p className="text-red-500 mb-4 font-medium">Failed to load new conversation page</p>
        <p className="text-gray-600 text-sm mb-4">
          Please check your connection and try again
        </p>
        <div className="flex gap-2 justify-center">
          {onRetry && (
            <Button onClick={onRetry} variant="outline">
              Retry
            </Button>
          )}
          {onBack && (
            <Button onClick={onBack} className="bg-bookconnect-sage hover:bg-bookconnect-sage/90">
              Back to Messages
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
