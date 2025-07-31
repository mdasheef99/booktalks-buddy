/**
 * Analytics Error Handling Utilities
 * 
 * Centralized error handling for analytics API calls
 * Provides user-friendly error messages and fallback states
 */

export interface AnalyticsError {
  code: string;
  message: string;
  userMessage: string;
  isRetryable: boolean;
  fallbackData?: any;
}

export interface ErrorContext {
  operation: string;
  storeId?: string;
  timeRange?: number;
  additionalInfo?: Record<string, any>;
}

/**
 * Enhanced error handler for analytics operations
 */
export class AnalyticsErrorHandler {
  /**
   * Process and categorize analytics errors
   */
  static handleError(error: any, context: ErrorContext): AnalyticsError {
    // Database function not found (PGRST202)
    if (error?.code === 'PGRST202') {
      return {
        code: 'DATABASE_FUNCTION_MISSING',
        message: `Database function not found: ${error.details || 'Unknown function'}`,
        userMessage: 'Analytics features are currently being set up. Please try again in a few minutes.',
        isRetryable: true,
        fallbackData: this.getDefaultFallbackData(context.operation)
      };
    }

    // Network/connectivity errors
    if (error?.message?.includes('fetch') || error?.code === 'NETWORK_ERROR') {
      return {
        code: 'NETWORK_ERROR',
        message: `Network error during ${context.operation}`,
        userMessage: 'Unable to connect to analytics service. Please check your connection and try again.',
        isRetryable: true,
        fallbackData: this.getDefaultFallbackData(context.operation)
      };
    }

    // Permission/authentication errors
    if (error?.code === '401' || error?.message?.includes('unauthorized')) {
      return {
        code: 'UNAUTHORIZED',
        message: `Unauthorized access to ${context.operation}`,
        userMessage: 'You don\'t have permission to view this analytics data.',
        isRetryable: false,
        fallbackData: this.getDefaultFallbackData(context.operation)
      };
    }

    // Database constraint errors
    if (error?.code?.startsWith('23')) {
      return {
        code: 'DATABASE_CONSTRAINT',
        message: `Database constraint error: ${error.message}`,
        userMessage: 'There was a data validation issue. The analytics team has been notified.',
        isRetryable: false,
        fallbackData: this.getDefaultFallbackData(context.operation)
      };
    }

    // Timeout errors
    if (error?.message?.includes('timeout') || error?.code === 'TIMEOUT') {
      return {
        code: 'TIMEOUT',
        message: `Timeout during ${context.operation}`,
        userMessage: 'The request is taking longer than expected. Please try again.',
        isRetryable: true,
        fallbackData: this.getDefaultFallbackData(context.operation)
      };
    }

    // Generic error fallback
    return {
      code: 'UNKNOWN_ERROR',
      message: error?.message || `Unknown error during ${context.operation}`,
      userMessage: 'An unexpected error occurred. Please try refreshing the page.',
      isRetryable: true,
      fallbackData: this.getDefaultFallbackData(context.operation)
    };
  }

  /**
   * Get appropriate fallback data based on operation type
   */
  private static getDefaultFallbackData(operation: string): any {
    switch (operation) {
      case 'analytics_summary':
        return {
          totalImpressions: 0,
          totalClicks: 0,
          overallCTR: 0,
          activeBannersCount: 0,
          topPerformingBannerId: 'None',
          worstPerformingBannerId: 'None',
          avgCTRAllBanners: 0,
          totalSessions: 0,
          uniqueVisitors: 0,
          period: '30 days'
        };

      case 'banner_performance':
        return [];

      case 'time_series_data':
        return [];

      case 'comparison_data':
        return [];

      default:
        return null;
    }
  }

  /**
   * Log error with context for debugging
   */
  static logError(error: AnalyticsError, context: ErrorContext): void {
    const logData = {
      timestamp: new Date().toISOString(),
      error: {
        code: error.code,
        message: error.message,
        isRetryable: error.isRetryable
      },
      context,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'Server',
      url: typeof window !== 'undefined' ? window.location.href : 'Unknown'
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 Analytics Error: ${error.code}`);
      console.error('Error Details:', error);
      console.info('Context:', context);
      console.info('Full Log Data:', logData);
      console.groupEnd();
    }

    // In production, you might want to send this to an error tracking service
    // Example: Sentry, LogRocket, etc.
    if (process.env.NODE_ENV === 'production') {
      // sendToErrorTracking(logData);
    }
  }

  /**
   * Create user-friendly error message with retry instructions
   */
  static createUserErrorMessage(error: AnalyticsError, context: ErrorContext): string {
    let message = error.userMessage;

    if (error.isRetryable) {
      message += ' You can try the following:';
      message += '\n• Refresh the page';
      message += '\n• Check your internet connection';
      message += '\n• Try again in a few minutes';
    }

    if (context.operation === 'analytics_summary') {
      message += '\n\nNote: Basic analytics data will be shown while we resolve this issue.';
    }

    return message;
  }
}

/**
 * Wrapper function for analytics API calls with enhanced error handling
 */
export async function withAnalyticsErrorHandling<T>(
  operation: string,
  apiCall: () => Promise<T>,
  context: Partial<ErrorContext> = {}
): Promise<{ data: T | null; error: AnalyticsError | null }> {
  try {
    const data = await apiCall();
    return { data, error: null };
  } catch (rawError) {
    const fullContext: ErrorContext = {
      operation,
      ...context
    };

    const error = AnalyticsErrorHandler.handleError(rawError, fullContext);
    AnalyticsErrorHandler.logError(error, fullContext);

    return { 
      data: error.fallbackData as T, 
      error 
    };
  }
}

export default AnalyticsErrorHandler;
