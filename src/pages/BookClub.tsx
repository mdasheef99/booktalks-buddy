import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from "sonner";
import { useAuth } from '@/contexts/AuthContext';
import BookConnectHeader from '@/components/BookConnectHeader';
import { 
  Bookmark, 
  Users, 
  Calendar,
  LogOut,
  Rocket, 
  Feather,
  ArrowUp
} from 'lucide-react';
import { MagnifyingGlass } from '@/components/icons/MagnifyingGlass';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import * as Sentry from "@sentry/react";
import { supabase } from '@/lib/supabase';

// Book type definition
interface Book {
  id: string;
  title: string;
  author: string;
  votes: number;
}

// Club type definition
interface Club {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  books: Book[];
}

const BookClub: React.FC = () => {
  const { user, session, signOut } = useAuth();
  const navigate = useNavigate();
  const [clubs, setClubs] = useState<Club[]>([]);

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!session) {
      navigate('/');
      return;
    }

    // Initialize clubs with hardcoded data
    setClubs([
      {
        id: 'mystery',
        name: 'Mystery Club',
        icon: <MagnifyingGlass className="h-5 w-5" />,
        color: '#4a3a2b',
        books: [
          { id: 'sherlock', title: 'Sherlock Holmes', author: 'Arthur Conan Doyle', votes: 5 },
          { id: 'orient', title: 'Murder on the Orient Express', author: 'Agatha Christie', votes: 3 },
          { id: 'davinci', title: 'The Da Vinci Code', author: 'Dan Brown', votes: 2 },
        ]
      },
      {
        id: 'scifi',
        name: 'Sci-Fi Club',
        icon: <Rocket className="h-5 w-5" />,
        color: '#2b4a5c',
        books: [
          { id: 'dune', title: 'Dune', author: 'Frank Herbert', votes: 7 },
          { id: '1984', title: '1984', author: 'George Orwell', votes: 4 },
          { id: 'neuromancer', title: 'Neuromancer', author: 'William Gibson', votes: 2 },
        ]
      },
      {
        id: 'classics',
        name: 'Classics Club',
        icon: <Feather className="h-5 w-5" />,
        color: '#d9c8a9',
        books: [
          { id: 'janeeyre', title: 'Jane Eyre', author: 'Charlotte Brontë', votes: 6 },
          { id: 'pride', title: 'Pride and Prejudice', author: 'Jane Austen', votes: 5 },
          { id: 'gatsby', title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', votes: 3 },
        ]
      },
    ]);
  }, [session, navigate]);

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out. Please try again.');
    }
  };

  const handleUpvote = (clubId: string, bookId: string) => {
    try {
      setClubs(prevClubs => 
        prevClubs.map(club => {
          if (club.id === clubId) {
            return {
              ...club,
              books: club.books.map(book => {
                if (book.id === bookId) {
                  return { ...book, votes: book.votes + 1 };
                }
                return book;
              })
            };
          }
          return club;
        })
      );
    } catch (error) {
      console.error('Error upvoting book:', error);
      Sentry.captureException(error);
      toast.error('Failed to upvote book!');
    }
  };

  const handleDiscuss = (book: Book) => {
    try {
      // Navigate to the book discussion page
      navigate(`/books/${book.id}/discussion?title=${encodeURIComponent(book.title)}&author=${encodeURIComponent(book.author)}`);
    } catch (error) {
      console.error('Error navigating to discussion:', error);
      Sentry.captureException(error);
      toast.error('Discuss failed!');
    }
  };

  const getTopBook = (books: Book[]) => {
    return [...books].sort((a, b) => b.votes - a.votes)[0];
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-[#f5f0e6]" style={{
      backgroundImage: "url('https://images.unsplash.com/photo-1581431886815-f600e88e3abd?ixlib=rb-1.2.1&auto=format&fit=crop&q=80&w=1200')",
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundBlendMode: "overlay",
    }}>
      <BookConnectHeader />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-[#f0e6d2]/90 p-8 rounded-lg shadow-lg border border-[#5c4033]/20 backdrop-blur-sm">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-4xl font-serif text-[#5c4033] flex items-center">
                <Users className="inline-block mr-3 mb-1" /> 
                <span>Book Club</span>
              </h1>
              
              <Button 
                variant="outline" 
                onClick={handleLogout}
                className="border-[#5c4033] text-[#5c4033] hover:bg-[#5c4033]/10"
              >
                <LogOut className="mr-2 h-4 w-4" /> Sign Out
              </Button>
            </div>
            
            <div className="bg-[#fff]/60 p-6 rounded-lg mb-8 border border-[#5c4033]/10">
              <h2 className="text-2xl font-serif text-[#5c4033] mb-4">Welcome to the BookConnect Book Clubs!</h2>
              <p className="text-[#5c4033]/80">
                Join our exclusive book clubs to discuss your favorite genres with fellow readers. 
                Vote on books you'd like to discuss next and join the conversations!
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {clubs.map(club => (
                <div key={club.id} className="bg-[#fff]/80 rounded-lg border border-[#5c4033]/10 overflow-hidden shadow-md">
                  <div 
                    className="p-4 text-white font-serif text-lg flex items-center gap-2" 
                    style={{ backgroundColor: club.color }}
                  >
                    {club.icon}
                    <span>{club.name}</span>
                  </div>
                  
                  <div className="p-4 space-y-4">
                    {club.books.map((book) => (
                      <Card key={book.id} className="bg-[#f0e6d2] p-4 border-[#5c4033]/10">
                        <div className="flex justify-between">
                          <div>
                            <h3 className="font-medium text-[#000] text-sm">{book.title}</h3>
                            <p className="text-[#666] text-xs">{book.author}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <button 
                              className="p-1 hover:bg-[#5c4033]/10 rounded-full transition-colors"
                              onClick={() => handleUpvote(club.id, book.id)}
                            >
                              <ArrowUp className="h-5 w-5 text-[#5c4033]" />
                            </button>
                            <span className="text-xs text-[#5c4033]">{book.votes} votes</span>
                          </div>
                        </div>
                      </Card>
                    ))}
                    
                    {/* Discuss button for top-voted book */}
                    <div className="mt-4 text-center">
                      <Button 
                        onClick={() => handleDiscuss(getTopBook(club.books))}
                        className="bg-[#5c4033] hover:bg-[#5c4033]/90 text-white"
                      >
                        Discuss "{getTopBook(club.books).title}"
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookClub;
