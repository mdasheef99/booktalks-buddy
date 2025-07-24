import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BookOpen, DollarSign, Clock, CheckCircle } from 'lucide-react';
import { useSectionAnimation } from '@/hooks/useScrollAnimation';
import { cn } from '@/lib/utils';

interface BookListingSectionProps {
  storeId: string;
}

export const BookListingSection: React.FC<BookListingSectionProps> = ({ storeId }) => {
  const navigate = useNavigate();
  const { elementRef: headerRef, animationClass: headerAnimation } = useSectionAnimation('fade-up');
  const { elementRef: contentRef, animationClass: contentAnimation } = useSectionAnimation('fade-scale');

  const handleListBooksClick = () => {
    navigate('/book-listing');
  };



  return (
    <section className="py-16 md:py-20 px-4 bg-gradient-to-br from-bookconnect-cream to-bookconnect-parchment relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1481627834876-b7833e8f5570?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Section Header */}
        <div ref={headerRef} className={cn("text-center mb-12", headerAnimation)}>
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-bookconnect-terracotta/20 text-bookconnect-brown text-sm font-medium mb-6">
            <DollarSign className="h-4 w-4 mr-2" />
            Sell Your Books
          </div>
          
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-bookconnect-brown mb-6 leading-tight">
            Turn Your Books Into <span className="relative">Cash
              <span className="absolute bottom-1 left-0 w-full h-2 bg-bookconnect-terracotta/40"></span>
            </span>
          </h2>
          
          <p className="text-lg md:text-xl text-bookconnect-brown/80 max-w-3xl mx-auto leading-relaxed">
            Have books you no longer need? We're always looking for quality second-hand books to add to our collection. 
            Submit your books for review and we'll contact you directly.
          </p>
        </div>

        {/* Features Grid */}
        <div ref={contentRef} className={cn("mb-12", contentAnimation)}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="text-center p-6 bg-white/60 backdrop-blur-sm rounded-xl border border-bookconnect-sage/20 hover:shadow-lg transition-all duration-300">
              <div className="w-16 h-16 bg-bookconnect-sage/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="h-8 w-8 text-bookconnect-brown" />
              </div>
              <h3 className="text-xl font-semibold text-bookconnect-brown mb-3">Easy Submission</h3>
              <p className="text-bookconnect-brown/70 leading-relaxed">
                Simply fill out our form with your book details and upload photos. The process takes just a few minutes.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="text-center p-6 bg-white/60 backdrop-blur-sm rounded-xl border border-bookconnect-sage/20 hover:shadow-lg transition-all duration-300">
              <div className="w-16 h-16 bg-bookconnect-terracotta/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-bookconnect-brown" />
              </div>
              <h3 className="text-xl font-semibold text-bookconnect-brown mb-3">Quick Review</h3>
              <p className="text-bookconnect-brown/70 leading-relaxed">
                Our team reviews submissions promptly and contacts you directly with our decision and next steps.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="text-center p-6 bg-white/60 backdrop-blur-sm rounded-xl border border-bookconnect-sage/20 hover:shadow-lg transition-all duration-300">
              <div className="w-16 h-16 bg-bookconnect-olive/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-bookconnect-brown" />
              </div>
              <h3 className="text-xl font-semibold text-bookconnect-brown mb-3">Fair Prices</h3>
              <p className="text-bookconnect-brown/70 leading-relaxed">
                We offer competitive prices for quality books and handle all the details once we accept your submission.
              </p>
            </div>
          </div>
        </div>

        {/* What We're Looking For */}
        <div className="mb-12 bg-white/80 backdrop-blur-sm rounded-xl p-8 border border-bookconnect-sage/20">
          <h3 className="text-2xl font-semibold text-bookconnect-brown mb-6 text-center">
            What We're Looking For
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4 className="text-lg font-semibold text-bookconnect-brown mb-3">✓ We Accept</h4>
              <ul className="space-y-2 text-bookconnect-brown/80">
                <li>• Fiction and non-fiction books</li>
                <li>• Textbooks and academic books</li>
                <li>• Children's and young adult books</li>
                <li>• Collectible and rare books</li>
                <li>• Books in good to excellent condition</li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold text-bookconnect-brown mb-3">✗ We Don't Accept</h4>
              <ul className="space-y-2 text-bookconnect-brown/80">
                <li>• Books with significant damage</li>
                <li>• Outdated textbooks (older than 5 years)</li>
                <li>• Books with missing pages</li>
                <li>• Heavily marked or highlighted books</li>
                <li>• Magazines and periodicals</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <Button
            onClick={handleListBooksClick}
            size="lg"
            className="bg-bookconnect-terracotta hover:bg-bookconnect-terracotta/90 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            <BookOpen className="h-5 w-5 mr-2" />
            List Your Books Now
          </Button>
          
          <p className="text-sm text-bookconnect-brown/60 mt-4">
            No account required • Free to submit • Direct contact from store owner
          </p>
        </div>
      </div>
    </section>
  );
};

export default BookListingSection;
