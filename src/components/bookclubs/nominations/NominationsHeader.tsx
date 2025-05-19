import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BookPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NominationsHeaderProps {
  clubId: string;
  clubName: string;
  onOpenSearchModal: () => void;
}

const NominationsHeader: React.FC<NominationsHeaderProps> = ({
  clubId,
  clubName,
  onOpenSearchModal
}) => {
  const navigate = useNavigate();

  const handleBackToClub = () => {
    navigate(`/book-club/${clubId}`);
  };

  return (
    <div className="flex justify-between items-center mb-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={handleBackToClub}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">{clubName} Nominations</h1>
      </div>
      <Button
        onClick={onOpenSearchModal}
        className="bg-bookconnect-terracotta hover:bg-bookconnect-terracotta/90"
      >
        <BookPlus className="h-4 w-4 mr-2" />
        Nominate a Book
      </Button>
    </div>
  );
};

export default NominationsHeader;
