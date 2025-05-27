/**
 * Direct Messaging System - Messaging Header Component
 *
 * Shared header component for messaging pages with consistent styling,
 * navigation, and action buttons across the messaging interface.
 */

import React from 'react';
import { Button } from '@/components/ui/button';

interface MessagingHeaderProps {
  title: string;
  backButton?: React.ReactNode;
  action?: React.ReactNode;
  subtitle?: string;
  className?: string;
}

/**
 * Shared header component for messaging pages
 * Provides consistent styling and layout across all messaging screens
 */
export function MessagingHeader({
  title,
  backButton,
  action,
  subtitle,
  className = ''
}: MessagingHeaderProps) {
  return (
    <header className={`
      px-6 py-5 border-b bg-gradient-to-r from-bookconnect-sage to-bookconnect-sage/95 text-white shadow-lg backdrop-blur-sm
      ${className}
    `}>
      <div className="flex items-center justify-between">
        {/* Left side: Back button + Title */}
        <div className="flex items-center flex-1 min-w-0">
          {backButton}
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold truncate tracking-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm text-white/90 truncate mt-1 font-medium">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Right side: Action button */}
        {action && (
          <div className="flex-shrink-0 ml-4">
            {action}
          </div>
        )}
      </div>
    </header>
  );
}

/**
 * Simple messaging header with just title
 */
export function SimpleMessagingHeader({
  title,
  className = ''
}: {
  title: string;
  className?: string;
}) {
  return (
    <MessagingHeader
      title={title}
      className={className}
    />
  );
}

/**
 * Messaging header with back navigation
 */
export function MessagingHeaderWithBack({
  title,
  onBack,
  action,
  subtitle,
  className = ''
}: {
  title: string;
  onBack: () => void;
  action?: React.ReactNode;
  subtitle?: string;
  className?: string;
}) {
  return (
    <MessagingHeader
      title={title}
      subtitle={subtitle}
      backButton={
        <Button
          onClick={onBack}
          variant="ghost"
          size="sm"
          className="mr-4 text-white hover:bg-white/20 active:bg-white/30 p-2.5 rounded-full transition-all duration-200 hover:scale-105"
          aria-label="Go back to messages"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </Button>
      }
      action={action}
      className={className}
    />
  );
}

/**
 * Messaging header with action button
 */
export function MessagingHeaderWithAction({
  title,
  actionLabel,
  onAction,
  actionDisabled = false,
  actionVariant = "secondary",
  className = ''
}: {
  title: string;
  actionLabel: string;
  onAction: () => void;
  actionDisabled?: boolean;
  actionVariant?: "default" | "secondary" | "outline" | "ghost";
  className?: string;
}) {
  return (
    <MessagingHeader
      title={title}
      action={
        <Button
          onClick={onAction}
          size="sm"
          variant={actionVariant}
          disabled={actionDisabled}
          className="bg-white/10 hover:bg-white/20 text-white border-white/20"
        >
          {actionLabel}
        </Button>
      }
      className={className}
    />
  );
}

/**
 * Conversation header with participant info
 */
export function ConversationHeader({
  participantName,
  participantUsername,
  onBack,
  isOnline = false,
  lastSeen,
  action,
  className = ''
}: {
  participantName: string;
  participantUsername?: string;
  onBack: () => void;
  isOnline?: boolean;
  lastSeen?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  const subtitle = isOnline
    ? 'Online'
    : lastSeen
    ? `Last seen ${lastSeen}`
    : participantUsername
    ? `@${participantUsername}`
    : undefined;

  return (
    <MessagingHeaderWithBack
      title={participantName}
      subtitle={subtitle}
      onBack={onBack}
      action={action}
      className={className}
    />
  );
}

/**
 * Loading header skeleton
 */
export function MessagingHeaderSkeleton({
  showBackButton = false,
  showAction = false,
  className = ''
}: {
  showBackButton?: boolean;
  showAction?: boolean;
  className?: string;
}) {
  return (
    <header className={`
      p-4 border-b bg-bookconnect-sage text-white animate-pulse
      ${className}
    `}>
      <div className="flex items-center justify-between">
        <div className="flex items-center flex-1">
          {showBackButton && (
            <div className="mr-3 w-8 h-8 bg-white/20 rounded"></div>
          )}
          <div className="flex-1">
            <div className="h-6 bg-white/20 rounded w-32 mb-1"></div>
            <div className="h-4 bg-white/20 rounded w-24"></div>
          </div>
        </div>
        {showAction && (
          <div className="w-16 h-8 bg-white/20 rounded ml-3"></div>
        )}
      </div>
    </header>
  );
}

/**
 * Error header component
 */
export function MessagingHeaderError({
  title = "Error",
  onRetry,
  className = ''
}: {
  title?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <header className={`
      p-4 border-b bg-red-500 text-white
      ${className}
    `}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          <h1 className="text-xl font-bold">{title}</h1>
        </div>
        {onRetry && (
          <Button
            onClick={onRetry}
            size="sm"
            variant="outline"
            className="border-white text-white hover:bg-white hover:text-red-500"
          >
            Retry
          </Button>
        )}
      </div>
    </header>
  );
}
