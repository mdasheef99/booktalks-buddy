import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown } from 'lucide-react';

interface UpgradeAccountModalProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const UpgradeAccountModal: React.FC<UpgradeAccountModalProps> = ({ isOpen, setIsOpen }) => {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-bookconnect-cream to-white border-bookconnect-brown/30 shadow-lg">
        <DialogHeader className="flex flex-col items-center">
          <Badge variant="outline" className="mb-2 bg-amber-50 text-amber-700 border-amber-200 px-3 py-1 flex items-center gap-1">
            <Crown className="h-3.5 w-3.5" />
            <span>Privileged Feature</span>
          </Badge>
          <DialogTitle className="text-2xl font-serif text-bookconnect-brown text-center">
            Upgrade Your Account
          </DialogTitle>
          <DialogDescription className="text-center mt-2">
            Creating your own book club requires a privileged account tier.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <p className="text-center mb-4">
            To create your own book club, please upgrade your account by paying at the store counter.
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm">
            <h4 className="font-medium text-amber-800 mb-2">Privileged Benefits:</h4>
            <ul className="list-disc pl-5 text-amber-700 space-y-1">
              <li>Create and manage your own book clubs</li>
              <li>Access to premium clubs and content</li>
              <li>Access to premium events</li>
            </ul>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row sm:justify-center gap-2">
          <Button
            onClick={() => setIsOpen(false)}
            className="w-full sm:w-auto"
          >
            OK, I Understand
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UpgradeAccountModal;
