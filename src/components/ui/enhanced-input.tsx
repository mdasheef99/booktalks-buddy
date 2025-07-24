/**
 * Enhanced Input Components with Validation and Character Counters
 */

import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getCharacterCount } from '@/lib/utils/formValidation';

interface EnhancedInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  maxLength?: number;
  showCharacterCount?: boolean;
  required?: boolean;
  type?: 'text' | 'email' | 'tel';
  placeholder?: string;
  className?: string;
}

interface EnhancedTextareaProps extends Omit<EnhancedInputProps, 'type'> {
  rows?: number;
}

export const EnhancedInput: React.FC<EnhancedInputProps> = ({
  id,
  label,
  value,
  onChange,
  onBlur,
  error,
  maxLength,
  showCharacterCount = false,
  required = false,
  type = 'text',
  placeholder,
  className
}) => {
  const hasError = !!error;
  const isValid = !hasError && value.length > 0;
  const characterCount = maxLength ? getCharacterCount(value, maxLength) : null;

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id} className="text-bookconnect-brown font-medium flex items-center">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      
      <div className="relative">
        <Input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          maxLength={maxLength}
          placeholder={placeholder}
          className={cn(
            "transition-colors duration-200",
            hasError && "border-red-500 focus:border-red-500",
            isValid && "border-green-500 focus:border-green-500"
          )}
        />
        
        {/* Validation Icon */}
        {(hasError || isValid) && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {hasError ? (
              <AlertCircle className="h-4 w-4 text-red-500" />
            ) : (
              <CheckCircle className="h-4 w-4 text-green-500" />
            )}
          </div>
        )}
      </div>

      {/* Character Counter */}
      {showCharacterCount && characterCount && (
        <div className={cn(
          "text-xs text-right",
          characterCount.isOverLimit && "text-red-500",
          characterCount.isNearLimit && !characterCount.isOverLimit && "text-yellow-600",
          !characterCount.isNearLimit && "text-gray-500"
        )}>
          {characterCount.current}/{characterCount.max}
        </div>
      )}

      {/* Error Message */}
      {hasError && (
        <p className="text-red-500 text-sm flex items-center">
          <AlertCircle className="h-4 w-4 mr-1" />
          {error}
        </p>
      )}
    </div>
  );
};

export const EnhancedTextarea: React.FC<EnhancedTextareaProps> = ({
  id,
  label,
  value,
  onChange,
  onBlur,
  error,
  maxLength,
  showCharacterCount = true,
  required = false,
  placeholder,
  rows = 4,
  className
}) => {
  const hasError = !!error;
  const isValid = !hasError && value.length > 0;
  const characterCount = maxLength ? getCharacterCount(value, maxLength) : null;

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id} className="text-bookconnect-brown font-medium flex items-center">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      
      <div className="relative">
        <Textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          maxLength={maxLength}
          placeholder={placeholder}
          rows={rows}
          className={cn(
            "transition-colors duration-200 resize-none",
            hasError && "border-red-500 focus:border-red-500",
            isValid && "border-green-500 focus:border-green-500"
          )}
        />
        
        {/* Validation Icon */}
        {(hasError || isValid) && (
          <div className="absolute right-3 top-3">
            {hasError ? (
              <AlertCircle className="h-4 w-4 text-red-500" />
            ) : (
              <CheckCircle className="h-4 w-4 text-green-500" />
            )}
          </div>
        )}
      </div>

      {/* Character Counter */}
      {showCharacterCount && characterCount && (
        <div className={cn(
          "text-xs text-right",
          characterCount.isOverLimit && "text-red-500",
          characterCount.isNearLimit && !characterCount.isOverLimit && "text-yellow-600",
          !characterCount.isNearLimit && "text-gray-500"
        )}>
          {characterCount.current}/{characterCount.max}
          {characterCount.isOverLimit && (
            <span className="ml-2 text-red-500 font-medium">
              ({Math.abs(characterCount.remaining)} over limit)
            </span>
          )}
        </div>
      )}

      {/* Error Message */}
      {hasError && (
        <p className="text-red-500 text-sm flex items-center">
          <AlertCircle className="h-4 w-4 mr-1" />
          {error}
        </p>
      )}
    </div>
  );
};
