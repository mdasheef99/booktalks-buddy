/**
 * Validation utilities for BookTalks Buddy
 */

/**
 * Validates if a string is a valid UUID v4
 */
export function isValidUUID(uuid: string): boolean {
  if (!uuid || typeof uuid !== 'string') {
    return false;
  }

  // Check for common invalid values
  if (uuid === 'undefined' || uuid === 'null' || uuid === '') {
    return false;
  }

  // UUID v4 regex pattern
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Validates club ID and returns validation result
 */
export function validateClubId(clubId: string): {
  isValid: boolean;
  error?: string;
} {
  if (!clubId || clubId === 'undefined' || clubId === 'null') {
    return {
      isValid: false,
      error: 'Invalid club ID provided'
    };
  }

  if (!isValidUUID(clubId)) {
    return {
      isValid: false,
      error: 'Invalid club ID format'
    };
  }

  return { isValid: true };
}

/**
 * Validates user ID and returns validation result
 */
export function validateUserId(userId: string): {
  isValid: boolean;
  error?: string;
} {
  if (!userId || userId === 'undefined' || userId === 'null') {
    return {
      isValid: false,
      error: 'Invalid user ID provided'
    };
  }

  if (!isValidUUID(userId)) {
    return {
      isValid: false,
      error: 'Invalid user ID format'
    };
  }

  return { isValid: true };
}

/**
 * Validates question text
 */
export function validateQuestionText(text: string): {
  isValid: boolean;
  error?: string;
} {
  if (!text || typeof text !== 'string') {
    return {
      isValid: false,
      error: 'Question text is required'
    };
  }

  const trimmedText = text.trim();
  
  if (trimmedText.length === 0) {
    return {
      isValid: false,
      error: 'Question text cannot be empty'
    };
  }

  if (trimmedText.length > 200) {
    return {
      isValid: false,
      error: 'Question text must be 200 characters or less'
    };
  }

  return { isValid: true };
}

/**
 * Validates club name
 */
export function validateClubName(name: string): {
  isValid: boolean;
  error?: string;
} {
  if (!name || typeof name !== 'string') {
    return {
      isValid: false,
      error: 'Club name is required'
    };
  }

  const trimmedName = name.trim();
  
  if (trimmedName.length < 3) {
    return {
      isValid: false,
      error: 'Club name must be at least 3 characters'
    };
  }

  if (trimmedName.length > 50) {
    return {
      isValid: false,
      error: 'Club name must be less than 50 characters'
    };
  }

  if (!/^[a-zA-Z0-9\s\-_]+$/.test(trimmedName)) {
    return {
      isValid: false,
      error: 'Club name can only contain letters, numbers, spaces, hyphens, and underscores'
    };
  }

  return { isValid: true };
}
