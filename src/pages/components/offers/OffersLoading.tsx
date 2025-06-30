import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Loading state component for the Offers page
 * Shows skeleton placeholders while offers are being fetched
 */
export const OffersLoading: React.FC = () => {
  return (
    <div className="grid gap-6 md:gap-8">
      {/* Skeleton for multiple offer cards */}
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="max-w-4xl mx-auto w-full">
          <Skeleton className="h-64 w-full rounded-lg bg-bookconnect-brown/10" />
        </div>
      ))}
    </div>
  );
};
