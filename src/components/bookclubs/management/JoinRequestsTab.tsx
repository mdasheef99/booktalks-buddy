/**
 * Join requests tab component
 * Displays and manages club join requests
 */

import React from 'react';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import JoinRequestTableRow from './JoinRequestTableRow';
import type { JoinRequestsTabProps } from './types';

export default function JoinRequestsTab({
  legacyRequests,
  enhancedRequests,
  loading,
  processingAction,
  onViewRequest,
  onApproveRequest,
  onRejectRequest
}: JoinRequestsTabProps) {
  
  const hasRequests = enhancedRequests.length > 0 || legacyRequests.length > 0;

  if (loading) {
    return (
      <div className="text-center p-8 border rounded-md">
        <p className="text-gray-500">Loading join requests...</p>
      </div>
    );
  }

  if (!hasRequests) {
    return (
      <div className="text-center p-8 border rounded-md">
        <p className="text-gray-500">No pending join requests</p>
      </div>
    );
  }

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Requested</TableHead>
            <TableHead>Answers</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {/* Enhanced join requests with answers support */}
          {enhancedRequests.map((request) => (
            <JoinRequestTableRow
              key={request.user_id}
              request={request}
              type="enhanced"
              processingAction={processingAction}
              onView={onViewRequest}
              onApprove={onApproveRequest}
              onReject={onRejectRequest}
            />
          ))}
          
          {/* Legacy join requests (fallback) */}
          {enhancedRequests.length === 0 && legacyRequests.map((request) => (
            <JoinRequestTableRow
              key={request.user_id}
              request={request}
              type="legacy"
              processingAction={processingAction}
              onApprove={onApproveRequest}
              onReject={onRejectRequest}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
