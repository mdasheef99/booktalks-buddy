import React, { useState, useEffect } from 'react';
import { Book, Calendar, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Database } from '@/integrations/supabase/types';
import { supabase } from '@/lib/supabase';
import { getNominationById } from '@/lib/api/bookclubs/nominations';
import { useAuth } from '@/contexts/AuthContext';

type CurrentBook = Database['public']['Tables']['current_books']['Row'];

interface CurrentBookSectionProps {
  currentBook: CurrentBook | null;
}

const CurrentBookSection: React.FC<CurrentBookSectionProps> = ({ currentBook }) => {
  const { user } = useAuth();
  const [bookDetails, setBookDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchBookDetails = async () => {
      if (!currentBook || !user?.id) return;

      setLoading(true);
      try {
        // If we have a nomination_id, fetch the nomination details
        if (currentBook.nomination_id) {
          const nomination = await getNominationById(currentBook.nomination_id, user.id);
          setBookDetails({
            title: nomination.book.title,
            author: nomination.book.author,
            cover_url: nomination.book.cover_url,
            description: nomination.book.description,
            google_books_id: nomination.book.google_books_id,
            nominated_at: nomination.nominated_at,
            nominated_by: nomination.nominated_by
          });
        }
        // If we have a book_id but no nomination_id, fetch the book details directly
        else if (currentBook.book_id) {
          const { data: book, error } = await supabase
            .from('books')
            .select('*')
            .eq('id', currentBook.book_id)
            .single();

          if (!error && book) {
            setBookDetails({
              title: book.title,
              author: book.author,
              cover_url: book.cover_url,
              description: book.description,
              google_books_id: book.google_books_id,
              set_at: currentBook.set_at
            });
          }
        }
        // Otherwise, just use the basic info from current_books
        else {
          setBookDetails({
            title: currentBook.title,
            author: currentBook.author,
            set_at: currentBook.set_at
          });
        }
      } catch (error) {
        console.error('Error fetching book details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookDetails();
  }, [currentBook, user?.id]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Book className="h-5 w-5 text-bookconnect-terracotta" />
          Current Book
        </h2>
      </div>

      {currentBook && bookDetails ? (
        <div className="flex flex-col md:flex-row gap-4">
          {/* Book Cover */}
          <div className="flex-shrink-0">
            {bookDetails.cover_url ? (
              <img
                src={bookDetails.cover_url}
                alt={`Cover of ${bookDetails.title}`}
                className="w-32 h-48 object-cover rounded shadow"
              />
            ) : (
              <div className="w-32 h-48 bg-gray-200 rounded flex items-center justify-center">
                <Book className="h-12 w-12 text-gray-400" />
              </div>
            )}
          </div>

          {/* Book Details */}
          <div className="flex-1">
            <h3 className="text-xl font-medium">{bookDetails.title}</h3>
            <p className="text-gray-600 mb-2">by {bookDetails.author}</p>

            <div className="flex items-center text-xs text-gray-500 mb-3">
              <Calendar className="h-3 w-3 mr-1" />
              <span>
                Selected on {formatDate(bookDetails.set_at || currentBook.set_at)}
              </span>
            </div>

            {bookDetails.description && (
              <p className="text-sm text-gray-700 mb-4 line-clamp-3">
                {bookDetails.description}
              </p>
            )}

            {bookDetails.google_books_id && (
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => window.open(`https://books.google.com/books?id=${bookDetails.google_books_id}`, '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View on Google Books
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <Book className="h-12 w-12 mx-auto text-gray-300 mb-2" />
          <p className="text-gray-600 mb-1">No book currently selected</p>
          <p className="text-sm text-gray-500">
            Club members can nominate books for the club to read next.
          </p>
        </div>
      )}
    </>
  );
};

export default CurrentBookSection;
