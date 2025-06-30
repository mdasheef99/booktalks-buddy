/**
 * Store Request Status Component
 * 
 * Status badges and timeline for store requests
 * Follows BookConnect design system patterns
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Package,
  Calendar,
  Store
} from 'lucide-react';
import { cn } from '@/lib/utils';

type RequestStatus = 'pending' | 'responded' | 'resolved';

interface StoreRequestStatusProps {
  status: RequestStatus;
  requestedAt: string;
  respondedAt?: string;
  storeResponse?: string;
  storeName?: string;
  size?: 'sm' | 'md' | 'lg';
  showTimeline?: boolean;
  className?: string;
}

const StoreRequestStatus: React.FC<StoreRequestStatusProps> = ({
  status,
  requestedAt,
  respondedAt,
  storeResponse,
  storeName,
  size = 'md',
  showTimeline = false,
  className
}) => {
  const getStatusConfig = (status: RequestStatus) => {
    switch (status) {
      case 'pending':
        return {
          label: 'Pending',
          icon: Clock,
          className: 'bg-amber-100 text-amber-800 border-amber-200'
        };
      case 'responded':
        return {
          label: 'Responded',
          icon: CheckCircle,
          className: 'bg-green-100 text-green-800 border-green-200'
        };
      case 'resolved':
        return {
          label: 'Resolved',
          icon: Package,
          className: 'bg-blue-100 text-blue-800 border-blue-200'
        };
      default:
        return {
          label: 'Unknown',
          icon: Clock,
          className: 'bg-gray-100 text-gray-800 border-gray-200'
        };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5'
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  if (showTimeline) {
    return (
      <div className={cn('space-y-3', className)}>
        {/* Status Badge */}
        <Badge
          className={cn(
            'flex items-center gap-1.5 font-medium shadow-sm',
            config.className,
            sizeClasses[size]
          )}
        >
          <Icon className={iconSizes[size]} />
          <span>{config.label}</span>
        </Badge>

        {/* Timeline */}
        <div className="space-y-2 text-sm text-bookconnect-brown/70">
          {/* Request Submitted */}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-bookconnect-brown/50" />
            <span>Requested on {formatDate(requestedAt)}</span>
          </div>

          {/* Store Info */}
          {storeName && (
            <div className="flex items-center gap-2">
              <Store className="h-4 w-4 text-bookconnect-brown/50" />
              <span>From {storeName}</span>
            </div>
          )}

          {/* Response */}
          {respondedAt && (
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-bookconnect-brown/50" />
              <span>
                {config.label} on {formatDate(respondedAt)}
              </span>
            </div>
          )}

          {/* Store Response */}
          {storeResponse && (
            <div className="mt-2 p-2 bg-bookconnect-cream/50 rounded text-xs">
              <p className="font-medium text-bookconnect-brown mb-1">Store Response:</p>
              <p className="text-bookconnect-brown/80">{storeResponse}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Simple badge view
  return (
    <Badge
      className={cn(
        'flex items-center gap-1.5 font-medium shadow-sm',
        config.className,
        sizeClasses[size],
        className
      )}
    >
      <Icon className={iconSizes[size]} />
      <span>{config.label}</span>
    </Badge>
  );
};

export default StoreRequestStatus;
