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

interface DeletePostDialogProps {
  postId: string | null;
  processingAction: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (postId: string) => Promise<void>;
}

/**
 * Confirmation dialog for post deletion
 */
const DeletePostDialog: React.FC<DeletePostDialogProps> = ({
  postId,
  processingAction,
  onOpenChange,
  onConfirm,
}) => {
  return (
    <AlertDialog open={!!postId} onOpenChange={(open) => !open && onOpenChange(false)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Post</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this post? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={processingAction}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => postId && onConfirm(postId)}
            disabled={processingAction}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {processingAction ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>Delete</>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeletePostDialog;
