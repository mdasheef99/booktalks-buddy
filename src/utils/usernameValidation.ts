// Enhanced Username Validation System
// Implements comprehensive validation for mandatory username system

export interface UsernameValidationResult {
  isValid: boolean;
  errors: string[];
  suggestions?: string[];
}

// Reserved words that cannot be used as usernames
const RESERVED_WORDS = [
  'admin', 'administrator', 'moderator', 'mod', 'owner', 'manager',
  'support', 'help', 'api', 'www', 'mail', 'email', 'root', 'system',
  'bookconnect', 'staff', 'team', 'official', 'bot', 'service',
  'null', 'undefined', 'anonymous', 'guest', 'user', 'test',
  'club', 'store', 'platform', 'lead', 'member', 'delete', 'edit',
  'create', 'update', 'remove', 'ban', 'kick', 'mute', 'warn'
];

// Inappropriate content patterns (basic filtering)
const INAPPROPRIATE_PATTERNS = [
  /fuck|shit|damn|hell|ass|bitch/i,
  /sex|porn|xxx|adult/i,
  /hate|nazi|racist/i,
  /spam|scam|fake/i,
  /kill|die|death/i
];

export function validateUsername(username: string): UsernameValidationResult {
  const errors: string[] = [];
  const suggestions: string[] = [];

  // Basic requirements
  if (!username || username.trim() === '') {
    errors.push('Username is required');
    return { isValid: false, errors };
  }

  const trimmedUsername = username.trim();

  // Length validation
  if (trimmedUsername.length < 3) {
    errors.push('Username must be at least 3 characters long');
  }
  if (trimmedUsername.length > 20) {
    errors.push('Username must be no more than 20 characters long');
  }

  // Format validation (alphanumeric + underscore only)
  if (!/^[a-zA-Z0-9_]+$/.test(trimmedUsername)) {
    errors.push('Username can only contain letters, numbers, and underscores');
  }

  // Must start with letter or number (not underscore)
  if (/^_/.test(trimmedUsername)) {
    errors.push('Username cannot start with an underscore');
    suggestions.push(trimmedUsername.substring(1));
  }

  // Cannot end with underscore
  if (/_$/.test(trimmedUsername)) {
    errors.push('Username cannot end with an underscore');
    suggestions.push(trimmedUsername.slice(0, -1));
  }

  // No consecutive underscores
  if (/__/.test(trimmedUsername)) {
    errors.push('Username cannot contain consecutive underscores');
    suggestions.push(trimmedUsername.replace(/__+/g, '_'));
  }

  // Reserved words check
  if (RESERVED_WORDS.includes(trimmedUsername.toLowerCase())) {
    errors.push('This username is reserved and cannot be used');
    suggestions.push(`${trimmedUsername}_user`, `my_${trimmedUsername}`, `${trimmedUsername}123`);
  }

  // Inappropriate content check
  for (const pattern of INAPPROPRIATE_PATTERNS) {
    if (pattern.test(trimmedUsername)) {
      errors.push('Username contains inappropriate content');
      break;
    }
  }

  // No numbers only
  if (/^\d+$/.test(trimmedUsername)) {
    errors.push('Username cannot be only numbers');
    suggestions.push(`user${trimmedUsername}`, `reader${trimmedUsername}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    suggestions: suggestions.length > 0 ? suggestions.slice(0, 3) : undefined
  };
}

// Check username availability against database
export async function checkUsernameAvailability(username: string): Promise<boolean> {
  try {
    const { supabase } = await import('@/lib/supabase');
    
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .single();

    if (error && error.code === 'PGRST116') {
      // No rows returned - username is available
      return true;
    }

    return false; // Username exists or other error
  } catch (error) {
    console.error('Error checking username availability:', error);
    return false; // Assume unavailable on error for safety
  }
}

// Generate username suggestions based on input
export function generateUsernameSuggestions(baseUsername: string): string[] {
  const suggestions: string[] = [];
  const cleanBase = baseUsername.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  
  if (cleanBase.length >= 3) {
    suggestions.push(
      `${cleanBase}${Math.floor(Math.random() * 1000)}`,
      `${cleanBase}_reader`,
      `book_${cleanBase}`,
      `${cleanBase}_${new Date().getFullYear()}`,
      `reader_${cleanBase}`
    );
  } else {
    // If base is too short, generate completely new suggestions
    suggestions.push(
      `reader${Math.floor(Math.random() * 1000)}`,
      `bookworm${Math.floor(Math.random() * 100)}`,
      `bibliophile${Math.floor(Math.random() * 100)}`
    );
  }

  return suggestions.slice(0, 3);
}

// Validate display name (more lenient than username)
export function validateDisplayName(displayName: string): UsernameValidationResult {
  const errors: string[] = [];

  if (!displayName || displayName.trim() === '') {
    // Display name is optional
    return { isValid: true, errors: [] };
  }

  const trimmedDisplayName = displayName.trim();

  // Length validation (max 50 characters)
  if (trimmedDisplayName.length > 50) {
    errors.push('Display name must be no more than 50 characters long');
  }

  // Basic inappropriate content check (less strict than username)
  const severePatterns = [
    /fuck|shit|bitch/i,
    /hate|nazi|racist/i,
    /kill|die|death/i
  ];

  for (const pattern of severePatterns) {
    if (pattern.test(trimmedDisplayName)) {
      errors.push('Display name contains inappropriate content');
      break;
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Format user identity for display (dual-identity system)
export function formatUserIdentity(
  displayName: string | null, 
  username: string, 
  format: 'full' | 'display-primary' | 'username-primary' = 'display-primary'
): string {
  const cleanDisplayName = displayName?.trim();
  const cleanUsername = username?.trim();

  if (!cleanUsername) {
    return cleanDisplayName || 'Unknown User';
  }

  switch (format) {
    case 'full':
      return cleanDisplayName 
        ? `${cleanDisplayName} (@${cleanUsername})`
        : `@${cleanUsername}`;
    
    case 'display-primary':
      return cleanDisplayName || cleanUsername;
    
    case 'username-primary':
      return cleanDisplayName 
        ? `${cleanUsername} (${cleanDisplayName})`
        : cleanUsername;
    
    default:
      return cleanDisplayName || cleanUsername;
  }
}

// Error messages for user-friendly display
export const USERNAME_ERROR_MESSAGES = {
  REQUIRED: 'Username is required to continue',
  TOO_SHORT: 'Username must be at least 3 characters long',
  TOO_LONG: 'Username must be no more than 20 characters long',
  INVALID_FORMAT: 'Username can only contain letters, numbers, and underscores',
  STARTS_WITH_UNDERSCORE: 'Username cannot start with an underscore',
  ENDS_WITH_UNDERSCORE: 'Username cannot end with an underscore',
  CONSECUTIVE_UNDERSCORES: 'Username cannot contain consecutive underscores',
  RESERVED_WORD: 'This username is reserved and cannot be used',
  INAPPROPRIATE_CONTENT: 'Username contains inappropriate content',
  NUMBERS_ONLY: 'Username cannot be only numbers',
  ALREADY_TAKEN: 'This username is already taken',
  NETWORK_ERROR: 'Unable to check username availability. Please try again.',
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.'
} as const;
