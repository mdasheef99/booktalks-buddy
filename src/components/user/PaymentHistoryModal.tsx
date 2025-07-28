/**
 * Payment History Modal Component
 * 
 * Full-featured modal for displaying complete payment history.
 * Used in profile sections and other contexts where detailed payment history is needed.
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { PaymentHistoryComponent } from './PaymentHistoryComponent';

interface PaymentHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

export const PaymentHistoryModal: React.FC<PaymentHistoryModalProps> = ({
  isOpen,
  onClose,
  title = 'Payment History'
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-bookconnect-brown">{title}</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <PaymentHistoryComponent
            showSummary={true}
            showFilters={true}
            initialLimit={20}
            compact={false}
          />
        </div>
      </div>
    </div>
  );
};
