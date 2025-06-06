import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, BookPlus, X, Info, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Book } from '@/types/books';
import { searchBooks } from '@/lib/api/bookclubs/books/search';
import { nominateBook } from '@/lib/api/bookclubs/nominations/create';
import { isClubMember } from '@/lib/api/auth';
import { supabase } from '@/lib/supabase';
import SkeletonBookCover from '@/components/bookclubs/nominations/SkeletonBookCover';
import LoadingButton from '@/components/bookclubs/nominations/LoadingButton';
import ErrorDisplay from '@/components/bookclubs/nominations/ErrorDisplay';
import { ErrorType } from '@/components/bookclubs/nominations/ErrorDisplay';

/**
 * A dedicated page for the book nomination process
 */
const BookNominationFormPage: React.FC = () => {
  const { clubId } = useParams<{ clubId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Book[]>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isNominating, setIsNominating] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [clubName, setClubName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<ErrorType>('unknown');
  const [activeTab, setActiveTab] = useState<'search' | 'preview'>('search');

  // Check if user is a member of the club
  useEffect(() => {
    const checkMembership = async () => {
      if (!clubId || !user?.id) return;

      try {
        const memberStatus = await isClubMember(user.id, clubId);
        setIsMember(memberStatus);

        if (!memberStatus) {
          setError('You must be a member of this club to nominate books');
          setErrorType('permission');
        }
      } catch (err) {
        console.error('Error checking membership:', err);
        setError('Failed to verify club membership');
        setErrorType('unknown');
      }
    };

    const fetchClubName = async () => {
      if (!clubId) return;

      try {
        const { data, error } = await supabase
          .from('book_clubs')
          .select('name')
          .eq('id', clubId)
          .single();

        if (error) throw error;
        setClubName(data?.name || 'Book Club');
      } catch (err) {
        console.error('Error fetching club name:', err);
        setClubName('Book Club');
      }
    };

    checkMembership();
    fetchClubName();
  }, [clubId, user?.id]);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!searchQuery.trim()) {
      return;
    }

    setIsSearching(true);
    setError(null);
    
    try {
      const results = await searchBooks(searchQuery);
      setSearchResults(results);
      
      if (results.length === 0) {
        toast({
          title: "No books found",
          description: "Try a different search term",
          variant: "default",
        });
      }
    } catch (err) {
      console.error('Error searching books:', err);
      setError('Failed to search for books');
      setErrorType('connection');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectBook = (book: Book) => {
    setSelectedBook(book);
    setActiveTab('preview');
  };

  const handleNominateBook = async () => {
    if (!clubId || !user?.id || !selectedBook) return;

    setIsNominating(true);
    setError(null);
    
    try {
      await nominateBook(user.id, clubId, selectedBook);
      
      toast({
        title: "Book Nominated",
        description: "Your book nomination has been submitted successfully",
        variant: "default",
      });
      
      // Navigate back to nominations page
      navigate(`/book-club/${clubId}/nominations`);
    } catch (err: any) {
      console.error('Error nominating book:', err);
      setError(err.message || 'Failed to nominate book');

      // Determine error type and provide appropriate toast feedback
      const errorMessage = err.message?.toLowerCase() || '';

      if (errorMessage.includes('already been nominated')) {
        setErrorType('validation');
        toast({
          title: "Book Already Nominated",
          description: "This book has already been nominated in this club. Please choose a different book.",
          variant: "destructive",
        });
      } else if (errorMessage.includes('already been selected')) {
        setErrorType('validation');
        toast({
          title: "Book Already Selected",
          description: "This book has already been selected as the current book for this club.",
          variant: "destructive",
        });
      } else if (errorMessage.includes('member')) {
        setErrorType('permission');
        toast({
          title: "Permission Denied",
          description: "You must be a member of this club to nominate books.",
          variant: "destructive",
        });
      } else if (errorMessage.includes('invalid book or club reference')) {
        setErrorType('validation');
        toast({
          title: "Invalid Reference",
          description: "There was an issue with the book or club information. Please try again.",
          variant: "destructive",
        });
      } else if (errorMessage.includes('constraint') || errorMessage.includes('unique')) {
        setErrorType('validation');
        toast({
          title: "Duplicate Nomination",
          description: "This book has already been nominated in this club.",
          variant: "destructive",
        });
      } else {
        setErrorType('unknown');
        toast({
          title: "Nomination Failed",
          description: err.message || "An unexpected error occurred. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsNominating(false);
    }
  };

  const handleBackToNominations = () => {
    navigate(`/book-club/${clubId}/nominations`);
  };

  const handleClearSelection = () => {
    setSelectedBook(null);
    setActiveTab('search');
  };

  // If user is not a member, show access denied
  if (!isMember && !error) {
    return (
      <div className="container max-w-6xl mx-auto py-8 px-4">
        <ErrorDisplay
          type="permission"
          message="You must be a member of this club to nominate books"
          onBack={handleBackToNominations}
          className="max-w-2xl mx-auto"
        />
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleBackToNominations}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Nominations
          </Button>
          <h1 className="text-2xl sm:text-3xl font-bold">Nominate a Book</h1>
        </div>
        <Badge className="bg-bookconnect-terracotta">{clubName}</Badge>
      </div>

      {/* Error display */}
      {error && (
        <div className="mb-6">
          <ErrorDisplay
            type={errorType}
            message={error}
            onRetry={() => setError(null)}
            onBack={handleBackToNominations}
          />
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'search' | 'preview')} className="mb-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="search">Search Books</TabsTrigger>
          <TabsTrigger value="preview" disabled={!selectedBook}>Preview & Nominate</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Search Tab */}
      {activeTab === 'search' && (
        <div className="animate-fade-in">
          {/* Search Form */}
          <form onSubmit={handleSearch} className="mb-6">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search by title, author, or ISBN..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  disabled={isSearching}
                />
              </div>
              <LoadingButton
                type="submit"
                isLoading={isSearching}
                icon={<Search className="h-4 w-4" />}
                loadingText="Searching..."
                disabled={!searchQuery.trim()}
              >
                Search
              </LoadingButton>
            </div>
          </form>

          {/* Search Results */}
          {isSearching ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="p-4 animate-pulse-subtle" style={{ animationDelay: `${i * 100}ms` }}>
                  <div className="flex gap-4">
                    <div className="w-16 h-24 bg-gray-200 rounded"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                      <div className="h-3 bg-gray-200 rounded w-full mb-1"></div>
                      <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : searchResults.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {searchResults.map((book, index) => (
                <Card 
                  key={book.id || index} 
                  className="p-4 hover:shadow-md transition-all duration-300 cursor-pointer animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                  onClick={() => handleSelectBook(book)}
                >
                  <div className="flex gap-4">
                    <SkeletonBookCover
                      src={book.imageUrl}
                      alt={`Cover of ${book.title}`}
                      width="w-16"
                      height="h-24"
                      className="rounded shadow"
                      viewType="list"
                    />
                    <div className="flex-1">
                      <h3 className="font-medium text-base sm:text-lg line-clamp-1">{book.title}</h3>
                      <p className="text-gray-600 text-xs sm:text-sm mb-2">by {book.author || 'Unknown Author'}</p>
                      {book.description && (
                        <p className="text-xs sm:text-sm text-gray-700 line-clamp-2">
                          {book.description}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : searchQuery.trim() ? (
            <div className="text-center py-12">
              <Info className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No books found</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Try a different search term or check the spelling
              </p>
            </div>
          ) : (
            <div className="text-center py-12">
              <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Search for a book to nominate</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Enter a title, author, or ISBN to find books
              </p>
            </div>
          )}
        </div>
      )}

      {/* Preview Tab */}
      {activeTab === 'preview' && selectedBook && (
        <div className="animate-fade-in">
          <Card className="p-4 sm:p-6 max-w-3xl mx-auto">
            <div className="flex justify-end mb-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleClearSelection}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex flex-col md:flex-row gap-6">
              <div className="w-full md:w-1/3 flex justify-center">
                <SkeletonBookCover
                  src={selectedBook.imageUrl}
                  alt={`Cover of ${selectedBook.title}`}
                  width="w-48"
                  height="h-64"
                  className="rounded shadow"
                  viewType="grid"
                />
              </div>
              
              <div className="flex-1">
                <h2 className="text-xl sm:text-2xl font-bold mb-2">{selectedBook.title}</h2>
                <p className="text-gray-600 mb-4">by {selectedBook.author || 'Unknown Author'}</p>
                
                {selectedBook.categories && selectedBook.categories.length > 0 && (
                  <div className="mb-4 flex flex-wrap gap-2">
                    {selectedBook.categories.map((category, index) => (
                      <Badge key={index} variant="outline">{category}</Badge>
                    ))}
                  </div>
                )}
                
                {selectedBook.description && (
                  <div className="mb-6">
                    <h3 className="text-sm font-medium mb-2">Description</h3>
                    <p className="text-sm text-gray-700">{selectedBook.description}</p>
                  </div>
                )}
                
                <LoadingButton
                  onClick={handleNominateBook}
                  isLoading={isNominating}
                  icon={<BookPlus className="h-4 w-4" />}
                  loadingText="Nominating..."
                  className="w-full sm:w-auto bg-bookconnect-terracotta hover:bg-bookconnect-terracotta/90"
                >
                  Nominate This Book
                </LoadingButton>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default BookNominationFormPage;
