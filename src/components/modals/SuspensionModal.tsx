/**
 * Suspension Modal Component
 * 
 * Displays a modal dialog when a suspended user attempts to log in.
 * Shows a clear message and prevents login completion.
 * 
 * Part of: Modal-Based Suspension System
 * Created: 2025-01-24
 */

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Mail } from 'lucide-react';
import { useSuspensionModal } from '@/contexts/SuspensionModalContext';
import { useAuth } from '@/contexts/AuthContext';

// =========================
// Main Component
// =========================

/**
 * Global suspension modal that shows when a suspended user is detected
 */
export const SuspensionModal: React.FC = () => {
  const { isOpen, hideModal } = useSuspensionModal();
  const { signOut } = useAuth();

  const handleClose = async () => {
    // Sign out the user when they close the modal
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out from suspension modal:', error);
    }
    hideModal();
  };
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-100 rounded-full">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <DialogTitle className="text-xl font-semibold text-red-800">
              Account Suspended
            </DialogTitle>
          </div>
          <DialogDescription className="text-gray-600 text-base leading-relaxed">
            Your account has been suspended and you cannot log in at this time.
            Please contact the store owner for more information about your account status.
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-6 space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-800 mb-1">
                  Need Help?
                </h4>
                <p className="text-sm text-blue-700">
                  Contact the store owner directly for assistance with your account.
                  They can provide more details about the suspension and next steps.
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button
              onClick={handleClose}
              className="bg-bookconnect-brown hover:bg-bookconnect-brown/90 text-white"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SuspensionModal;
