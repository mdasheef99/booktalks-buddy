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
import { Topic } from './types';

interface ToggleLockTopicDialogProps {
  topic: Topic | null;
  processingAction: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (topic: Topic) => Promise<void>;
}

/**
 * Confirmation dialog for locking/unlocking topics
 */
const ToggleLockTopicDialog: React.FC<ToggleLockTopicDialogProps> = ({
  topic,
  processingAction,
  onOpenChange,
  onConfirm,
}) => {
  return (
    <AlertDialog open={!!topic} onOpenChange={(open) => !open && onOpenChange(false)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {topic?.is_locked ? 'Unlock Topic' : 'Lock Topic'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {topic?.is_locked
              ? 'Are you sure you want to unlock this topic? Members will be able to post in it again.'
              : 'Are you sure you want to lock this topic? Members will not be able to post in it until it is unlocked.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={processingAction}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => topic && onConfirm(topic)}
            disabled={processingAction}
          >
            {processingAction ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {topic?.is_locked ? 'Unlocking...' : 'Locking...'}
              </>
            ) : (
              <>{topic?.is_locked ? 'Unlock' : 'Lock'}</>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ToggleLockTopicDialog;
