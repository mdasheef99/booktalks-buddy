import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { BookAvailabilityRequestForm } from '@/components/landing/BookAvailabilityRequestForm';
import { useStoreId } from '@/hooks/useStoreId';
import { useSectionAnimation } from '@/hooks/useScrollAnimation';
import { cn } from '@/lib/utils';

/**
 * Book Request Page Component
 * Standalone page for book availability requests with informational content and form
 */
const BookRequestPage: React.FC = () => {
  const navigate = useNavigate();
  const { storeId, loading: storeIdLoading, error: storeIdError } = useStoreId();
  const { elementRef: headerRef, animationClass: headerAnimation } = useSectionAnimation('fade-up');
  const { elementRef: contentRef, animationClass: contentAnimation } = useSectionAnimation('fade-scale');

  const handleFormSuccess = () => {
    // Navigate back to landing page after successful submission
    navigate('/', { replace: true });
  };

  const handleBackToLanding = () => {
    navigate('/');
  };

  // Show loading state while storeId is being fetched
  if (storeIdLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-bookconnect-sage/10 to-bookconnect-cream/20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-bookconnect-terracotta mx-auto mb-4"></div>
          <h2 className="text-xl font-serif text-bookconnect-brown mb-2">Loading Book Request</h2>
          <p className="text-bookconnect-brown/70">Preparing the form...</p>
        </div>
      </div>
    );
  }

  // Show error state if storeId failed to load
  if (storeIdError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-bookconnect-sage/10 to-bookconnect-cream/20">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-red-500 mb-4">
            <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-serif text-bookconnect-brown mb-2">Unable to Load Store</h2>
          <p className="text-bookconnect-brown/70 mb-4">{storeIdError}</p>
          <Button onClick={handleBackToLanding} variant="outline">
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-bookconnect-cream to-bookconnect-parchment">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={handleBackToLanding}
            className="flex items-center gap-2 text-bookconnect-brown hover:text-bookconnect-terracotta hover:bg-bookconnect-brown/5"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
        </div>

        {/* Page Content */}
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div ref={headerRef} className={cn("text-center mb-12", headerAnimation)}>
            <h1 className="text-4xl md:text-5xl font-serif text-bookconnect-brown mb-4">
              Book Availability Request
            </h1>
            <p className="text-lg text-bookconnect-brown/80 max-w-2xl mx-auto leading-relaxed">
              Fill out the form below and our store owner will contact you directly if they have the book or can source it for you.
            </p>
          </div>

          {/* Form Section */}
          <div ref={contentRef} className={cn("max-w-2xl mx-auto", contentAnimation)}>
            <BookAvailabilityRequestForm
              storeId={storeId}
              onSuccess={handleFormSuccess}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookRequestPage;
