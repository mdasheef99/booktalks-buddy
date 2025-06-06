/**
 * New Conversation Skeleton Component
 * 
 * Loading skeleton for the new conversation page
 */

import React from 'react';
import type { NewConversationSkeletonProps } from '../types';

/**
 * New Conversation Skeleton Component
 */
export const NewConversationSkeleton: React.FC<NewConversationSkeletonProps> = ({
  className = ''
}) => {
  return (
    <div className={`max-w-md mx-auto h-screen flex flex-col bg-white ${className}`}>
      {/* Header skeleton */}
      <HeaderSkeleton />

      {/* Content skeleton */}
      <ContentSkeleton />

      {/* Footer skeleton */}
      <FooterSkeleton />
    </div>
  );
};

/**
 * Header Skeleton Component
 */
const HeaderSkeleton: React.FC = () => {
  return (
    <div className="p-4 border-b bg-bookconnect-sage animate-pulse">
      <div className="flex items-center">
        <div className="w-8 h-8 bg-white/20 rounded mr-3"></div>
        <div className="h-6 bg-white/20 rounded w-32"></div>
      </div>
    </div>
  );
};

/**
 * Content Skeleton Component
 */
const ContentSkeleton: React.FC = () => {
  return (
    <div className="flex-1 p-4 space-y-6">
      {/* Username input skeleton */}
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
        <div className="flex gap-2">
          <div className="flex-1 h-10 bg-gray-200 rounded"></div>
          <div className="w-20 h-10 bg-gray-200 rounded"></div>
        </div>
      </div>

      {/* Instructions skeleton */}
      <div className="h-24 bg-gray-100 rounded-lg animate-pulse"></div>
      
      {/* Alternative actions skeleton */}
      <div className="h-16 bg-gray-100 rounded-lg animate-pulse"></div>
    </div>
  );
};

/**
 * Footer Skeleton Component
 */
const FooterSkeleton: React.FC = () => {
  return (
    <div className="p-4 bg-gray-50 border-t animate-pulse">
      <div className="h-3 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
      <div className="h-3 bg-gray-200 rounded w-1/2 mx-auto"></div>
    </div>
  );
};
