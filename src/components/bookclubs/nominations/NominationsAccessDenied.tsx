import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface NominationsAccessDeniedProps {
  clubId: string;
}

const NominationsAccessDenied: React.FC<NominationsAccessDeniedProps> = ({
  clubId
}) => {
  const navigate = useNavigate();

  const handleBackToClub = () => {
    navigate(`/book-club/${clubId}`);
  };

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      <Card className="p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
        <p className="mb-6">You must be a member of this book club to view nominations.</p>
        <Button onClick={handleBackToClub}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Book Club
        </Button>
      </Card>
    </div>
  );
};

export default NominationsAccessDenied;
