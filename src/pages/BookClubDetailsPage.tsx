import React from 'react';
import { BookClubDetailsWithJoin } from '@/components/bookclubs/BookClubDetailsWithJoin';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';

const BookClubDetailsPage: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" state={{ redirectTo: "/book-club" }} />;
  }

  return (
    <div className="min-h-screen bg-bookconnect-cream">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <BookClubDetailsWithJoin />
        </div>
      </div>
    </div>
  );
};

export default BookClubDetailsPage;
