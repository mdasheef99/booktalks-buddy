/**
 * Enhanced Form Wrapper with comprehensive error handling
 * Provides consistent form error handling, validation, and user feedback
 */

import React, { useState, useCallback, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { ErrorManager, AppError, ErrorType, ErrorSeverity } from '@/lib/errors/ErrorManager';
import { useNetworkStatus } from '@/lib/network/NetworkManager';

export interface FormError {
  field?: string;
  message: string;
  type: 'validation' | 'network' | 'server' | 'unknown';
}

export interface FormState {
  isSubmitting: boolean;
  isValid: boolean;
  errors: FormError[];
  submitAttempts: number;
  lastSubmitTime?: Date;
}

export interface EnhancedFormProps {
  children: ReactNode;
  onSubmit: (data: any) => Promise<any>;
  onSuccess?: (result: any) => void;
  onError?: (error: AppError) => void;
  validation?: (data: any) => FormError[];
  submitText?: string;
  submitingText?: string;
  maxRetries?: number;
  retryDelay?: number;
  showNetworkStatus?: boolean;
  className?: string;
}

export function EnhancedFormWrapper({
  children,
  onSubmit,
  onSuccess,
  onError,
  validation,
  submitText = 'Submit',
  submitingText = 'Submitting...',
  maxRetries = 3,
  retryDelay = 2000,
  showNetworkStatus = true,
  className = ''
}: EnhancedFormProps) {
  const [formState, setFormState] = useState<FormState>({
    isSubmitting: false,
    isValid: true,
    errors: [],
    submitAttempts: 0
  });

  const { isOnline, isOffline, isSlowConnection } = useNetworkStatus();

  /**
   * Update form state
   */
  const updateFormState = useCallback((updates: Partial<FormState>) => {
    setFormState(prev => ({ ...prev, ...updates }));
  }, []);

  /**
   * Add form error
   */
  const addError = useCallback((error: FormError) => {
    setFormState(prev => ({
      ...prev,
      errors: [...prev.errors.filter(e => e.field !== error.field), error],
      isValid: false
    }));
  }, []);

  /**
   * Clear errors
   */
  const clearErrors = useCallback((field?: string) => {
    setFormState(prev => ({
      ...prev,
      errors: field ? prev.errors.filter(e => e.field !== field) : [],
      isValid: field ? prev.errors.filter(e => e.field !== field).length === 0 : true
    }));
  }, []);

  /**
   * Handle form submission with comprehensive error handling
   */
  const handleSubmit = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    // Check network status
    if (isOffline) {
      addError({
        message: 'You appear to be offline. Please check your connection and try again.',
        type: 'network'
      });
      return;
    }

    // Clear previous errors
    clearErrors();

    // Get form data
    const formData = new FormData(event.currentTarget);
    const data = Object.fromEntries(formData.entries());

    // Client-side validation
    if (validation) {
      const validationErrors = validation(data);
      if (validationErrors.length > 0) {
        validationErrors.forEach(addError);
        return;
      }
    }

    // Update state for submission
    updateFormState({
      isSubmitting: true,
      submitAttempts: formState.submitAttempts + 1,
      lastSubmitTime: new Date()
    });

    try {
      // Execute submission with retry logic
      const result = await ErrorManager.withRetry(
        () => onSubmit(data),
        `form_submit_${Date.now()}`,
        maxRetries,
        retryDelay
      );

      // Handle success
      updateFormState({ isSubmitting: false });
      onSuccess?.(result);

    } catch (error) {
      updateFormState({ isSubmitting: false });

      // Create structured error
      const appError = error instanceof AppError 
        ? error 
        : new AppError(
            ErrorType.FORM_ERROR,
            error instanceof Error ? error.message : 'Form submission failed',
            {
              operation: 'form_submit',
              component: 'EnhancedFormWrapper',
              metadata: { submitAttempts: formState.submitAttempts + 1 }
            },
            ErrorSeverity.MEDIUM
          );

      // Add form error
      addError({
        message: appError.userMessage,
        type: this.getErrorType(appError)
      });

      // Call error handler
      onError?.(appError);

      // Log error
      ErrorManager.handleError(appError, {}, false); // Don't show toast, we show inline error
    }
  }, [
    isOffline, 
    validation, 
    onSubmit, 
    onSuccess, 
    onError, 
    maxRetries, 
    retryDelay,
    formState.submitAttempts,
    addError,
    clearErrors,
    updateFormState
  ]);

  /**
   * Get error type from AppError
   */
  const getErrorType = (error: AppError): FormError['type'] => {
    switch (error.type) {
      case ErrorType.NETWORK_ERROR:
      case ErrorType.OFFLINE_ERROR:
      case ErrorType.TIMEOUT_ERROR:
        return 'network';
      case ErrorType.VALIDATION_ERROR:
        return 'validation';
      case ErrorType.DATABASE_ERROR:
      case ErrorType.API_ERROR:
        return 'server';
      default:
        return 'unknown';
    }
  };

  /**
   * Retry form submission
   */
  const handleRetry = useCallback(() => {
    const form = document.querySelector('form') as HTMLFormElement;
    if (form) {
      form.requestSubmit();
    }
  }, []);

  /**
   * Render error alerts
   */
  const renderErrors = () => {
    if (formState.errors.length === 0) return null;

    return (
      <div className="space-y-2 mb-4">
        {formState.errors.map((error, index) => (
          <Alert key={index} variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error.field && <strong>{error.field}: </strong>}
              {error.message}
            </AlertDescription>
          </Alert>
        ))}
      </div>
    );
  };

  /**
   * Render network status
   */
  const renderNetworkStatus = () => {
    if (!showNetworkStatus) return null;

    if (isOffline) {
      return (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You're currently offline. Please check your connection.
          </AlertDescription>
        </Alert>
      );
    }

    if (isSlowConnection) {
      return (
        <Alert className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Slow connection detected. Form submission may take longer than usual.
          </AlertDescription>
        </Alert>
      );
    }

    return null;
  };

  /**
   * Render submit button
   */
  const renderSubmitButton = () => {
    const canRetry = formState.errors.some(e => e.type === 'network' || e.type === 'server') 
                    && formState.submitAttempts < maxRetries;

    return (
      <div className="flex gap-2">
        <Button
          type="submit"
          disabled={formState.isSubmitting || isOffline || !formState.isValid}
          className="flex items-center gap-2"
        >
          {formState.isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {formState.isSubmitting ? submitingText : submitText}
        </Button>

        {canRetry && (
          <Button
            type="button"
            variant="outline"
            onClick={handleRetry}
            disabled={formState.isSubmitting}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Retry ({formState.submitAttempts}/{maxRetries})
          </Button>
        )}
      </div>
    );
  };

  return (
    <div className={className}>
      <form onSubmit={handleSubmit} noValidate>
        {renderNetworkStatus()}
        {renderErrors()}
        
        <div className="space-y-4">
          {children}
        </div>

        <div className="mt-6">
          {renderSubmitButton()}
        </div>
      </form>

      {/* Success indicator */}
      {formState.submitAttempts > 0 && formState.errors.length === 0 && !formState.isSubmitting && (
        <Alert className="mt-4">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Form submitted successfully!
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

/**
 * Hook for form error management
 */
export function useFormErrors() {
  const [errors, setErrors] = useState<FormError[]>([]);

  const addError = useCallback((error: FormError) => {
    setErrors(prev => [...prev.filter(e => e.field !== error.field), error]);
  }, []);

  const removeError = useCallback((field: string) => {
    setErrors(prev => prev.filter(e => e.field !== field));
  }, []);

  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  const hasErrors = errors.length > 0;
  const hasFieldError = useCallback((field: string) => {
    return errors.some(e => e.field === field);
  }, [errors]);

  const getFieldError = useCallback((field: string) => {
    return errors.find(e => e.field === field);
  }, [errors]);

  return {
    errors,
    addError,
    removeError,
    clearErrors,
    hasErrors,
    hasFieldError,
    getFieldError
  };
}

export default EnhancedFormWrapper;
