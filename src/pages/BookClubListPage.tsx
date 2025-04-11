import React from 'react';
import { BookClubList } from '@/components/bookclubs/BookClubList';
import BookConnectHeader from '@/components/BookConnectHeader';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Compass } from 'lucide-react';

const BookClubListPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return <Navigate to="/login" state={{ redirectTo: "/book-club" }} />;
  }

  const handleDiscoverClubs = () => {
    navigate('/discover-clubs');
  };

  return (
    <div className="min-h-screen bg-bookconnect-cream">
      <BookConnectHeader />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <h1 className="text-4xl font-serif text-bookconnect-brown">My Book Clubs</h1>
            <Button
              onClick={handleDiscoverClubs}
              className="mt-4 md:mt-0 bg-bookconnect-terracotta hover:bg-bookconnect-terracotta/90"
            >
              <Compass className="h-4 w-4 mr-2" />
              Discover Clubs
            </Button>
          </div>
          <BookClubList />
        </div>
      </div>
    </div>
  );
};

export default BookClubListPage;
