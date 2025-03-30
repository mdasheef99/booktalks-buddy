
import React from 'react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import BookConnectHeader from '@/components/BookConnectHeader';
import { Bookmark, Users, Calendar } from 'lucide-react';

const BookClub: React.FC = () => {
  const { user, session } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!session) {
      navigate('/');
    }
  }, [session, navigate]);

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-[#f5f0e6]" style={{
      backgroundImage: "url('https://images.unsplash.com/photo-1581431886815-f600e88e3abd?ixlib=rb-1.2.1&auto=format&fit=crop&q=80&w=1200')",
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundBlendMode: "overlay",
    }}>
      <BookConnectHeader />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto bg-[#f0e6d2]/90 p-8 rounded-lg shadow-lg border border-[#5c4033]/20 backdrop-blur-sm">
          <h1 className="text-4xl font-serif text-[#5c4033] mb-6 text-center">
            <Users className="inline-block mr-2 mb-1" /> Book Club
          </h1>
          
          <div className="bg-[#fff]/60 p-6 rounded-lg mb-8 border border-[#5c4033]/10">
            <h2 className="text-2xl font-serif text-[#5c4033] mb-4">Welcome, {user.username || user.email?.split('@')[0]}!</h2>
            <p className="text-[#5c4033]/80">
              Join our exclusive book club to discuss classics, new releases, and everything in between. 
              Connect with fellow book lovers, share insights, and expand your reading horizons.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#fff]/60 p-6 rounded-lg border border-[#5c4033]/10">
              <h3 className="text-xl font-serif text-[#5c4033] mb-3 flex items-center">
                <Bookmark className="mr-2" /> Current Readings
              </h3>
              <ul className="space-y-2 text-[#5c4033]/80">
                <li>"The Great Gatsby" by F. Scott Fitzgerald</li>
                <li>"Pride and Prejudice" by Jane Austen</li>
                <li>"The Metamorphosis" by Franz Kafka</li>
                <li>"The Midnight Library" by Matt Haig</li>
              </ul>
            </div>
            
            <div className="bg-[#fff]/60 p-6 rounded-lg border border-[#5c4033]/10">
              <h3 className="text-xl font-serif text-[#5c4033] mb-3 flex items-center">
                <Calendar className="mr-2" /> Upcoming Discussions
              </h3>
              <ul className="space-y-2 text-[#5c4033]/80">
                <li>May 15 - "The Great Gatsby" themes and symbolism</li>
                <li>May 22 - Character analysis: Elizabeth Bennet</li>
                <li>May 29 - Kafka's use of metaphor</li>
                <li>June 5 - "The Midnight Library": regrets and choices</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookClub;
