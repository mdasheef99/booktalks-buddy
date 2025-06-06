/**
 * Individual join request table row component
 * Displays request information and actions
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TableCell, TableRow } from '@/components/ui/table';
import { Check, X, Eye, MessageSquare } from 'lucide-react';
import type { JoinRequestTableRowProps, EnhancedJoinRequest, JoinRequest } from './types';

export default function JoinRequestTableRow({
  request,
  type,
  processingAction,
  onView,
  onApprove,
  onReject
}: JoinRequestTableRowProps) {
  
  // Handle both enhanced and legacy request types
  const getDisplayName = () => {
    if (type === 'enhanced') {
      const enhancedRequest = request as EnhancedJoinRequest;
      return enhancedRequest.display_name || enhancedRequest.username || 'Unknown User';
    } else {
      const legacyRequest = request as JoinRequest;
      return legacyRequest.user?.display_name || legacyRequest.user?.username || 'Unknown User';
    }
  };

  const getRequestedDate = () => {
    return new Date(request.requested_at).toLocaleDateString();
  };

  const renderAnswersCell = () => {
    if (type === 'enhanced') {
      const enhancedRequest = request as EnhancedJoinRequest;
      if (enhancedRequest.has_answers) {
        return (
          <Badge variant="secondary" className="text-xs">
            <MessageSquare className="h-3 w-3 mr-1" />
            {enhancedRequest.answers.length} answer{enhancedRequest.answers.length !== 1 ? 's' : ''}
          </Badge>
        );
      }
    }
    return <span className="text-gray-400 text-sm">No answers</span>;
  };

  const renderActions = () => {
    if (type === 'enhanced') {
      const enhancedRequest = request as EnhancedJoinRequest;
      return (
        <div className="flex justify-end gap-2">
          {enhancedRequest.has_answers && onView && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onView(enhancedRequest)}
              disabled={processingAction}
              title="Review answers"
            >
              <Eye className="h-4 w-4 mr-1" />
              Review
            </Button>
          )}
          <Button
            variant="default"
            size="sm"
            onClick={() => enhancedRequest.has_answers && onView ? onView(enhancedRequest) : onApprove(request.user_id)}
            disabled={processingAction}
            title={enhancedRequest.has_answers ? 'Review and approve' : 'Approve request'}
          >
            <Check className="h-4 w-4 mr-1" />
            {enhancedRequest.has_answers ? 'Review & Approve' : 'Approve'}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onReject(request.user_id)}
            disabled={processingAction}
            title="Reject request"
          >
            <X className="h-4 w-4 mr-1" />
            Reject
          </Button>
        </div>
      );
    } else {
      // Legacy request actions
      return (
        <div className="flex justify-end gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={() => onApprove(request.user_id)}
            disabled={processingAction}
            title="Approve request"
          >
            <Check className="h-4 w-4 mr-1" />
            Approve
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onReject(request.user_id)}
            disabled={processingAction}
            title="Reject request"
          >
            <X className="h-4 w-4 mr-1" />
            Reject
          </Button>
        </div>
      );
    }
  };

  return (
    <TableRow key={request.user_id}>
      <TableCell className="font-medium">
        {getDisplayName()}
      </TableCell>
      <TableCell>
        {getRequestedDate()}
      </TableCell>
      <TableCell>
        {renderAnswersCell()}
      </TableCell>
      <TableCell className="text-right">
        {renderActions()}
      </TableCell>
    </TableRow>
  );
}
