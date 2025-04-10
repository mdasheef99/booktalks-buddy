import React from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from "sonner";
import { useAuth } from '@/contexts/AuthContext';
import BookConnectHeader from '@/components/BookConnectHeader';
import { BookClubList } from '@/components/bookclubs/BookClubList';

const BookClub: React.FC = () => {
  const { user, session } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    // Check authentication
    if (!session) {
      toast.error("Please login to access the Book Club");
      navigate('/login');
      return;
    }
  }, [session, navigate]);

  if (!user) {
    return (
      <div className="min-h-screen bg-[#f5f0e6] flex items-center justify-center">
        <div className="text-center p-8 bg-white/80 rounded-lg shadow-lg border border-[#5c4033]/20">
          <p className="font-serif text-[#5c4033] mb-4">Please log in to view the Book Club</p>
          <button 
            onClick={() => navigate('/login')}
            className="bg-[#5c4033] text-white px-4 py-2 rounded hover:bg-[#5c4033]/90"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f0e6]">
      <BookConnectHeader />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-serif text-[#5c4033] mb-8">Book Clubs</h1>
          <BookClubList />
        </div>
      </div>
    </div>
  );
};

export default BookClub;
