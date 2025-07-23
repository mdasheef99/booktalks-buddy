import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Search, Phone, Clock, CheckCircle } from 'lucide-react';
import { useSectionAnimation } from '@/hooks/useScrollAnimation';
import { cn } from '@/lib/utils';

interface BookAvailabilityRequestSectionProps {
  storeId: string;
}

export const BookAvailabilityRequestSection: React.FC<BookAvailabilityRequestSectionProps> = ({ storeId }) => {
  const navigate = useNavigate();
  const { elementRef: headerRef, animationClass: headerAnimation } = useSectionAnimation('fade-up');
  const { elementRef: contentRef, animationClass: contentAnimation } = useSectionAnimation('fade-scale');

  const handleRequestBookClick = () => {
    navigate('/book-request');
  };



  return (
    <section className="py-16 md:py-20 px-4 bg-gradient-to-br from-bookconnect-cream to-bookconnect-parchment">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div ref={headerRef} className={cn("text-center mb-16", headerAnimation)}>
          <h2 className="text-4xl md:text-5xl font-serif text-bookconnect-brown mb-6">
            Looking for a Specific Book?
          </h2>
          <p className="text-xl text-bookconnect-brown/80 max-w-3xl mx-auto leading-relaxed">
            Can't find the book you're looking for? Submit a book availability request and our store owner will contact you directly if they have it or can source it for you.
          </p>
        </div>

        {/* Features Grid */}
        <div ref={contentRef} className={cn("mb-12", contentAnimation)}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="text-center p-6 bg-white/60 backdrop-blur-sm rounded-xl border border-bookconnect-sage/20 hover:shadow-lg transition-all duration-300">
              <div className="w-16 h-16 bg-bookconnect-sage/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-bookconnect-brown" />
              </div>
              <h3 className="text-xl font-semibold text-bookconnect-brown mb-3">Easy Request</h3>
              <p className="text-bookconnect-brown/70 leading-relaxed">
                Simply fill out our form with the book details you're looking for. Takes just a few minutes to submit your request.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="text-center p-6 bg-white/60 backdrop-blur-sm rounded-xl border border-bookconnect-sage/20 hover:shadow-lg transition-all duration-300">
              <div className="w-16 h-16 bg-bookconnect-sage/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="h-8 w-8 text-bookconnect-brown" />
              </div>
              <h3 className="text-xl font-semibold text-bookconnect-brown mb-3">Direct Contact</h3>
              <p className="text-bookconnect-brown/70 leading-relaxed">
                Store owner will contact you directly via phone or email if they have the book or can source it for you.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="text-center p-6 bg-white/60 backdrop-blur-sm rounded-xl border border-bookconnect-sage/20 hover:shadow-lg transition-all duration-300">
              <div className="w-16 h-16 bg-bookconnect-sage/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-bookconnect-brown" />
              </div>
              <h3 className="text-xl font-semibold text-bookconnect-brown mb-3">Free Service</h3>
              <p className="text-bookconnect-brown/70 leading-relaxed">
                This is a complimentary service. No fees for submitting requests or getting information about book availability.
              </p>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="mb-12 bg-white/40 backdrop-blur-sm rounded-2xl p-8 border border-bookconnect-sage/20">
          <h3 className="text-2xl font-serif text-bookconnect-brown mb-6 text-center">How It Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-bookconnect-terracotta text-white rounded-full flex items-center justify-center mx-auto mb-3 font-bold text-lg">
                1
              </div>
              <h4 className="font-semibold text-bookconnect-brown mb-2">Submit Request</h4>
              <p className="text-sm text-bookconnect-brown/70">Fill out the form with book details</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-bookconnect-terracotta text-white rounded-full flex items-center justify-center mx-auto mb-3 font-bold text-lg">
                2
              </div>
              <h4 className="font-semibold text-bookconnect-brown mb-2">Store Review</h4>
              <p className="text-sm text-bookconnect-brown/70">Owner checks inventory and sources</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-bookconnect-terracotta text-white rounded-full flex items-center justify-center mx-auto mb-3 font-bold text-lg">
                3
              </div>
              <h4 className="font-semibold text-bookconnect-brown mb-2">Direct Contact</h4>
              <p className="text-sm text-bookconnect-brown/70">Owner contacts you with availability</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-bookconnect-terracotta text-white rounded-full flex items-center justify-center mx-auto mb-3 font-bold text-lg">
                4
              </div>
              <h4 className="font-semibold text-bookconnect-brown mb-2">Get Your Book</h4>
              <p className="text-sm text-bookconnect-brown/70">Arrange purchase or pickup</p>
            </div>
          </div>
        </div>

        {/* What to Include */}
        <div className="mb-12 bg-bookconnect-sage/10 rounded-2xl p-8 border border-bookconnect-sage/20">
          <h3 className="text-2xl font-serif text-bookconnect-brown mb-6 text-center">What to Include in Your Request</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-bookconnect-brown mb-3">Required Information:</h4>
              <ul className="space-y-2 text-bookconnect-brown/70">
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2 flex-shrink-0" />
                  Your contact information (name, email, phone)
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2 flex-shrink-0" />
                  Book title and author name
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-bookconnect-brown mb-3">Helpful Details (Optional):</h4>
              <ul className="space-y-2 text-bookconnect-brown/70">
                <li className="flex items-center">
                  <Clock className="h-4 w-4 text-bookconnect-brown/50 mr-2 flex-shrink-0" />
                  Specific edition or publication year
                </li>
                <li className="flex items-center">
                  <Clock className="h-4 w-4 text-bookconnect-brown/50 mr-2 flex-shrink-0" />
                  Publisher information
                </li>
                <li className="flex items-center">
                  <Clock className="h-4 w-4 text-bookconnect-brown/50 mr-2 flex-shrink-0" />
                  Any other identifying details
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <Button
            onClick={handleRequestBookClick}
            size="lg"
            className="bg-bookconnect-terracotta hover:bg-bookconnect-terracotta/90 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            <Search className="h-5 w-5 mr-2" />
            Request Book Availability
          </Button>

          <p className="text-sm text-bookconnect-brown/60 mt-4">
            No account required • Free service • Direct contact from store owner
          </p>
        </div>
      </div>
    </section>
  );
};

export default BookAvailabilityRequestSection;
