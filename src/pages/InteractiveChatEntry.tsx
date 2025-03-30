
import React from 'react';
import { Helmet } from 'react-helmet';
import InteractiveBook, { AccessibleGenreSelector } from '@/components/books/interactive/InteractiveBook';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const InteractiveChatEntry: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-bookconnect-cream">
      <Helmet>
        <title>Join the Conversation - BookConnect</title>
      </Helmet>
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="flex items-center text-bookconnect-brown hover:text-bookconnect-terracotta"
          >
            <ChevronLeft className="h-5 w-5 mr-1" /> Back to Home
          </Button>
          <h1 className="font-serif text-3xl text-bookconnect-brown font-bold text-center">
            Anonymous Book Discussions
          </h1>
          <div className="w-[100px]"></div> {/* Spacer for centering */}
        </div>
        
        {/* Introduction */}
        <div className="max-w-3xl mx-auto mb-10 text-center">
          <p className="text-lg text-bookconnect-brown/80">
            Connect with other book lovers and discuss your favorite reads anonymously.
            Explore the interactive book below and select a genre to start chatting.
          </p>
        </div>
        
        {/* 3D Book Component */}
        <InteractiveBook />
        
        {/* Accessible Alternative */}
        <AccessibleGenreSelector />
        
        {/* How It Works */}
        <div className="max-w-4xl mx-auto mt-16 mb-12">
          <h2 className="text-2xl font-serif font-bold text-bookconnect-brown mb-6 text-center">
            How Anonymous Chat Works
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="w-12 h-12 bg-bookconnect-terracotta/20 text-bookconnect-terracotta rounded-full flex items-center justify-center text-xl font-bold mb-4">1</div>
              <h3 className="text-xl font-serif font-semibold mb-2 text-bookconnect-brown">Choose a Genre</h3>
              <p className="text-bookconnect-brown/80">
                Select the type of books you're interested in discussing from our interactive book display.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="w-12 h-12 bg-bookconnect-terracotta/20 text-bookconnect-terracotta rounded-full flex items-center justify-center text-xl font-bold mb-4">2</div>
              <h3 className="text-xl font-serif font-semibold mb-2 text-bookconnect-brown">Pick a Username</h3>
              <p className="text-bookconnect-brown/80">
                Create a temporary anonymous username that will be used only for this chat session.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="w-12 h-12 bg-bookconnect-terracotta/20 text-bookconnect-terracotta rounded-full flex items-center justify-center text-xl font-bold mb-4">3</div>
              <h3 className="text-xl font-serif font-semibold mb-2 text-bookconnect-brown">Start Chatting</h3>
              <p className="text-bookconnect-brown/80">
                Join conversations about books you love without revealing your identity. Connect with like-minded readers.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InteractiveChatEntry;
