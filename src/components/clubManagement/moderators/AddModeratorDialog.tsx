/**
 * Add Moderator Dialog Component
 *
 * Modal dialog for selecting and appointing club moderators.
 */

import React, { useState, useEffect } from 'react';
import { UserPlus, X, AlertCircle, CheckCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useClubMembers, useModeratorAppointment } from '@/hooks/useClubManagement';
import { ClubMember } from '@/lib/services/clubManagementService';
import MemberSelectionGrid from './MemberSelectionGrid';

// =====================================================
// Types
// =====================================================

interface AddModeratorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clubId: string;
  onSuccess?: () => void;
}

// =====================================================
// Add Moderator Dialog Component
// =====================================================

const AddModeratorDialog: React.FC<AddModeratorDialogProps> = ({
  open,
  onOpenChange,
  clubId,
  onSuccess
}) => {
  const [selectedMember, setSelectedMember] = useState<ClubMember | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // Hooks
  const {
    eligibleMembers,
    loading: membersLoading,
    error: membersError,
    refresh: refreshMembers
  } = useClubMembers(clubId);

  const {
    appointing,
    error: appointmentError,
    appointModerator,
    clearError
  } = useModeratorAppointment();

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open) {
      setSelectedMember(null);
      setShowSuccess(false);
      clearError();
    }
  }, [open, clearError]);

  // Handle member selection
  const handleMemberSelect = (member: ClubMember) => {
    setSelectedMember(member);
    clearError();
  };

  // Handle moderator appointment
  const handleAppointModerator = async () => {
    if (!selectedMember) return;

    const result = await appointModerator(selectedMember.id, clubId);

    if (result) {
      setShowSuccess(true);

      // Refresh member list to update eligible members
      await refreshMembers();

      // Call success callback
      onSuccess?.();

      // Close dialog after short delay to show success message
      setTimeout(() => {
        onOpenChange(false);
      }, 1500);
    }
  };

  // Handle dialog close
  const handleClose = () => {
    if (!appointing) {
      onOpenChange(false);
    }
  };

  // Success state
  if (showSuccess) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Moderator Appointed
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-6">
            <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserPlus className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-gray-900 font-medium">
              {selectedMember?.display_name || selectedMember?.username} has been appointed as a moderator!
            </p>
            <p className="text-sm text-gray-600 mt-2">
              They can now help manage your club with the default permissions.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Add Moderator
          </DialogTitle>
          <DialogDescription>
            Select a club member to appoint as a moderator. They will receive default permissions that you can customize later.
          </DialogDescription>
        </DialogHeader>

        {/* Error Alert */}
        {(membersError || appointmentError) && (
          <Alert className="flex-shrink-0">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {membersError || appointmentError}
            </AlertDescription>
          </Alert>
        )}

        {/* Member Selection - This should be scrollable */}
        <div className="flex-1 min-h-0 py-4">
          <MemberSelectionGrid
            members={eligibleMembers}
            selectedMember={selectedMember}
            onMemberSelect={handleMemberSelect}
            loading={membersLoading}
            error={membersError}
          />
        </div>



        <DialogFooter className="gap-2 flex-shrink-0">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={appointing}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAppointModerator}
            disabled={!selectedMember || appointing}
            className="flex items-center gap-2"
          >
            {appointing ? (
              <>
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Appointing...
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4" />
                Appoint Moderator
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddModeratorDialog;
