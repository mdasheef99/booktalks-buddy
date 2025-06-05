/**
 * Direct Messaging System - Conversation List Page
 *
 * WhatsApp-style inbox view showing user's conversations with unread counts,
 * last message previews, and navigation to individual conversations.
 */

import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { MessageCircle, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getUserConversations, canInitiateConversations } from '@/lib/api/messaging';
import { ConversationItem } from '../components/ConversationItem';
import { MessagingHeader } from '../components/MessagingHeader';
import { toast } from 'sonner';

/**
 * Main conversation list page component
 * Displays user's conversations in WhatsApp-style list format
 */
export function ConversationListPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // TEMPORARY: Check if database tables exist before making queries
  const [databaseReady, setDatabaseReady] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    const checkDatabase = async () => {
      try {
        const { verifyDatabaseTables } = await import('@/lib/api/messaging');
        const tableStatus = await verifyDatabaseTables();
        const allTablesExist = Object.values(tableStatus).every(exists => exists);
        setDatabaseReady(allTablesExist);

        if (!allTablesExist) {
          console.error('Direct messaging database tables missing:', tableStatus);
        }
      } catch (error) {
        console.error('Database verification failed:', error);
        setDatabaseReady(false);
      }
    };

    checkDatabase();
  }, []);

  // Fetch user's conversations with real-time updates
  const {
    data: conversationsData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['conversations', user?.id],
    queryFn: () => getUserConversations({ userId: user!.id }),
    enabled: !!user?.id && databaseReady === true,
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 10000 // Consider data stale after 10 seconds
  });

  // Check if user can start new conversations
  const { data: canInitiate } = useQuery({
    queryKey: ['canInitiateConversations', user?.id],
    queryFn: () => canInitiateConversations(user!.id),
    enabled: !!user?.id
  });

  /**
   * Handle new message button click
   * Checks permissions before navigating to new conversation page
   */
  const handleNewMessage = useCallback(() => {
    if (!canInitiate) {
      toast.error('Upgrade to Privileged+ to start conversations');
      return;
    }
    navigate('/messages/new');
  }, [canInitiate, navigate]);

  /**
   * Handle conversation item click
   * Navigates to the specific conversation thread
   */
  const handleConversationClick = useCallback((conversationId: string) => {
    navigate(`/messages/${conversationId}`);
  }, [navigate]);

  /**
   * Handle back navigation to user's profile page
   */
  const handleGoBack = useCallback(() => {
    navigate('/profile');
  }, [navigate]);

  // Show database setup message if tables don't exist
  if (databaseReady === false) {
    return (
      <div className="max-w-md mx-auto h-screen bg-white">
        <MessagingHeader title="Messages" showBackButton={false} />
        <div className="flex items-center justify-center h-64">
          <div className="text-center p-6">
            <div className="text-red-500 mb-4">
              <MessageCircle className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Messaging Setup Required
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              The messaging database tables need to be set up. Please contact your administrator.
            </p>
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              size="sm"
            >
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="relative h-screen">
        {/* Back button for error state */}
        <Button
          onClick={handleGoBack}
          variant="ghost"
          size="sm"
          className="absolute top-4 left-4 z-10 bg-white/90 hover:bg-white text-bookconnect-sage border border-bookconnect-sage/20 shadow-sm"
          aria-label="Go back to profile"
        >
          <svg
            className="h-4 w-4 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back
        </Button>

        <div className="max-w-md mx-auto h-screen flex items-center justify-center bg-white">
          <div className="text-center p-6">
            <MessageCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-red-500 mb-4 font-medium">Failed to load conversations</p>
            <p className="text-gray-600 text-sm mb-4">
              Please check your connection and try again
            </p>
            <Button onClick={() => refetch()} variant="outline">
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen">
      {/* Back button positioned outside main container */}
      <Button
        onClick={handleGoBack}
        variant="ghost"
        size="sm"
        className="absolute top-4 left-4 z-10 bg-white/90 hover:bg-white text-bookconnect-sage border border-bookconnect-sage/20 shadow-sm"
        aria-label="Go back to profile"
      >
        <svg
          className="h-4 w-4 mr-2"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Back
      </Button>

      <div className="max-w-md mx-auto h-screen flex flex-col bg-white">
        {/* Header with title and new message button */}
        <MessagingHeader
          title="Messages"
          action={
            <Button
              onClick={handleNewMessage}
              size="sm"
              variant="secondary"
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white border-white/20"
              disabled={!canInitiate}
            >
              <Plus className="h-4 w-4" />
              New
            </Button>
          }
        />

      {/* Conversations list */}
      <div className="flex-1 overflow-y-auto">
        {(databaseReady === null || isLoading) ? (
          // Loading skeleton
          <div className="p-4 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center space-x-4 p-4">
                  <div className="rounded-full bg-gray-200 h-12 w-12"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                  <div className="h-3 bg-gray-200 rounded w-12"></div>
                </div>
              </div>
            ))}
          </div>
        ) : conversationsData?.conversations.length === 0 ? (
          // Empty state
          <div className="p-8 text-center">
            <MessageCircle className="h-16 w-16 mx-auto text-gray-400 mb-6" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No conversations yet
            </h3>
            <p className="text-gray-500 mb-6 text-sm leading-relaxed">
              Start connecting with other book lovers in your community
            </p>
            {canInitiate ? (
              <Button
                onClick={handleNewMessage}
                className="bg-bookconnect-sage hover:bg-bookconnect-sage/90"
              >
                Start your first conversation
              </Button>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-left">
                <p className="text-sm text-amber-800 font-medium mb-1">
                  Upgrade to start conversations
                </p>
                <p className="text-xs text-amber-700">
                  Privileged and Privileged+ members can start new conversations.
                  You can still reply to messages sent to you.
                </p>
              </div>
            )}
          </div>
        ) : (
          // Conversations list
          <div className="divide-y divide-gray-100">
            {conversationsData?.conversations.map(conversation => (
              <ConversationItem
                key={conversation.id}
                conversation={conversation}
                onClick={() => handleConversationClick(conversation.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer info for free users */}
      {!canInitiate && (
        <div className="p-4 bg-gray-50 border-t">
          <div className="text-center">
            <p className="text-xs text-gray-600">
              Free members can reply to conversations
            </p>
            <Button
              variant="link"
              size="sm"
              className="text-bookconnect-sage p-0 h-auto text-xs"
              onClick={() => {
                // TODO: Navigate to upgrade page
                toast.info('Upgrade feature coming soon');
              }}
            >
              Upgrade to start conversations
            </Button>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

/**
 * Loading skeleton component for conversation list
 */
export function ConversationListSkeleton() {
  return (
    <div className="max-w-md mx-auto h-screen flex flex-col bg-white">
      {/* Header skeleton */}
      <div className="p-4 border-b bg-bookconnect-sage">
        <div className="flex items-center justify-between">
          <div className="h-6 bg-white/20 rounded w-24"></div>
          <div className="h-8 bg-white/20 rounded w-16"></div>
        </div>
      </div>

      {/* List skeleton */}
      <div className="flex-1 p-4 space-y-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="flex items-center space-x-4 p-4">
              <div className="rounded-full bg-gray-200 h-12 w-12"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
              <div className="space-y-1">
                <div className="h-3 bg-gray-200 rounded w-12"></div>
                <div className="h-4 bg-gray-200 rounded-full w-6 ml-auto"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Error boundary wrapper for conversation list
 */
export function ConversationListErrorBoundary({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <div className="max-w-md mx-auto h-screen flex flex-col bg-white">
      {children}
    </div>
  );
}
