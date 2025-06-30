/**
 * Enhanced Error Handling for Profile Synchronization
 * Provides comprehensive error types and user-friendly messages
 */

export enum SyncErrorType {
  AUTH_UPDATE_FAILED = 'AUTH_UPDATE_FAILED',
  DATABASE_UPDATE_FAILED = 'DATABASE_UPDATE_FAILED',
  SYNC_VALIDATION_FAILED = 'SYNC_VALIDATION_FAILED',
  CACHE_INVALIDATION_FAILED = 'CACHE_INVALIDATION_FAILED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  AVATAR_UPLOAD_FAILED = 'AVATAR_UPLOAD_FAILED',
  PARTIAL_SYNC_FAILURE = 'PARTIAL_SYNC_FAILURE'
}

export interface SyncErrorContext {
  userId?: string;
  operation?: string;
  timestamp?: Date;
  retryAttempt?: number;
  originalError?: Error;
}

export class ProfileSyncError extends Error {
  public readonly type: SyncErrorType;
  public readonly context: SyncErrorContext;
  public readonly recoverable: boolean;
  public readonly userMessage: string;

  constructor(
    type: SyncErrorType,
    message: string,
    context: SyncErrorContext = {},
    recoverable: boolean = true
  ) {
    super(message);
    this.name = 'ProfileSyncError';
    this.type = type;
    this.context = {
      ...context,
      timestamp: context.timestamp || new Date()
    };
    this.recoverable = recoverable;
    this.userMessage = this.getUserFriendlyMessage(type);
  }

  private getUserFriendlyMessage(type: SyncErrorType): string {
    const messages = {
      [SyncErrorType.AUTH_UPDATE_FAILED]: 
        'Failed to update your profile preferences. Please try again.',
      [SyncErrorType.DATABASE_UPDATE_FAILED]: 
        'Failed to save your profile. Your changes may not be visible to others.',
      [SyncErrorType.SYNC_VALIDATION_FAILED]: 
        'Profile synchronization incomplete. Some changes may not be visible.',
      [SyncErrorType.CACHE_INVALIDATION_FAILED]: 
        'Profile updated but may take a moment to appear. Please refresh if needed.',
      [SyncErrorType.NETWORK_ERROR]: 
        'Network error. Please check your connection and try again.',
      [SyncErrorType.PERMISSION_DENIED]: 
        'You don\'t have permission to perform this action.',
      [SyncErrorType.AVATAR_UPLOAD_FAILED]: 
        'Failed to upload avatar image. Please try again with a different image.',
      [SyncErrorType.PARTIAL_SYNC_FAILURE]: 
        'Some profile changes were saved, but others failed. Please review and try again.'
    };

    return messages[type] || 'An unexpected error occurred. Please try again.';
  }

  /**
   * Create error from Supabase error
   */
  static fromSupabaseError(
    error: any,
    context: SyncErrorContext = {}
  ): ProfileSyncError {
    if (error?.code === '23505') {
      return new ProfileSyncError(
        SyncErrorType.DATABASE_UPDATE_FAILED,
        'Duplicate data constraint violation',
        context,
        true
      );
    }

    if (error?.code === '42501' || error?.message?.includes('permission')) {
      return new ProfileSyncError(
        SyncErrorType.PERMISSION_DENIED,
        'Permission denied',
        context,
        false
      );
    }

    if (error?.message?.includes('network') || error?.code === 'NETWORK_ERROR') {
      return new ProfileSyncError(
        SyncErrorType.NETWORK_ERROR,
        'Network connection error',
        context,
        true
      );
    }

    return new ProfileSyncError(
      SyncErrorType.DATABASE_UPDATE_FAILED,
      error?.message || 'Unknown database error',
      { ...context, originalError: error },
      true
    );
  }

  /**
   * Create error from Auth error
   */
  static fromAuthError(
    error: any,
    context: SyncErrorContext = {}
  ): ProfileSyncError {
    return new ProfileSyncError(
      SyncErrorType.AUTH_UPDATE_FAILED,
      error?.message || 'Authentication error',
      { ...context, originalError: error },
      true
    );
  }

  /**
   * Log error with context for monitoring
   */
  logError(): void {
    console.error('ProfileSyncError:', {
      type: this.type,
      message: this.message,
      context: this.context,
      recoverable: this.recoverable,
      stack: this.stack
    });
  }
}

/**
 * Error recovery strategies
 */
export interface RecoveryStrategy {
  canRecover: (error: ProfileSyncError) => boolean;
  recover: (error: ProfileSyncError) => Promise<boolean>;
  description: string;
}

export const RECOVERY_STRATEGIES: RecoveryStrategy[] = [
  {
    canRecover: (error) => error.type === SyncErrorType.CACHE_INVALIDATION_FAILED,
    recover: async (error) => {
      try {
        const { clearProfileCache } = await import('@/services/profileService');
        clearProfileCache();
        return true;
      } catch {
        return false;
      }
    },
    description: 'Clear profile cache'
  },
  {
    canRecover: (error) => error.type === SyncErrorType.SYNC_VALIDATION_FAILED,
    recover: async (error) => {
      if (!error.context.userId) return false;
      try {
        const { syncUserProfileToDatabase } = await import('@/lib/syncUserProfile');
        return await syncUserProfileToDatabase(error.context.userId);
      } catch {
        return false;
      }
    },
    description: 'Retry profile synchronization'
  }
];

/**
 * Attempt automatic error recovery
 */
export async function attemptErrorRecovery(error: ProfileSyncError): Promise<boolean> {
  if (!error.recoverable) return false;

  for (const strategy of RECOVERY_STRATEGIES) {
    if (strategy.canRecover(error)) {
      try {
        const recovered = await strategy.recover(error);
        if (recovered) {
          console.log(`Successfully recovered from error using: ${strategy.description}`);
          return true;
        }
      } catch (recoveryError) {
        console.warn(`Recovery strategy failed: ${strategy.description}`, recoveryError);
      }
    }
  }

  return false;
}
