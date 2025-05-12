import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import BookClubHeader from '@/components/bookclubs/BookClubHeader';

interface BookClubLayoutProps {
  title?: string;
  backLink?: string;
  backText?: string;
  showHeader?: boolean;
}

const BookClubLayout: React.FC<BookClubLayoutProps> = ({
  title,
  backLink = '/book-club',
  backText = 'Back to Book Clubs',
  showHeader = true,
}) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-bookconnect-cream">
      {showHeader && <BookClubHeader />}

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {backLink && (
            <Button
              variant="ghost"
              onClick={() => navigate(backLink)}
              className="mb-4 flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              {backText}
            </Button>
          )}

          {title && (
            <h1 className="text-3xl font-serif text-bookconnect-brown mb-8">{title}</h1>
          )}

          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default BookClubLayout;
