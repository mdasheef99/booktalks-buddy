
import React from 'react';
import { useCustomQuotes } from '@/hooks/useCustomQuotes';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface QuoteSectionProps {
  storeId?: string;
}

const QuoteSection: React.FC<QuoteSectionProps> = ({ storeId }) => {
  const { currentQuote, loading, error } = useCustomQuotes(storeId);

  // Show loading state briefly
  if (loading) {
    return (
      <div className="py-16 px-4 bg-bookconnect-sage/30 relative overflow-hidden">
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <LoadingSpinner size="md" text="Loading quote..." />
        </div>
      </div>
    );
  }

  // Hide entire section if no custom quote and no error
  if (!loading && !currentQuote && !error) {
    return null;
  }

  // Show error state or fallback to default quote
  const displayQuote = currentQuote || {
    quote_text: "A reader lives a thousand lives before he dies. The man who never reads lives only one.",
    quote_author: "George R.R. Martin",
    quote_source: undefined
  };

  return (
    <div className="py-16 px-4 bg-bookconnect-sage/30 relative overflow-hidden">
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1550399105-c4db5fb85c18?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}></div>
      </div>
      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <svg className="h-12 w-12 text-bookconnect-terracotta opacity-50 mx-auto mb-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 11C10 8.22 7.77 6 5 6V15C5 17.77 7.22 20 10 20V11Z" fill="currentColor" />
          <path d="M19 11C19 8.22 16.77 6 14 6V15C14 17.77 16.22 20 19 20V11Z" fill="currentColor" />
        </svg>

        <p className="text-xl md:text-2xl lg:text-3xl font-serif italic font-medium text-bookconnect-brown transition-opacity duration-500">
          "{displayQuote.quote_text}"
        </p>

        {(displayQuote.quote_author || displayQuote.quote_source) && (
          <div className="mt-4 text-bookconnect-brown/70">
            — {displayQuote.quote_author}
            {displayQuote.quote_source && `, ${displayQuote.quote_source}`}
          </div>
        )}

        {error && !currentQuote && (
          <div className="mt-2 text-sm text-bookconnect-brown/50">
            Using default quote
          </div>
        )}
      </div>
    </div>
  );
};

export default QuoteSection;
