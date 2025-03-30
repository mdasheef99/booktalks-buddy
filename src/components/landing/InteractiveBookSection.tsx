
import InteractiveBook, { AccessibleGenreSelector } from '@/components/books/interactive/InteractiveBook';

interface InteractiveBookSectionProps {
  showInteractiveBook: boolean;
}

const InteractiveBookSection = ({ showInteractiveBook }: InteractiveBookSectionProps) => {
  if (!showInteractiveBook) return null;
  
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
        </div>
        
        {/* 3D Interactive Book */}
        <InteractiveBook />
        
        {/* Accessible Alternative */}
        <AccessibleGenreSelector />
      </div>
    </div>
  );
};

export default InteractiveBookSection;
