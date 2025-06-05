
import React from 'react';
import { useCustomQuotes } from '@/hooks/useCustomQuotes';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useSectionAnimation } from '../../hooks/useScrollAnimation';
import { cn } from '@/lib/utils';

interface QuoteSectionProps {
  storeId?: string;
}

const QuoteSection: React.FC<QuoteSectionProps> = ({ storeId }) => {
  const { currentQuote, loading, error } = useCustomQuotes(storeId);
  const { elementRef, animationClass } = useSectionAnimation('fade-scale');



  // Show skeleton loading state briefly
  if (loading) {
    return (
      <div className="py-16 md:py-20 px-4 bg-gradient-to-br from-bookconnect-sage/20 to-bookconnect-olive/10 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1550399105-c4db5fb85c18?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}></div>
        </div>
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          {/* Skeleton Quote Icon */}
          <div className="h-12 w-12 bg-bookconnect-sage/20 rounded-full mx-auto mb-6 animate-pulse"></div>

          {/* Skeleton Quote Text */}
          <div className="space-y-4 mb-6">
            <div className="h-6 w-3/4 bg-bookconnect-sage/20 rounded mx-auto animate-pulse"></div>
            <div className="h-6 w-5/6 bg-bookconnect-sage/20 rounded mx-auto animate-pulse"></div>
            <div className="h-6 w-2/3 bg-bookconnect-sage/20 rounded mx-auto animate-pulse"></div>
          </div>

          {/* Skeleton Author */}
          <div className="h-4 w-48 bg-bookconnect-sage/20 rounded mx-auto animate-pulse"></div>
        </div>
      </div>
    );
  }

  // Always show section with either custom quote or default quote
  // Show error state or fallback to default quote
  const displayQuote = currentQuote || {
    quote_text: "A reader lives a thousand lives before he dies. The man who never reads lives only one.",
    quote_author: "George R.R. Martin",
    quote_source: undefined
  };

  const isUsingDefaultQuote = !currentQuote;

  return (
    <div className="py-16 md:py-20 px-4 bg-gradient-to-br from-bookconnect-sage/20 to-bookconnect-olive/10 relative overflow-hidden">
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1550399105-c4db5fb85c18?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}></div>
      </div>
      <div ref={elementRef} className={cn("relative z-10 max-w-4xl mx-auto text-center", animationClass)}>
        <svg className="h-12 w-12 text-bookconnect-olive opacity-60 mx-auto mb-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 11C10 8.22 7.77 6 5 6V15C5 17.77 7.22 20 10 20V11Z" fill="currentColor" />
          <path d="M19 11C19 8.22 16.77 6 14 6V15C14 17.77 16.22 20 19 20V11Z" fill="currentColor" />
        </svg>

        <p className="text-xl md:text-2xl lg:text-3xl font-serif italic font-medium text-bookconnect-brown transition-opacity duration-500 leading-relaxed">
          "{displayQuote.quote_text}"
        </p>

        {(displayQuote.quote_author || displayQuote.quote_source) && (
          <div className="mt-4 text-base text-bookconnect-brown/70 leading-normal">
            — {displayQuote.quote_author}
            {displayQuote.quote_source && `, ${displayQuote.quote_source}`}
          </div>
        )}

        {isUsingDefaultQuote && (
          <div className="mt-4 text-center">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-bookconnect-sage/20 text-bookconnect-brown">
              Demo Quote - Configure your store to show custom quotes
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuoteSection;
