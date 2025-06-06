import React, { useState } from 'react';
import { BookClubList } from '@/components/bookclubs/BookClubList';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Compass } from 'lucide-react';

// Component for created clubs
const CreatedClubsList: React.FC = () => {
  return <BookClubList clubType="created" />;
};

// Component for joined clubs
const JoinedClubsList: React.FC = () => {
  return <BookClubList clubType="joined" />;
};

const BookClubListPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('created');

  if (!user) {
    return <Navigate to="/login" state={{ redirectTo: "/book-club" }} />;
  }

  const handleDiscoverClubs = () => {
    navigate('/discover-clubs');
  };

  return (
    <div className="min-h-screen bg-bookconnect-cream">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <h1 className="text-4xl font-serif text-bookconnect-brown">My Book Clubs</h1>
            <Button
              onClick={handleDiscoverClubs}
              className="mt-4 md:mt-0 bg-bookconnect-terracotta hover:bg-bookconnect-terracotta/90"
            >
              <Compass className="h-4 w-4 mr-2" />
              Discover Clubs
            </Button>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="created">Created Clubs</TabsTrigger>
              <TabsTrigger value="joined">Joined Clubs</TabsTrigger>
            </TabsList>

            <TabsContent value="created">
              <CreatedClubsList />
            </TabsContent>

            <TabsContent value="joined">
              <JoinedClubsList />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default BookClubListPage;
