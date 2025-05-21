import React from 'react';
import { Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface RemoveModeratorDialogProps {
  moderatorId: string | null;
  processingAction: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (moderatorId: string) => Promise<void>;
}

/**
 * Confirmation dialog for removing a moderator
 */
const RemoveModeratorDialog: React.FC<RemoveModeratorDialogProps> = ({
  moderatorId,
  processingAction,
  onOpenChange,
  onConfirm,
}) => {
  return (
    <AlertDialog open={!!moderatorId} onOpenChange={(open) => !open && onOpenChange(false)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove Moderator</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to remove this moderator? They will lose all moderator privileges for this club.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={processingAction}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => moderatorId && onConfirm(moderatorId)}
            disabled={processingAction}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {processingAction ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Removing...
              </>
            ) : (
              <>Remove</>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default RemoveModeratorDialog;
