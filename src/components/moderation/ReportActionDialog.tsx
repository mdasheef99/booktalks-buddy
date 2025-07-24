/**
 * ReportActionDialog Component
 * 
 * Provides a dialog interface for taking moderation actions on reports.
 * Reuses the existing UserAccountManager component to ensure identical
 * ban/suspension functionality between admin users page and moderation dashboard.
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, User, Calendar, MessageSquare } from 'lucide-react';
import { UserAccountManager } from '@/components/admin/UserAccountManager';
import { updateReport } from '@/services/reportingService';
import { getUserAccountStatus, type AccountStatus } from '@/lib/api/admin/accountManagement';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import UserName from '@/components/common/UserName';
import type { Report } from '@/types/reporting';
import {
  mapAccountStatusToResolution,
  getReportStatusAfterAction,
  generateResolutionNotes,
  canTakeActionOnReport
} from '@/lib/utils/moderationUtils';

// =========================
// Types and Interfaces
// =========================

interface ReportActionDialogProps {
  report: Report | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onActionComplete: () => void;
}

// =========================
// Main Component
// =========================

export function ReportActionDialog({
  report,
  open,
  onOpenChange,
  onActionComplete
}: ReportActionDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [userAccountStatus, setUserAccountStatus] = useState<AccountStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load user account status when report changes
  useEffect(() => {
    if (report?.target_user_id && open) {
      loadUserAccountStatus();
    }
  }, [report?.target_user_id, open]);

  const loadUserAccountStatus = async () => {
    if (!report?.target_user_id) return;

    setLoading(true);
    setError(null);

    try {
      const status = await getUserAccountStatus(report.target_user_id);
      setUserAccountStatus(status);
    } catch (error) {
      console.error('Error loading user account status:', error);
      setError('Failed to load user account information');
      toast({
        title: "Error loading user data",
        description: "Unable to load user account status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: AccountStatus) => {
    if (!report || !user) return;

    try {
      // Map the account status change to a resolution action
      const resolutionAction = mapAccountStatusToResolution(newStatus.account_status);
      const reportStatus = getReportStatusAfterAction(resolutionAction);
      
      // Generate resolution notes
      const resolutionNotes = generateResolutionNotes(
        newStatus.account_status === 'suspended' ? 'user_suspension' : 
        newStatus.account_status === 'deleted' ? 'user_ban' : 'no_action',
        `Moderation action taken via report processing`,
        user.user_metadata?.username || user.email || 'Unknown'
      );

      // Update the report with resolution
      await updateReport(report.id, {
        status: reportStatus,
        resolution_action: resolutionAction,
        resolution_notes: resolutionNotes
      }, user.id);

      toast({
        title: "Action completed successfully",
        description: `Report has been ${reportStatus} and user account updated.`,
      });

      // Close dialog and refresh data
      onOpenChange(false);
      onActionComplete();

    } catch (error) {
      console.error('Error updating report:', error);
      toast({
        title: "Error completing action",
        description: "Failed to update report status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setUserAccountStatus(null);
    setError(null);
  };

  // Don't render if no report
  if (!report) return null;

  // Check if actions can be taken on this report
  const canTakeAction = canTakeActionOnReport(report);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Take Action on Report
          </DialogTitle>
          <DialogDescription>
            Review the report details and take appropriate moderation action.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Report Summary Card */}
          <Card>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Report Details</h4>
                  <Badge variant={report.severity === 'critical' ? 'destructive' : 
                                 report.severity === 'high' ? 'destructive' :
                                 report.severity === 'medium' ? 'default' : 'secondary'}>
                    {report.severity} severity
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>Reported by: <UserName userId={report.reporter_id} linkToProfile /></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Reported: {new Date(report.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    <span>Reason: {report.reason.replace('_', ' ')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                    <span>Target: {report.target_type.replace('_', ' ')}</span>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium mb-1">Description:</p>
                  <p className="text-sm text-muted-foreground bg-muted p-2 rounded">
                    {report.description}
                  </p>
                </div>

                {report.target_username && (
                  <div>
                    <p className="text-sm font-medium">
                      Reported User: <UserName userId={report.target_user_id} linkToProfile />
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Action Section */}
          {!canTakeAction ? (
            <Card>
              <CardContent className="p-4">
                <div className="text-center text-muted-foreground">
                  <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                  <p>No actions can be taken on this report.</p>
                  <p className="text-sm">
                    {report.status !== 'pending' && report.status !== 'under_review' 
                      ? 'Report has already been processed.'
                      : 'Report does not have a valid target user.'}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : loading ? (
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-muted-foreground">Loading user account information...</p>
                </div>
              </CardContent>
            </Card>
          ) : error ? (
            <Card>
              <CardContent className="p-4">
                <div className="text-center text-red-600">
                  <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                  <p>{error}</p>
                </div>
              </CardContent>
            </Card>
          ) : userAccountStatus ? (
            <div>
              <h4 className="font-medium mb-3">User Account Actions</h4>
              <Card>
                <CardContent className="p-4">
                  <UserAccountManager
                    userId={report.target_user_id!}
                    currentStatus={userAccountStatus}
                    username={report.target_username || undefined}
                    onStatusChange={handleStatusChange}
                  />
                </CardContent>
              </Card>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ReportActionDialog;
