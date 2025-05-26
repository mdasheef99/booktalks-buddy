/**
 * DateSeparator component for messaging system
 * Displays date separators between messages from different days
 */

import React from 'react';

interface DateSeparatorProps {
  date: string; // ISO date string
  className?: string;
}

/**
 * Format date for display in message thread
 */
function formatMessageDate(dateString: string): string {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Reset time to compare dates only
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const yesterdayOnly = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());

  if (dateOnly.getTime() === todayOnly.getTime()) {
    return 'Today';
  } else if (dateOnly.getTime() === yesterdayOnly.getTime()) {
    return 'Yesterday';
  } else {
    // Format as "January 15, 2024"
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}

/**
 * DateSeparator component
 */
export function DateSeparator({ date, className = '' }: DateSeparatorProps) {
  const formattedDate = formatMessageDate(date);

  return (
    <div className={`flex items-center justify-center my-4 ${className}`}>
      <div className="flex items-center w-full max-w-xs">
        {/* Left line */}
        <div className="flex-1 h-px bg-gray-300"></div>
        
        {/* Date text */}
        <div className="px-3 py-1 bg-gray-100 rounded-full">
          <span className="text-xs font-medium text-gray-600">
            {formattedDate}
          </span>
        </div>
        
        {/* Right line */}
        <div className="flex-1 h-px bg-gray-300"></div>
      </div>
    </div>
  );
}

/**
 * Utility function to check if two dates are on different days
 */
export function isDifferentDay(date1: string, date2: string): boolean {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  
  return (
    d1.getFullYear() !== d2.getFullYear() ||
    d1.getMonth() !== d2.getMonth() ||
    d1.getDate() !== d2.getDate()
  );
}

/**
 * Utility function to group messages by date
 */
export function groupMessagesByDate<T extends { sent_at: string }>(messages: T[]): Array<{ type: 'date'; date: string } | { type: 'message'; message: T }> {
  const grouped: Array<{ type: 'date'; date: string } | { type: 'message'; message: T }> = [];
  let lastDate: string | null = null;

  messages.forEach((message) => {
    const messageDate = message.sent_at;
    
    // Add date separator if this is a new day
    if (!lastDate || isDifferentDay(lastDate, messageDate)) {
      grouped.push({ type: 'date', date: messageDate });
      lastDate = messageDate;
    }
    
    // Add the message
    grouped.push({ type: 'message', message });
  });

  return grouped;
}

export default DateSeparator;
