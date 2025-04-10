import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Unauthorized: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#f5f0e6] flex items-center justify-center">
      <div className="text-center p-8 bg-white/80 rounded-lg shadow-lg border border-[#5c4033]/20 max-w-md">
        <h1 className="text-3xl font-serif text-[#5c4033] mb-4">Unauthorized Access</h1>
        <p className="font-serif text-[#5c4033] mb-6">
          You don't have permission to access this page. You may need to be a member or admin of this book club.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            onClick={() => navigate('/book-club')}
            className="bg-[#5c4033] text-white px-4 py-2 rounded hover:bg-[#5c4033]/90"
          >
            Return to Book Clubs
          </Button>
          <Button 
            variant="outline"
            onClick={() => navigate('/')}
            className="border-[#5c4033] text-[#5c4033] px-4 py-2 rounded hover:bg-[#5c4033]/10"
          >
            Go to Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
