import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Check, X, Loader2, AlertCircle, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  validateUsername,
  checkUsernameAvailability,
  generateUsernameSuggestions,
  validateUsernameComprehensive,
  UsernameValidationResult
} from '@/utils/usernameValidation';

interface UsernameFieldProps {
  value: string;
  onChange: (value: string) => void;
  onValidationChange?: (isValid: boolean) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  showSuggestions?: boolean;
  excludeUserId?: string;
  label?: string;
}

const UsernameField: React.FC<UsernameFieldProps> = ({
  value,
  onChange,
  onValidationChange,
  className,
  placeholder = "Enter username (3-20 characters)",
  disabled = false,
  required = true,
  showSuggestions = true,
  excludeUserId,
  label = "Username"
}) => {
  const [validation, setValidation] = useState<UsernameValidationResult & { isAvailable?: boolean }>({ isValid: true, errors: [] });
  const [isChecking, setIsChecking] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    const checkUsername = async () => {
      const trimmedValue = value.trim();

      // Reset state for empty values
      if (!trimmedValue) {
        setValidation({ isValid: true, errors: [] });
        setSuggestions([]);
        onValidationChange?.(false);
        return;
      }

      // Quick format check first (immediate feedback)
      const formatValidation = validateUsername(trimmedValue);
      if (!formatValidation.isValid) {
        setValidation({ ...formatValidation, isAvailable: false });
        setSuggestions(formatValidation.suggestions || []);
        onValidationChange?.(false);
        return;
      }

      // Start comprehensive validation (format + availability)
      setIsChecking(true);
      try {
        const comprehensiveResult = await validateUsernameComprehensive(trimmedValue, excludeUserId);
        setValidation(comprehensiveResult);
        setSuggestions(comprehensiveResult.suggestions || []);
        onValidationChange?.(comprehensiveResult.isValid);
      } catch (error) {
        console.error('Error validating username:', error);
        setValidation({
          isValid: false,
          errors: ['Unable to validate username. Please try again.'],
          isAvailable: false
        });
        onValidationChange?.(false);
      } finally {
        setIsChecking(false);
      }
    };

    // Debounce the validation
    timeoutRef.current = setTimeout(checkUsername, 500);

    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, excludeUserId, onValidationChange]);

  const handleUsernameChange = (newUsername: string) => {
    // Enforce max length and basic format during typing
    const cleanUsername = newUsername.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 20);
    onChange(cleanUsername);
  };

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion);
  };

  const getStatusIcon = () => {
    if (isChecking) {
      return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
    }

    if (validation.errors.length > 0) {
      return <X className="h-4 w-4 text-red-500" />;
    }

    if (validation.isAvailable === true && validation.isValid) {
      return <Check className="h-4 w-4 text-green-500" />;
    }

    return null;
  };

  const getInputClassName = () => {
    if (isChecking) {
      return "border-blue-300 focus:ring-blue-500";
    }

    if (validation.errors.length > 0) {
      return "border-red-300 focus:ring-red-500";
    }

    if (validation.isAvailable === true && validation.isValid) {
      return "border-green-300 focus:ring-green-500";
    }

    return "border-bookconnect-brown/30 focus:ring-bookconnect-sage";
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor="username" className="text-bookconnect-brown">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>

      <div className="relative">
        <Input
          id="username"
          value={value}
          onChange={(e) => handleUsernameChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "font-mono pr-10",
            getInputClassName()
          )}
          maxLength={20}
          autoComplete="username"
          aria-describedby={validation.errors.length > 0 ? 'username-error' : undefined}
          aria-invalid={validation.errors.length > 0}
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
          {getStatusIcon()}
        </div>
      </div>

      {/* Validation errors */}
      {validation.errors.length > 0 && (
        <div id="username-error" className="space-y-1" role="alert">
          {validation.errors.map((error, index) => (
            <p key={index} className="text-sm text-red-600 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </p>
          ))}
        </div>
      )}

      {/* Success message */}
      {validation.isAvailable === true && validation.isValid && (
        <p className="text-sm text-green-600 flex items-center gap-2">
          <Check className="h-4 w-4" />
          <span>Username is available!</span>
        </p>
      )}

      {/* Checking message */}
      {isChecking && (
        <p className="text-sm text-blue-600 flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Checking availability...</span>
        </p>
      )}

      {/* Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <div className="flex items-start gap-2">
            <Lightbulb className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-blue-700 mb-2">
                {validation.errors.length > 0 ? 'Try these suggestions:' : 'How about:'}
              </p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((suggestion, index) => (
                  <Button
                    key={index}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="font-mono text-blue-700 border-blue-300 hover:bg-blue-100 text-xs h-7 px-2"
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Help text */}
      {!isChecking && validation.errors.length === 0 && !validation.isValid && (
        <p className="text-xs text-gray-500">
          3-20 characters, letters, numbers, and underscores only
        </p>
      )}
    </div>
  );
};

export default UsernameField;
