/**
 * Modal component for club leads to review join request answers
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Star, 
  User, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Loader2,
  MessageSquare,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import type { JoinRequestReviewModalProps } from '@/types/join-request-questions';

export default function JoinRequestReviewModal({
  isOpen,
  onClose,
  joinRequest,
  onApprove,
  onReject,
  isLoading = false
}: JoinRequestReviewModalProps) {
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const isMobile = useIsMobile();

  // Early return if joinRequest is null/undefined or missing answers
  if (!joinRequest || !joinRequest.answers || !Array.isArray(joinRequest.answers)) {
    return null;
  }

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      await onApprove();
      toast.success(`${joinRequest.display_name} has been approved to join the club`);
      onClose();
    } catch (error) {
      console.error('Error approving join request:', error);
      toast.error('Failed to approve join request');
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!confirm(`Are you sure you want to reject ${joinRequest.display_name}'s join request?`)) {
      return;
    }

    setIsRejecting(true);
    try {
      await onReject();
      toast.success(`${joinRequest.display_name}'s join request has been rejected`);
      onClose();
    } catch (error) {
      console.error('Error rejecting join request:', error);
      toast.error('Failed to reject join request');
    } finally {
      setIsRejecting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const requiredAnswers = joinRequest.answers.filter(a => a.is_required);
  const optionalAnswers = joinRequest.answers.filter(a => !a.is_required);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`${isMobile ? 'max-w-[95vw]' : 'max-w-3xl'} max-h-[90vh] overflow-y-auto`}>
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-bookconnect-brown">
            Review Join Request
          </DialogTitle>
          <DialogDescription>
            Review the user's information and answers before approving or rejecting their request.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* User Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <User className="h-5 w-5 mr-2" />
                User Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={`/api/avatar/${joinRequest.user_id}`} />
                  <AvatarFallback className="bg-bookconnect-cream text-bookconnect-brown text-lg">
                    {joinRequest.display_name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold">{joinRequest.display_name}</h3>
                  <p className="text-gray-600">@{joinRequest.username}</p>
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="h-4 w-4 mr-1" />
                    Requested on {formatDate(joinRequest.requested_at)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Answers Section */}
          {joinRequest.answers.length > 0 ? (
            <div className="space-y-4">
              {/* Required Answers */}
              {requiredAnswers.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <Star className="h-5 w-5 mr-2 text-amber-500" />
                      Required Questions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {requiredAnswers.map((answer, index) => (
                      <AnswerCard
                        key={answer.question_id}
                        answer={answer}
                        index={index + 1}
                      />
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Optional Answers */}
              {optionalAnswers.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <MessageSquare className="h-5 w-5 mr-2" />
                      Optional Questions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {optionalAnswers.map((answer, index) => (
                      <AnswerCard
                        key={answer.question_id}
                        answer={answer}
                        index={requiredAnswers.length + index + 1}
                      />
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-gray-500">
                <AlertCircle className="mx-auto h-12 w-12 mb-4 text-gray-400" />
                <p>No questions were answered for this join request.</p>
                <p className="text-sm">The club may not have had questions enabled when this request was submitted.</p>
              </CardContent>
            </Card>
          )}

          {/* Summary */}
          <Card className="bg-bookconnect-cream/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-bookconnect-brown">Request Summary</h4>
                  <p className="text-sm text-gray-600">
                    {joinRequest.answers.length > 0 
                      ? `Answered ${joinRequest.answers.length} question${joinRequest.answers.length !== 1 ? 's' : ''}`
                      : 'No questions answered'
                    }
                    {requiredAnswers.length > 0 && ` (${requiredAnswers.length} required)`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Requested</p>
                  <p className="text-sm font-medium">{formatDate(joinRequest.requested_at)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action buttons */}
        <div className={`${isMobile ? 'flex flex-col space-y-3' : 'flex justify-end space-x-3'} pt-4 border-t`}>
          <Button
            onClick={onClose}
            variant="outline"
            disabled={isApproving || isRejecting || isLoading}
            className={isMobile ? 'h-12' : ''}
          >
            Close
          </Button>
          <Button
            onClick={handleReject}
            variant="destructive"
            disabled={isApproving || isRejecting || isLoading}
            className={isMobile ? 'h-12' : ''}
          >
            {isRejecting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Rejecting...
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4 mr-2" />
                Reject Request
              </>
            )}
          </Button>
          <Button
            onClick={handleApprove}
            disabled={isApproving || isRejecting || isLoading}
            className={`bg-green-600 hover:bg-green-700 ${isMobile ? 'h-12' : ''}`}
          >
            {isApproving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Approving...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve Request
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Answer Card Component
interface AnswerCardProps {
  answer: {
    question_id: string;
    question_text: string;
    answer_text: string;
    is_required: boolean;
    display_order: number;
  };
  index: number;
}

function AnswerCard({ answer, index }: AnswerCardProps) {
  return (
    <div className="space-y-2 p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-500">
            Question {index}
          </span>
          {answer.is_required && (
            <Badge variant="secondary" className="text-xs">
              <Star className="h-3 w-3 mr-1 text-amber-500" />
              Required
            </Badge>
          )}
        </div>
        <div className="text-xs text-gray-500">
          {answer.answer_text.length} characters
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-900">
          {answer.question_text}
        </p>
        <div className="bg-white p-3 rounded border">
          <p className="text-sm text-gray-700 whitespace-pre-wrap">
            {answer.answer_text}
          </p>
        </div>
      </div>
    </div>
  );
}
