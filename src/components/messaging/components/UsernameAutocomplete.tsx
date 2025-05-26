/**
 * Username Autocomplete Component
 *
 * Provides autocomplete functionality for username selection in messaging.
 * Features debounced search, keyboard navigation, and store isolation.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, User, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { searchUsersInStore } from '@/lib/api/messaging';
import { MessagingUser } from '@/lib/api/messaging/types';
import { UserName } from '@/components/common/UserName';
import { useDebounce } from '@/hooks/useDebounce';

interface UsernameAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (user: MessagingUser) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Username autocomplete with debounced search and keyboard navigation
 */
export function UsernameAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = "Enter username...",
  disabled = false,
  className = ''
}: UsernameAutocompleteProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Debounce search query to avoid excessive API calls
  const debouncedQuery = useDebounce(value, 300);

  // Search for users when query changes
  const {
    data: searchResults = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['searchUsers', user?.id, debouncedQuery],
    queryFn: () => searchUsersInStore(user!.id, debouncedQuery),
    enabled: !!user?.id && debouncedQuery.length >= 2,
    staleTime: 30000 // Cache results for 30 seconds
  });

  /**
   * Handle input value changes
   */
  const handleInputChange = useCallback((newValue: string) => {
    onChange(newValue);
    setSelectedIndex(-1);
    setIsOpen(newValue.length >= 2);
  }, [onChange]);

  /**
   * Handle user selection
   */
  const handleUserSelect = useCallback((selectedUser: MessagingUser) => {
    onChange(selectedUser.username);
    onSelect(selectedUser);
    // Immediately close dropdown and clear selection
    setIsOpen(false);
    setSelectedIndex(-1);
    // Force blur to ensure dropdown closes
    setTimeout(() => {
      inputRef.current?.blur();
    }, 0);
  }, [onChange, onSelect]);

  /**
   * Handle keyboard navigation
   */
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen || searchResults.length === 0) {
      if (e.key === 'Enter') {
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < searchResults.length - 1 ? prev + 1 : 0
        );
        break;

      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev > 0 ? prev - 1 : searchResults.length - 1
        );
        break;

      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < searchResults.length) {
          handleUserSelect(searchResults[selectedIndex]);
        }
        break;

      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  }, [isOpen, searchResults, selectedIndex, handleUserSelect]);

  /**
   * Handle input focus
   */
  const handleFocus = useCallback(() => {
    if (value.length >= 2) {
      setIsOpen(true);
    }
  }, [value]);

  /**
   * Handle input blur with delay to allow for clicks
   * Increased delay to ensure click events are processed before blur
   */
  const handleBlur = useCallback(() => {
    setTimeout(() => {
      setIsOpen(false);
      setSelectedIndex(-1);
    }, 200); // Increased from 150ms to 200ms
  }, []);

  /**
   * Scroll selected item into view
   */
  useEffect(() => {
    if (selectedIndex >= 0 && listRef.current) {
      const selectedElement = listRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        });
      }
    }
  }, [selectedIndex]);

  const showDropdown = isOpen && (searchResults.length > 0 || isLoading || error);

  return (
    <div className={`relative ${className}`}>
      {/* Input field */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          ref={inputRef}
          value={value}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          className="pl-10 pr-10"
          disabled={disabled}
          maxLength={50}
          autoComplete="off"
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-autocomplete="list"
        />

        {/* Loading indicator */}
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          </div>
        )}
      </div>

      {/* Dropdown list */}
      {showDropdown && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
          <div ref={listRef} role="listbox">
            {isLoading && (
              <div className="px-4 py-3 text-sm text-gray-500 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Searching users...
              </div>
            )}

            {error && (
              <div className="px-4 py-3 text-sm text-red-600">
                Error searching users. Please try again.
              </div>
            )}

            {!isLoading && !error && searchResults.length === 0 && debouncedQuery.length >= 2 && (
              <div className="px-4 py-3 text-sm text-gray-500">
                No users found matching "{debouncedQuery}"
              </div>
            )}

            {searchResults.map((searchUser, index) => (
              <button
                key={searchUser.id}
                className={`
                  w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50
                  focus:outline-none transition-colors flex items-center gap-3
                  ${index === selectedIndex ? 'bg-bookconnect-sage/10' : ''}
                `}
                onMouseDown={(e) => {
                  // Prevent blur event when clicking on dropdown items
                  e.preventDefault();
                }}
                onClick={() => handleUserSelect(searchUser)}
                role="option"
                aria-selected={index === selectedIndex}
              >
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-bookconnect-sage/20 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-bookconnect-sage" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900">
                    @{searchUser.username}
                  </div>
                  {searchUser.displayname && searchUser.displayname !== searchUser.username && (
                    <div className="text-xs text-gray-500 truncate">
                      {searchUser.displayname}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Simple username input with autocomplete for forms
 */
export function UsernameInput({
  value,
  onChange,
  onUserSelect,
  placeholder = "Enter username...",
  disabled = false,
  className = ''
}: {
  value: string;
  onChange: (value: string) => void;
  onUserSelect?: (user: MessagingUser) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}) {
  const handleSelect = useCallback((user: MessagingUser) => {
    onUserSelect?.(user);
  }, [onUserSelect]);

  return (
    <UsernameAutocomplete
      value={value}
      onChange={onChange}
      onSelect={handleSelect}
      placeholder={placeholder}
      disabled={disabled}
      className={className}
    />
  );
}
