import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Flag, Shield, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createReport } from '@/services/reportingService';
import { useAuth } from '@/contexts/AuthContext';
import type { ReportReason, ReportTargetType, CreateReportData } from '@/types/reporting';

interface ReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetType: ReportTargetType;
  targetId?: string;
  targetUserId?: string;
  targetTitle?: string;
  targetContent?: string;
  clubId?: string;
  onReportSubmitted?: () => void;
}

const REASON_OPTIONS: { value: ReportReason; label: string; icon: React.ReactNode; description: string }[] = [
  {
    value: 'spam',
    label: 'Spam',
    icon: <Flag className="h-4 w-4" />,
    description: 'Repetitive, unwanted, or promotional content'
  },
  {
    value: 'harassment',
    label: 'Harassment',
    icon: <Shield className="h-4 w-4" />,
    description: 'Bullying, threats, or targeted abuse'
  },
  {
    value: 'inappropriate_content',
    label: 'Inappropriate Content',
    icon: <AlertTriangle className="h-4 w-4" />,
    description: 'Content that violates community guidelines'
  },
  {
    value: 'hate_speech',
    label: 'Hate Speech',
    icon: <AlertTriangle className="h-4 w-4" />,
    description: 'Content promoting hatred or discrimination'
  },
  {
    value: 'misinformation',
    label: 'Misinformation',
    icon: <AlertTriangle className="h-4 w-4" />,
    description: 'False or misleading information'
  },
  {
    value: 'copyright_violation',
    label: 'Copyright Violation',
    icon: <Shield className="h-4 w-4" />,
    description: 'Unauthorized use of copyrighted material'
  },
  {
    value: 'off_topic',
    label: 'Off Topic',
    icon: <Flag className="h-4 w-4" />,
    description: 'Content not relevant to the discussion'
  },
  {
    value: 'other',
    label: 'Other',
    icon: <Flag className="h-4 w-4" />,
    description: 'Other violation not listed above'
  }
];

const TARGET_TYPE_LABELS: Record<ReportTargetType, string> = {
  'discussion_post': 'Discussion Post',
  'discussion_topic': 'Discussion Topic',
  'user_profile': 'User Profile',
  'book_club': 'Book Club',
  'event': 'Event',
  'chat_message': 'Chat Message',
  'user_behavior': 'User Behavior'
};

export const ReportDialog: React.FC<ReportDialogProps> = ({
  open,
  onOpenChange,
  targetType,
  targetId,
  targetUserId,
  targetTitle,
  targetContent,
  clubId,
  onReportSubmitted
}) => {
  const [reason, setReason] = useState<ReportReason | ''>('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to submit a report.",
        variant: "destructive",
      });
      return;
    }

    if (!reason) {
      toast({
        title: "Reason required",
        description: "Please select a reason for your report.",
        variant: "destructive",
      });
      return;
    }

    if (!description.trim()) {
      toast({
        title: "Description required",
        description: "Please provide a description of the issue.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const reportData: CreateReportData = {
        target_type: targetType,
        target_id: targetId,
        target_user_id: targetUserId,
        reason: reason as ReportReason,
        description: description.trim(),
        club_id: clubId
      };

      const report = await createReport(user.id, reportData, {
        target_title: targetTitle,
        target_content: targetContent
      });

      if (report) {
        toast({
          title: "Report submitted",
          description: "Thank you for helping keep our community safe. We'll review your report soon.",
        });

        // Reset form
        setReason('');
        setDescription('');
        onOpenChange(false);
        onReportSubmitted?.();
      } else {
        throw new Error('Failed to create report');
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      toast({
        title: "Submission failed",
        description: "Unable to submit your report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedReasonOption = REASON_OPTIONS.find(option => option.value === reason);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-red-500" />
            Report {TARGET_TYPE_LABELS[targetType]}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Target Information */}
          {targetTitle && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Reporting:</p>
              <p className="font-medium text-gray-900 truncate">{targetTitle}</p>
              {targetContent && (
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">{targetContent}</p>
              )}
            </div>
          )}

          {/* Reason Selection */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Report *</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select a reason..." />
              </SelectTrigger>
              <SelectContent>
                {REASON_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      {option.icon}
                      <span>{option.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedReasonOption && (
              <p className="text-sm text-gray-600">{selectedReasonOption.description}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please provide specific details about the issue..."
              rows={4}
              maxLength={1000}
            />
            <div className="flex justify-between items-center">
              <p className="text-xs text-gray-500">
                Be specific and factual. Avoid personal attacks.
              </p>
              <p className="text-xs text-gray-400">
                {description.length}/1000
              </p>
            </div>
          </div>

          {/* Severity Notice */}
          {reason === 'hate_speech' || reason === 'harassment' && (
            <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-medium">High Priority Report</span>
              </div>
              <p className="text-sm text-red-600 mt-1">
                This type of report will be reviewed immediately by our moderation team.
              </p>
            </div>
          )}

          {/* Privacy Notice */}
          <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
            <div className="flex items-center gap-2 text-blue-700">
              <User className="h-4 w-4" />
              <span className="font-medium">Privacy Notice</span>
            </div>
            <p className="text-sm text-blue-600 mt-1">
              Your report is confidential. The reported user will not see who submitted the report.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!reason || !description.trim() || isSubmitting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
