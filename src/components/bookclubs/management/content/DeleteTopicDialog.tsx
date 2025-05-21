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

interface DeleteTopicDialogProps {
  topicId: string | null;
  processingAction: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (topicId: string) => Promise<void>;
}

/**
 * Confirmation dialog for topic deletion
 */
const DeleteTopicDialog: React.FC<DeleteTopicDialogProps> = ({
  topicId,
  processingAction,
  onOpenChange,
  onConfirm,
}) => {
  return (
    <AlertDialog open={!!topicId} onOpenChange={(open) => !open && onOpenChange(false)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Topic</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this topic? This will permanently remove the topic and all its posts. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={processingAction}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => topicId && onConfirm(topicId)}
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

export default DeleteTopicDialog;
