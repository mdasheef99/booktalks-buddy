import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Check, X, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  validateUsername, 
  checkUsernameAvailability, 
  generateUsernameSuggestions,
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
}

const UsernameField: React.FC<UsernameFieldProps> = ({
  value,
  onChange,
  onValidationChange,
  className,
  placeholder = "Enter username (3-20 characters)",
  disabled = false,
  required = true,
  showSuggestions = true
}) => {
  const [validation, setValidation] = useState<UsernameValidationResult>({ isValid: true, errors: [] });
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    const checkUsername = async () => {
      if (!value || value.length < 3) {
        setValidation({ isValid: false, errors: [] });
        setIsAvailable(null);
        setSuggestions([]);
        onValidationChange?.(false);
        return;
      }

      // Validate format first
      const validationResult = validateUsername(value);
      setValidation(validationResult);

      if (validationResult.isValid) {
        setIsChecking(true);
        try {
          const available = await checkUsernameAvailability(value);
          setIsAvailable(available);
          
          if (!available) {
            // Generate suggestions if username is taken
            const newSuggestions = generateUsernameSuggestions(value);
            setSuggestions(newSuggestions);
          } else {
            setSuggestions([]);
          }
          
          onValidationChange?.(available);
        } catch (error) {
          console.error('Error checking username availability:', error);
          setIsAvailable(null);
          onValidationChange?.(false);
        } finally {
          setIsChecking(false);
        }
      } else {
        setIsAvailable(null);
        setSuggestions(validationResult.suggestions || []);
        onValidationChange?.(false);
      }
    };

    const timeoutId = setTimeout(checkUsername, 300); // Debounce
    return () => clearTimeout(timeoutId);
  }, [value, onValidationChange]);

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
      return <Loader2 className="h-4 w-4 animate-spin text-gray-400" />;
    }
    
    if (validation.errors.length > 0) {
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
    
    if (isAvailable === true) {
      return <Check className="h-4 w-4 text-green-500" />;
    }
    
    if (isAvailable === false) {
      return <X className="h-4 w-4 text-yellow-500" />;
    }
    
    return null;
  };

  const getInputClassName = () => {
    if (validation.errors.length > 0) {
      return "border-red-500 focus:border-red-500";
    }
    
    if (isAvailable === true) {
      return "border-green-500 focus:border-green-500";
    }
    
    if (isAvailable === false) {
      return "border-yellow-500 focus:border-yellow-500";
    }
    
    return "";
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">
        Username {required && <span className="text-red-500">*</span>}
      </label>
      
      <div className="relative">
        <Input
          value={value}
          onChange={(e) => handleUsernameChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "pr-10",
            getInputClassName(),
            className
          )}
          maxLength={20}
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          {getStatusIcon()}
        </div>
      </div>

      {/* Validation errors */}
      {validation.errors.length > 0 && (
        <div className="space-y-1">
          {validation.errors.map((error, index) => (
            <p key={index} className="text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {error}
            </p>
          ))}
        </div>
      )}

      {/* Availability status */}
      {isAvailable === false && (
        <p className="text-sm text-yellow-600 flex items-center gap-1">
          <X className="h-3 w-3" />
          Username is already taken
        </p>
      )}

      {isAvailable === true && (
        <p className="text-sm text-green-600 flex items-center gap-1">
          <Check className="h-3 w-3" />
          Username is available
        </p>
      )}

      {/* Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-gray-600">Suggestions:</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion, index) => (
              <Button
                key={index}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleSuggestionClick(suggestion)}
                className="text-xs h-7 px-2"
              >
                {suggestion}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Help text */}
      <p className="text-xs text-gray-500">
        3-20 characters, letters, numbers, and underscores only
      </p>
    </div>
  );
};

export default UsernameField;
