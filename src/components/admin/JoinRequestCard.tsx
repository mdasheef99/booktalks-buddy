import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, X, Calendar, Loader2 } from 'lucide-react';
import UserAvatar from '@/components/common/UserAvatar';
import UserName from '@/components/common/UserName';
import { format } from 'date-fns';

interface JoinRequest {
  user_id: string;
  club_id: string;
  role: string;
  joined_at: string;
  club_name?: string;
  username?: string;
}

interface JoinRequestCardProps {
  request: JoinRequest;
  isProcessing: boolean;
  onApprove: () => void;
  onDeny: () => void;
}

const JoinRequestCard: React.FC<JoinRequestCardProps> = ({
  request,
  isProcessing,
  onApprove,
  onDeny
}) => {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <UserAvatar userId={request.user_id} size="sm" />
              <h3 className="text-lg font-semibold">
                <UserName userId={request.user_id} linkToProfile /> wants to join {request.club_name || 'a club'}
              </h3>
            </div>
            <div className="flex flex-wrap gap-2 mt-1 text-sm text-gray-500">
              <span className="flex items-center">
                <Calendar className="h-3 w-3 mr-1" />
                Requested {format(new Date(request.joined_at), 'MMM d, yyyy')}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onDeny}
              disabled={isProcessing}
              className="border-red-200 text-red-600 hover:bg-red-50"
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <X className="h-4 w-4 mr-1" />
              )}
              {isProcessing ? 'Processing...' : 'Deny'}
            </Button>
            <Button
              size="sm"
              onClick={onApprove}
              disabled={isProcessing}
              className="bg-green-600 hover:bg-green-700"
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Check className="h-4 w-4 mr-1" />
              )}
              {isProcessing ? 'Processing...' : 'Approve'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default JoinRequestCard;
