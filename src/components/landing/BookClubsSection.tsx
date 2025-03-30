
import { useNavigate } from "react-router-dom";
import { BookOpen, Clock, Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

interface BookClubsSectionProps {
  handleBookClubClick: () => void;
  handleBookClubsClick: () => void;
}

const BookClubsSection = ({ handleBookClubClick, handleBookClubsClick }: BookClubsSectionProps) => {
  return (
    <div className="bg-bookconnect-cream py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="h-0.5 w-10 bg-bookconnect-terracotta"></div>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-bookconnect-brown text-center">
            Book Clubs
          </h2>
          <div className="h-0.5 w-10 bg-bookconnect-terracotta"></div>
        </div>
        
        <p className="text-center text-bookconnect-brown/80 mb-12 max-w-2xl mx-auto">
          Join vibrant reading communities centered around your favorite genres and authors
        </p>
        
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="flex flex-col md:flex-row">
            <div 
              className="md:w-1/2 h-64 md:h-auto relative overflow-hidden"
              style={{
                backgroundImage: "url('https://images.unsplash.com/photo-1530538987395-032d1800fdd4?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80')",
                backgroundSize: "cover",
                backgroundPosition: "center"
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-bookconnect-brown/70 to-transparent md:bg-gradient-to-r"></div>
              <div className="absolute bottom-4 left-4 md:hidden">
                <div className="bg-bookconnect-terracotta text-white px-3 py-1 rounded-full text-sm font-medium inline-flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  Featured Club
                </div>
              </div>
            </div>
            
            <div className="md:w-1/2 p-6 md:p-10">
              <div className="hidden md:flex mb-4">
                <div className="bg-bookconnect-terracotta/10 text-bookconnect-terracotta px-3 py-1 rounded-full text-sm font-medium inline-flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  Featured Book Club
                </div>
              </div>
              <h3 className="font-serif text-2xl md:text-3xl font-bold mb-4 text-bookconnect-brown">Classic Literature Club</h3>
              <div className="flex items-center mb-2">
                <BookOpen className="h-5 w-5 mr-2 text-bookconnect-terracotta" />
                <span className="text-bookconnect-brown">Currently reading: Pride and Prejudice</span>
              </div>
              <div className="flex items-center mb-4">
                <Clock className="h-5 w-5 mr-2 text-bookconnect-terracotta" />
                <span className="text-bookconnect-brown">Weekly meetings on Thursdays</span>
              </div>
              <p className="text-bookconnect-brown/80 mb-6 leading-relaxed">
                Dive into timeless classics with our passionate community of readers. From Jane Austen to Charles Dickens, we explore the rich tapestry of classic literature through thoughtful discussions and insights.
              </p>
              <Button 
                onClick={handleBookClubClick}
                size="lg"
                className="bg-bookconnect-brown hover:bg-bookconnect-brown/90 text-white px-6 group"
              >
                Join Book Club
                <ArrowRight className="ml-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </Button>
            </div>
          </div>
        </div>
        
        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md border border-bookconnect-cream/50 hover:shadow-lg transition-all duration-300">
            <h4 className="font-serif text-xl font-semibold mb-3 text-bookconnect-brown">Science Fiction Club</h4>
            <p className="text-bookconnect-brown/80 mb-4 text-sm">
              Explore futuristic worlds and technological wonders with fellow sci-fi enthusiasts.
            </p>
            <Button 
              onClick={handleBookClubsClick}
              className="w-full bg-bookconnect-terracotta/10 hover:bg-bookconnect-terracotta text-bookconnect-terracotta hover:text-white transition-all duration-300"
            >
              Learn More
            </Button>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md border border-bookconnect-cream/50 hover:shadow-lg transition-all duration-300">
            <h4 className="font-serif text-xl font-semibold mb-3 text-bookconnect-brown">Mystery Readers</h4>
            <p className="text-bookconnect-brown/80 mb-4 text-sm">
              Unravel puzzles and solve crimes alongside detectives from the greatest mystery novels.
            </p>
            <Button 
              onClick={handleBookClubsClick}
              className="w-full bg-bookconnect-terracotta/10 hover:bg-bookconnect-terracotta text-bookconnect-terracotta hover:text-white transition-all duration-300"
            >
              Learn More
            </Button>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md border border-bookconnect-cream/50 hover:shadow-lg transition-all duration-300">
            <h4 className="font-serif text-xl font-semibold mb-3 text-bookconnect-brown">Contemporary Fiction</h4>
            <p className="text-bookconnect-brown/80 mb-4 text-sm">
              Discuss modern literary works and their reflections on today's society and culture.
            </p>
            <Button 
              onClick={handleBookClubsClick}
              className="w-full bg-bookconnect-terracotta/10 hover:bg-bookconnect-terracotta text-bookconnect-terracotta hover:text-white transition-all duration-300"
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
