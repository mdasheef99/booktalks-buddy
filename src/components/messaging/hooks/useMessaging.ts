/**
 * Direct Messaging System - Messaging Hook
 * 
 * Custom hook for messaging operations from profile pages and other components.
 * Handles conversation initiation, permission checking, and navigation.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  startConversation, 
  canInitiateConversations,
  getUserMessagingPermissions 
} from '@/lib/api/messaging';
import { toast } from 'sonner';

interface UseMessagingOptions {
  onSuccess?: (conversationId: string, isExisting: boolean) => void;
  onError?: (error: Error) => void;
  showToasts?: boolean;
}

/**
 * Main messaging hook for conversation management
 */
export function useMessaging(options: UseMessagingOptions = {}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { onSuccess, onError, showToasts = true } = options;

  // Check if user can initiate conversations
  const { 
    data: canInitiate, 
    isLoading: isCheckingPermissions 
  } = useQuery({
    queryKey: ['canInitiateConversations', user?.id],
    queryFn: () => canInitiateConversations(user!.id),
    enabled: !!user?.id
  });

  // Get user's messaging permissions
  const { 
    data: permissions 
  } = useQuery({
    queryKey: ['messagingPermissions', user?.id],
    queryFn: () => getUserMessagingPermissions(user!.id),
    enabled: !!user?.id
  });

  // Start conversation mutation
  const startConversationMutation = useMutation({
    mutationFn: (recipientUsername: string) => 
      startConversation(user!.id, recipientUsername),
    onSuccess: (data) => {
      // Invalidate conversations cache
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      
      if (showToasts) {
        if (data.is_existing) {
          toast.success('Opened existing conversation');
        } else {
          toast.success('Started new conversation');
        }
      }
      
      // Call custom success handler
      onSuccess?.(data.conversation_id, data.is_existing);
      
      // Navigate to conversation
      navigate(`/messages/${data.conversation_id}`);
    },
    onError: (error: Error) => {
      if (showToasts) {
        toast.error(error.message || 'Failed to start conversation');
      }
      onError?.(error);
    }
  });

  /**
   * Start a conversation with a user by username
   */
  const handleStartConversation = (username: string) => {
    if (!user) {
      if (showToasts) {
        toast.error('Please log in to send messages');
      }
      navigate('/login');
      return;
    }

    if (!canInitiate) {
      if (showToasts) {
        toast.error('Upgrade to Privileged tier to start conversations');
      }
      return;
    }

    if (!username?.trim()) {
      if (showToasts) {
        toast.error('Username is required');
      }
      return;
    }

    startConversationMutation.mutate(username.trim());
  };

  /**
   * Navigate to messages page
   */
  const navigateToMessages = () => {
    navigate('/messages');
  };

  /**
   * Navigate to new conversation page
   */
  const navigateToNewConversation = () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!canInitiate) {
      if (showToasts) {
        toast.error('Upgrade to Privileged tier to start conversations');
      }
      return;
    }

    navigate('/messages/new');
  };

  /**
   * Check if user can message another user
   */
  const canMessageUser = (targetUsername?: string) => {
    if (!user || !targetUsername) return false;
    if (user.email?.split('@')[0] === targetUsername) return false; // Can't message self
    return canInitiate;
  };

  /**
   * Get upgrade message for users who can't initiate conversations
   */
  const getUpgradeMessage = () => {
    if (!permissions) return 'Upgrade to start conversations';

    // For MEMBER tier users, suggest upgrading to PRIVILEGED
    if (permissions.tier === 'Free' || permissions.tier === 'Member') {
      return 'Upgrade to Privileged tier to start conversations';
    }

    return 'Upgrade required to start conversations';
  };

  return {
    // State
    canInitiate,
    permissions,
    isStarting: startConversationMutation.isPending,
    isCheckingPermissions,
    
    // Actions
    handleStartConversation,
    navigateToMessages,
    navigateToNewConversation,
    canMessageUser,
    
    // Utilities
    getUpgradeMessage,
    
    // Raw mutation for advanced usage
    startConversationMutation
  };
}

/**
 * Simplified hook for profile integration
 */
export function useProfileMessaging(targetUsername?: string) {
  const messaging = useMessaging({
    showToasts: true
  });

  const canMessage = messaging.canMessageUser(targetUsername);
  
  const handleMessageUser = () => {
    if (targetUsername) {
      messaging.handleStartConversation(targetUsername);
    }
  };

  return {
    canMessage,
    handleMessageUser,
    isStarting: messaging.isStarting,
    canInitiate: messaging.canInitiate,
    upgradeMessage: messaging.getUpgradeMessage()
  };
}

/**
 * Hook for messaging button states and labels
 */
export function useMessagingButton(targetUsername?: string) {
  const { canMessage, handleMessageUser, isStarting, canInitiate, upgradeMessage } = useProfileMessaging(targetUsername);

  const getButtonProps = () => {
    if (!targetUsername) {
      return {
        disabled: true,
        children: 'Message',
        onClick: () => {},
        variant: 'outline' as const
      };
    }

    if (isStarting) {
      return {
        disabled: true,
        children: 'Starting...',
        onClick: () => {},
        variant: 'outline' as const
      };
    }

    if (!canInitiate) {
      return {
        disabled: false,
        children: 'Upgrade to Message',
        onClick: () => {
          toast.info(upgradeMessage);
        },
        variant: 'outline' as const
      };
    }

    return {
      disabled: false,
      children: 'Message',
      onClick: handleMessageUser,
      variant: 'default' as const
    };
  };

  return {
    ...getButtonProps(),
    canMessage,
    isStarting
  };
}

/**
 * Hook for conversation list management
 */
export function useConversationList() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const navigateToConversation = (conversationId: string) => {
    navigate(`/messages/${conversationId}`);
  };

  const navigateToMessages = () => {
    navigate('/messages');
  };

  return {
    navigateToConversation,
    navigateToMessages,
    userId: user?.id
  };
}
