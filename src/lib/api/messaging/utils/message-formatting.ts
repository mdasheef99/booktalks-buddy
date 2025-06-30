/**
 * Message Formatting Module
 * 
 * Handles message content formatting, sanitization, and error formatting
 */

/**
 * Format error for consistent error handling
 */
export function formatMessagingError(
  code: string,
  message: string,
  details?: Record<string, any>
): Error {
  const error = new Error(message);
  (error as any).code = code;
  (error as any).details = details;
  return error;
}

/**
 * Sanitize content for safe display
 * Basic sanitization - can be extended with a proper sanitization library
 */
export function sanitizeContent(content: string): string {
  return content
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim();
}

/**
 * Format message content for display
 * Applies basic formatting and sanitization
 */
export function formatMessageContent(content: string): string {
  if (!content || typeof content !== 'string') {
    return '';
  }

  // Sanitize the content first
  const sanitized = sanitizeContent(content);
  
  // Apply basic formatting (can be extended)
  return sanitized
    .replace(/\n/g, '<br>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>');
}

/**
 * Truncate message content for previews
 */
export function truncateMessage(content: string, maxLength: number = 100): string {
  if (!content || typeof content !== 'string') {
    return '';
  }

  const trimmed = content.trim();
  if (trimmed.length <= maxLength) {
    return trimmed;
  }

  return trimmed.substring(0, maxLength).trim() + '...';
}

/**
 * Extract mentions from message content
 * Returns array of usernames mentioned in the message
 */
export function extractMentions(content: string): string[] {
  if (!content || typeof content !== 'string') {
    return [];
  }

  const mentionRegex = /@(\w+)/g;
  const mentions: string[] = [];
  let match;

  while ((match = mentionRegex.exec(content)) !== null) {
    mentions.push(match[1]);
  }

  return [...new Set(mentions)]; // Remove duplicates
}

/**
 * Highlight mentions in message content
 */
export function highlightMentions(content: string): string {
  if (!content || typeof content !== 'string') {
    return '';
  }

  return content.replace(
    /@(\w+)/g,
    '<span class="mention">@$1</span>'
  );
}

/**
 * Format timestamp for message display
 */
export function formatMessageTimestamp(timestamp: string | Date): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  
  if (isNaN(date.getTime())) {
    return 'Invalid date';
  }

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) {
    return 'Just now';
  } else if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    return date.toLocaleDateString();
  }
}

/**
 * Format message for search results
 */
export function formatSearchResult(content: string, searchTerm: string): string {
  if (!content || !searchTerm) {
    return sanitizeContent(content || '');
  }

  const sanitized = sanitizeContent(content);
  const regex = new RegExp(`(${searchTerm})`, 'gi');
  
  return sanitized.replace(regex, '<mark>$1</mark>');
}
