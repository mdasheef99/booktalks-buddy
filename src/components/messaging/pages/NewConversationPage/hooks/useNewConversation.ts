/**
 * New Conversation Hook
 * 
 * Handles state management and logic for creating new conversations
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { startConversation } from '@/lib/api/messaging';
import { toast } from 'sonner';
import { useConversationPermissions } from './useConversationPermissions';
import type { 
  UseNewConversationReturn, 
  ConversationFormData,
  MessagingUser 
} from '../types';

/**
 * Hook to manage new conversation state and actions
 */
export function useNewConversation(): UseNewConversationReturn {
  const navigate = useNavigate();
  const { user } = useAuth();
  const permissions = useConversationPermissions();
  
  // Form state
  const [formData, setFormData] = useState<ConversationFormData>({
    username: '',
    selectedUser: null,
    message: ''
  });
  
  const [isValidating, setIsValidating] = useState(false);

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
      if (formData.message.trim()) {
        navigate(`/messages/${data.conversation_id}?initialMessage=${encodeURIComponent(formData.message.trim())}`);
      } else {
        navigate(`/messages/${data.conversation_id}`);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to start conversation');
    }
  });

  // Calculate loading and submission states
  const isLoading = startConversationMutation.isPending || isValidating;
  const canSubmit = formData.username.trim().length > 0 && 
                   formData.message.trim().length > 0 && 
                   permissions.canInitiate && 
                   !isLoading;

  // Action handlers
  const handleUsernameChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      username: value,
      // Clear selected user if username is manually changed
      selectedUser: prev.selectedUser && value !== prev.selectedUser.username ? null : prev.selectedUser
    }));
  };

  const handleUserSelect = (user: MessagingUser) => {
    setFormData(prev => ({
      ...prev,
      selectedUser: user,
      username: user.username
    }));
  };

  const handleMessageChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      message: value
    }));
  };

  const handleClearSelection = () => {
    setFormData({
      username: '',
      selectedUser: null,
      message: ''
    });
  };

  const handleStartConversation = async () => {
    const trimmedUsername = formData.username.trim();

    // Validation
    if (!trimmedUsername) {
      toast.error('Please select a user');
      return;
    }

    if (!permissions.canInitiate) {
      toast.error('You need to upgrade to start conversations');
      return;
    }

    if (!formData.message.trim()) {
      toast.error('Please enter a message to start the conversation');
      return;
    }

    startConversationMutation.mutate(trimmedUsername);
  };

  const handleBack = () => {
    navigate('/messages');
  };

  return {
    formData,
    permissions,
    isLoading,
    canSubmit,
    actions: {
      handleUsernameChange,
      handleUserSelect,
      handleMessageChange,
      handleClearSelection,
      handleStartConversation,
      handleBack
    }
  };
}
