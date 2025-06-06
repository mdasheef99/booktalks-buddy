/**
 * Conversation Permissions Hook
 * 
 * Handles permission checking for conversation creation
 */

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { canInitiateConversations } from '@/lib/api/messaging';
import type { UseConversationPermissionsReturn } from '../types';

/**
 * Hook to check conversation permissions
 */
export function useConversationPermissions(): UseConversationPermissionsReturn {
  const { user } = useAuth();

  const { data: canInitiate, isLoading, error } = useQuery({
    queryKey: ['canInitiateConversations', user?.id],
    queryFn: () => canInitiateConversations(user!.id),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2
  });

  return {
    canInitiate: canInitiate || false,
    isLoading,
    error: error?.message
  };
}
