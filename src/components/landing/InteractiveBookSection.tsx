
import InteractiveBook, { AccessibleGenreSelector } from '@/components/books/interactive/InteractiveBook';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';

interface InteractiveBookSectionProps {
  showInteractiveBook: boolean;
}

const InteractiveBookSection = ({ showInteractiveBook }: InteractiveBookSectionProps) => {
  const navigate = useNavigate();
  
  if (!showInteractiveBook) return null;
  
  const handleStartChatting = () => {
    navigate('/chat-selection');
  };
  
  return (
    <div id="interactive-book-section" className="relative bg-bookconnect-cream py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-serif font-bold text-bookconnect-brown mb-6 text-center">
            Choose Your Literary Journey
          </h2>
          <p className="text-center text-bookconnect-brown/80 mb-8">
            Open the book below and select a genre to start anonymous conversations with fellow readers
          </p>
          
          <div className="flex justify-center mb-8">
            <Button 
              onClick={handleStartChatting}
              className="bg-bookconnect-terracotta hover:bg-bookconnect-terracotta/90 flex items-center gap-2"
            >
              <MessageCircle size={18} />
              Start Chatting Now
            </Button>
          </div>
        </div>
        
        <div className="my-12 min-h-[500px]">
          {/* 3D Interactive Book */}
          <InteractiveBook />
        </div>
        
        {/* Accessible Alternative */}
        <div className="mt-8">
          <AccessibleGenreSelector />
        </div>
      </div>
    </div>
  );
};

export default InteractiveBookSection;
