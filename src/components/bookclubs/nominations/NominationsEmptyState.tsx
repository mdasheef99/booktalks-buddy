import React from 'react';
import { BookPlus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface NominationsEmptyStateProps {
  onOpenSearchModal: () => void;
}

const NominationsEmptyState: React.FC<NominationsEmptyStateProps> = ({
  onOpenSearchModal
}) => {
  return (
    <Card className="p-8 text-center">
      <BookPlus className="h-16 w-16 mx-auto text-gray-300 mb-4" />
      <h3 className="text-xl font-medium mb-2">No book nominations yet</h3>
      <p className="text-gray-500 mb-6 max-w-md mx-auto">
        Start by nominating books for your club to read next!
      </p>
      <Button
        onClick={onOpenSearchModal}
        className="bg-bookconnect-terracotta hover:bg-bookconnect-terracotta/90"
      >
        <BookPlus className="h-4 w-4 mr-2" />
        Nominate a Book
      </Button>
    </Card>
  );
};

export default NominationsEmptyState;
