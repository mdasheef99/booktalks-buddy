
import { useNavigate } from "react-router-dom";
import { BookOpen, Clock, Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useSectionAnimation, useStaggeredAnimation } from "../../hooks/useScrollAnimation";
import { cn } from "@/lib/utils";

interface BookClubsSectionProps {
  handleBookClubClick: () => void;
  handleBookClubsClick: () => void;
}

const BookClubsSection = ({ handleBookClubClick, handleBookClubsClick }: BookClubsSectionProps) => {
  const { elementRef: headerRef, animationClass: headerAnimation } = useSectionAnimation('fade-up');
  const { elementRef: featuredRef, animationClass: featuredAnimation } = useSectionAnimation('fade-scale');
  const { elementRef: cardsRef, getStaggerClass } = useStaggeredAnimation(3);

  return (
    <div className="bg-bookconnect-cream py-16 md:py-20 px-4 relative">
      {/* Decorative top border */}
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-0.5 bg-gradient-to-r from-transparent via-bookconnect-sage to-transparent"></div>
      <div className="max-w-6xl mx-auto">
        <div ref={headerRef} className={cn("text-center", headerAnimation)}>
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="h-0.5 w-10 bg-bookconnect-terracotta"></div>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-bookconnect-brown text-center leading-tight">
              Book Clubs
            </h2>
            <div className="h-0.5 w-10 bg-bookconnect-terracotta"></div>
          </div>

          <p className="text-base md:text-lg text-center text-bookconnect-brown/80 mb-12 max-w-2xl mx-auto leading-relaxed">
            Connect with fellow readers, discover your next favorite book, and engage in meaningful discussions that bring stories to life
          </p>
        </div>
        
        {/* Book Club Features Section */}
        <div ref={featuredRef} className={cn("bg-gradient-to-br from-bookconnect-sage/10 to-bookconnect-cream/20 rounded-xl p-8 md:p-12 border border-bookconnect-sage/20", featuredAnimation)}>
          <div className="text-center mb-8">
            <h3 className="text-2xl md:text-3xl font-serif font-bold text-bookconnect-brown mb-4 leading-tight">
              Discover Your Next Great Read
            </h3>
            <p className="text-base md:text-lg text-bookconnect-brown/80 max-w-3xl mx-auto leading-relaxed">
              Join passionate readers in meaningful discussions, discover personalized book recommendations,
              and build lasting friendships through the power of literature.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-bookconnect-terracotta/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <BookOpen className="h-6 w-6 text-bookconnect-terracotta" />
              </div>
              <h4 className="font-serif text-lg font-semibold text-bookconnect-brown mb-2">Curated Reading Lists</h4>
              <p className="text-sm text-bookconnect-brown/70 leading-relaxed">
                Explore carefully selected books across all genres, from timeless classics to contemporary bestsellers.
              </p>
            </div>

            <div className="text-center p-4">
              <div className="w-12 h-12 bg-bookconnect-terracotta/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="h-6 w-6 text-bookconnect-terracotta" />
              </div>
              <h4 className="font-serif text-lg font-semibold text-bookconnect-brown mb-2">Vibrant Communities</h4>
              <p className="text-sm text-bookconnect-brown/70 leading-relaxed">
                Connect with like-minded readers, share insights, and participate in engaging discussions.
              </p>
            </div>

            <div className="text-center p-4">
              <div className="w-12 h-12 bg-bookconnect-terracotta/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Clock className="h-6 w-6 text-bookconnect-terracotta" />
              </div>
              <h4 className="font-serif text-lg font-semibold text-bookconnect-brown mb-2">Flexible Scheduling</h4>
              <p className="text-sm text-bookconnect-brown/70 leading-relaxed">
                Join clubs that fit your schedule with weekly, bi-weekly, or monthly meeting options.
              </p>
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center">
            <Button
              onClick={handleBookClubsClick}
              size="lg"
              className="bg-bookconnect-terracotta hover:bg-bookconnect-terracotta/90 text-white px-8 py-3 text-lg button-hover-lift focus-ring-enhanced group"
            >
              Browse Book Clubs
              <ArrowRight className="ml-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 icon-transition" />
            </Button>
            <p className="text-sm text-bookconnect-brown/60 mt-3">
              Find your perfect reading community today
            </p>
          </div>
        </div>
        
        <div ref={cardsRef} className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className={cn("bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 hover:scale-105", getStaggerClass(0))}>
            <h4 className="font-serif text-xl font-semibold mb-3 text-bookconnect-brown leading-tight">Science Fiction Club</h4>
            <p className="text-bookconnect-brown/80 mb-4 text-sm leading-relaxed">
              Explore futuristic worlds and technological wonders with fellow sci-fi enthusiasts. Join weekly discussions and discover award-winning authors.
            </p>
            <Button
              onClick={handleBookClubsClick}
              className="w-full bg-bookconnect-terracotta/10 hover:bg-bookconnect-terracotta text-bookconnect-terracotta hover:text-white button-hover-lift focus-ring-enhanced"
            >
              Learn More
            </Button>
          </div>

          <div className={cn("bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 hover:scale-105", getStaggerClass(1))}>
            <h4 className="font-serif text-xl font-semibold mb-3 text-bookconnect-brown leading-tight">Mystery Readers</h4>
            <p className="text-bookconnect-brown/80 mb-4 text-sm leading-relaxed">
              Unravel puzzles and solve crimes alongside detectives from the greatest mystery novels. Perfect for fans of Agatha Christie and modern thrillers.
            </p>
            <Button
              onClick={handleBookClubsClick}
              className="w-full bg-bookconnect-terracotta/10 hover:bg-bookconnect-terracotta text-bookconnect-terracotta hover:text-white button-hover-lift focus-ring-enhanced"
            >
              Learn More
            </Button>
          </div>

          <div className={cn("bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 hover:scale-105", getStaggerClass(2))}>
            <h4 className="font-serif text-xl font-semibold mb-3 text-bookconnect-brown leading-tight">Contemporary Fiction</h4>
            <p className="text-bookconnect-brown/80 mb-4 text-sm leading-relaxed">
              Discuss modern literary works and their reflections on today's society and culture. Explore diverse voices and contemporary storytelling.
            </p>
            <Button
              onClick={handleBookClubsClick}
              className="w-full bg-bookconnect-terracotta/10 hover:bg-bookconnect-terracotta text-bookconnect-terracotta hover:text-white button-hover-lift focus-ring-enhanced"
            >
              Learn More
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookClubsSection;
