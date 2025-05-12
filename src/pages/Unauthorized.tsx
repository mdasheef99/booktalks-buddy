import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Unauthorized: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Extract club ID from path if it exists
  const pathParts = location.pathname.split('/');
  const clubIdIndex = pathParts.indexOf('book-club') + 1;
  const clubId = clubIdIndex > 0 && clubIdIndex < pathParts.length ? pathParts[clubIdIndex] : null;

  // Determine if this is a book club page
  const isBookClubPage = location.pathname.includes('/book-club/');

  return (
    <div className="min-h-screen bg-bookconnect-cream flex items-center justify-center">
      <div className="text-center p-8 bg-white/80 rounded-lg shadow-lg border border-bookconnect-brown/20 max-w-md">
        <h1 className="text-3xl font-serif text-bookconnect-brown mb-4">Unauthorized Access</h1>
        <p className="font-serif text-bookconnect-brown mb-6">
          You don't have permission to access this page. You may need to be a member or admin of this book club.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {isBookClubPage && clubId && (
            <Button
              onClick={() => navigate(`/book-club/${clubId}`)}
              className="bg-bookconnect-brown text-white px-4 py-2 rounded hover:bg-bookconnect-brown/90"
            >
              Return to Book Club
            </Button>
          )}
          <Button
            onClick={() => navigate('/book-club')}
            className="bg-bookconnect-brown text-white px-4 py-2 rounded hover:bg-bookconnect-brown/90"
          >
            Return to Book Clubs
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/')}
            className="border-bookconnect-brown text-bookconnect-brown px-4 py-2 rounded hover:bg-bookconnect-brown/10"
          >
            Go to Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
