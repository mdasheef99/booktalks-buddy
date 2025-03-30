
import { useNavigate } from "react-router-dom";
import { Calendar, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EventsSectionProps {
  handleEventsClick: () => void;
}

const EventsSection = ({ handleEventsClick }: EventsSectionProps) => {
  return (
    <div className="bg-bookconnect-parchment py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="h-0.5 w-10 bg-bookconnect-terracotta"></div>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-bookconnect-brown text-center">
            Events
          </h2>
          <div className="h-0.5 w-10 bg-bookconnect-terracotta"></div>
        </div>
        
        <p className="text-center text-bookconnect-brown/80 mb-12 max-w-2xl mx-auto">
          Join literary events, author meet-ups, and book festivals happening in your community
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white rounded-lg shadow-md overflow-hidden group hover:shadow-xl transition-all duration-300">
            <div className="h-48 bg-bookconnect-sage/20 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-bookconnect-brown/30"></div>
              <div className="absolute bottom-4 left-4">
                <div className="bg-bookconnect-terracotta text-white px-3 py-1 rounded-full text-sm font-medium">
                  Upcoming
                </div>
              </div>
            </div>
            <div className="p-6">
              <h3 className="font-serif text-xl font-semibold mb-2 text-bookconnect-brown">Author Reading: Jane Austen</h3>
              <div className="flex items-center text-bookconnect-brown/70 mb-2">
                <Calendar className="h-4 w-4 mr-2" />
                <span className="text-sm">October 15, 2023</span>
              </div>
              <div className="flex items-center text-bookconnect-brown/70 mb-4">
                <MapPin className="h-4 w-4 mr-2" />
                <span className="text-sm">City Library, Downtown</span>
              </div>
              <p className="text-bookconnect-brown/80 text-sm mb-4">
                Join us for a special reading and discussion of Jane Austen's classic works and their impact on modern literature.
              </p>
              <Button
                onClick={handleEventsClick}
                variant="outline"
                className="w-full border-bookconnect-brown text-bookconnect-brown hover:bg-bookconnect-terracotta hover:text-white hover:border-bookconnect-terracotta transition-all duration-300"
              >
                View Details
              </Button>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md overflow-hidden group hover:shadow-xl transition-all duration-300">
            <div className="h-48 bg-bookconnect-olive/20 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-bookconnect-brown/30"></div>
              <div className="absolute bottom-4 left-4">
                <div className="bg-bookconnect-terracotta text-white px-3 py-1 rounded-full text-sm font-medium">
                  Popular
                </div>
              </div>
            </div>
            <div className="p-6">
              <h3 className="font-serif text-xl font-semibold mb-2 text-bookconnect-brown">Poetry Night</h3>
              <div className="flex items-center text-bookconnect-brown/70 mb-2">
                <Calendar className="h-4 w-4 mr-2" />
                <span className="text-sm">October 22, 2023</span>
              </div>
              <div className="flex items-center text-bookconnect-brown/70 mb-4">
                <MapPin className="h-4 w-4 mr-2" />
                <span className="text-sm">Cozy Cafe, Art District</span>
              </div>
              <p className="text-bookconnect-brown/80 text-sm mb-4">
                An evening of poetry readings from both published and amateur poets, featuring works from various genres and styles.
              </p>
              <Button
                onClick={handleEventsClick}
                variant="outline"
                className="w-full border-bookconnect-brown text-bookconnect-brown hover:bg-bookconnect-terracotta hover:text-white hover:border-bookconnect-terracotta transition-all duration-300"
              >
                View Details
              </Button>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md overflow-hidden group hover:shadow-xl transition-all duration-300">
            <div className="h-48 bg-bookconnect-cream/60 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-bookconnect-brown/30"></div>
              <div className="absolute bottom-4 left-4">
                <div className="bg-bookconnect-terracotta text-white px-3 py-1 rounded-full text-sm font-medium">
                  Featured
                </div>
              </div>
            </div>
            <div className="p-6">
              <h3 className="font-serif text-xl font-semibold mb-2 text-bookconnect-brown">Book Festival</h3>
              <div className="flex items-center text-bookconnect-brown/70 mb-2">
                <Calendar className="h-4 w-4 mr-2" />
                <span className="text-sm">November 5-7, 2023</span>
              </div>
              <div className="flex items-center text-bookconnect-brown/70 mb-4">
                <MapPin className="h-4 w-4 mr-2" />
                <span className="text-sm">City Convention Center</span>
              </div>
              <p className="text-bookconnect-brown/80 text-sm mb-4">
                A three-day celebration of literature with author signings, panel discussions, workshops, and a book fair.
              </p>
              <Button
                onClick={handleEventsClick}
                variant="outline"
                className="w-full border-bookconnect-brown text-bookconnect-brown hover:bg-bookconnect-terracotta hover:text-white hover:border-bookconnect-terracotta transition-all duration-300"
              >
                View All Events
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventsSection;
