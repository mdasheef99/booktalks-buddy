import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { AlertCircle, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { validateDisplayName, UsernameValidationResult } from '@/utils/usernameValidation';

interface DisplayNameFieldProps {
  value: string;
  onChange: (value: string) => void;
  onValidationChange?: (isValid: boolean) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
}

const DisplayNameField: React.FC<DisplayNameFieldProps> = ({
  value,
  onChange,
  onValidationChange,
  className,
  placeholder = "Enter display name (optional)",
  disabled = false,
  required = false
}) => {
  const [validation, setValidation] = useState<UsernameValidationResult>({ isValid: true, errors: [] });

  useEffect(() => {
    const validationResult = validateDisplayName(value);
    setValidation(validationResult);
    onValidationChange?.(validationResult.isValid);
  }, [value, onValidationChange]);

  const handleDisplayNameChange = (newDisplayName: string) => {
    // Enforce max length during typing
    const cleanDisplayName = newDisplayName.slice(0, 50);
    onChange(cleanDisplayName);
  };

  const getInputClassName = () => {
    if (validation.errors.length > 0) {
      return "border-red-500 focus:border-red-500";
    }
    return "";
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">
        Display Name {required && <span className="text-red-500">*</span>}
      </label>
      
      <div className="relative">
        <Input
          value={value}
          onChange={(e) => handleDisplayNameChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "pr-10",
            getInputClassName(),
            className
          )}
          maxLength={50}
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <User className="h-4 w-4 text-gray-400" />
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

      {/* Character count */}
      <div className="flex justify-between items-center">
        <p className="text-xs text-gray-500">
          Your friendly name that others will see
        </p>
        <p className="text-xs text-gray-400">
          {value.length}/50
        </p>
      </div>
    </div>
  );
};

export default DisplayNameField;
