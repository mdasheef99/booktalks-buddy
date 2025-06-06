/**
 * Spotlight Delete Confirmation Dialog Component
 * Confirmation dialog for deleting member spotlights
 */

import React from 'react';
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
import type { DeleteConfirmationDialogProps } from '../types/memberSpotlightTypes';
import { UI_TEXT } from '../constants/memberSpotlightConstants';

export const SpotlightDeleteDialog: React.FC<DeleteConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
}) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{UI_TEXT.DIALOG_TITLES.DELETE}</AlertDialogTitle>
          <AlertDialogDescription>
            {UI_TEXT.DIALOG_DESCRIPTIONS.DELETE}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>
            {UI_TEXT.BUTTONS.CANCEL}
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700"
          >
            {isLoading ? 'Deleting...' : UI_TEXT.BUTTONS.DELETE}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
