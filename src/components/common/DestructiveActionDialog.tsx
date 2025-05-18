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
import { Button } from '@/components/ui/button';
import { AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export type DestructiveActionSeverity = 'low' | 'medium' | 'high';

export interface DestructiveActionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  severity?: DestructiveActionSeverity;
  isLoading?: boolean;
  additionalContent?: React.ReactNode;
  affectedItems?: string[];
  affectedItemsLabel?: string;
}

/**
 * Enhanced confirmation dialog for destructive actions
 * Includes severity levels, visual cues, and accessibility features
 */
const DestructiveActionDialog: React.FC<DestructiveActionDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Delete',
  cancelText = 'Cancel',
  severity = 'medium',
  isLoading = false,
  additionalContent,
  affectedItems,
  affectedItemsLabel = 'Affected items',
}) => {
  // Handle confirm action
  const handleConfirm = () => {
    onConfirm();
  };

  // Get icon based on severity
  const getIcon = () => {
    switch (severity) {
      case 'high':
        return <AlertCircle className="h-6 w-6 text-red-500" />;
      case 'medium':
        return <AlertTriangle className="h-6 w-6 text-amber-500" />;
      case 'low':
        return <Info className="h-6 w-6 text-blue-500" />;
      default:
        return <AlertTriangle className="h-6 w-6 text-amber-500" />;
    }
  };

  // Get button color based on severity
  const getButtonClass = () => {
    switch (severity) {
      case 'high':
        return 'bg-red-600 hover:bg-red-700 text-white';
      case 'medium':
        return 'bg-amber-600 hover:bg-amber-700 text-white';
      case 'low':
        return 'bg-blue-600 hover:bg-blue-700 text-white';
      default:
        return 'bg-amber-600 hover:bg-amber-700 text-white';
    }
  };

  // Get dialog border color based on severity
  const getDialogBorderClass = () => {
    switch (severity) {
      case 'high':
        return 'border-red-300';
      case 'medium':
        return 'border-amber-300';
      case 'low':
        return 'border-blue-300';
      default:
        return 'border-amber-300';
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent
        className={cn('border-2', getDialogBorderClass())}
        onKeyDown={(e) => {
          // Close on escape
          if (e.key === 'Escape') {
            onClose();
          }
          // Confirm on enter
          if (e.key === 'Enter' && !isLoading) {
            handleConfirm();
          }
        }}
      >
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {getIcon()}
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {affectedItems && affectedItems.length > 0 && (
          <div className="my-4">
            <h4 className="text-sm font-medium mb-2">{affectedItemsLabel}:</h4>
            <ul className="max-h-32 overflow-y-auto text-sm bg-gray-50 rounded-md p-2">
              {affectedItems.map((item, index) => (
                <li key={index} className="py-1 border-b border-gray-100 last:border-0">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {additionalContent && (
          <div className="my-4">
            {additionalContent}
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel
            disabled={isLoading}
            className="focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
          >
            {cancelText}
          </AlertDialogCancel>
          <Button
            className={cn(getButtonClass(), 'focus:ring-2 focus:ring-offset-2')}
            onClick={handleConfirm}
            disabled={isLoading}
            aria-label={confirmText}
          >
            {isLoading ? 'Processing...' : confirmText}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DestructiveActionDialog;
