import React from 'react';
import { Book } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Database } from '@/integrations/supabase/types';

type CurrentBook = Database['public']['Tables']['current_books']['Row'];

interface CurrentBookSectionProps {
  currentBook: CurrentBook | null;
}

const CurrentBookSection: React.FC<CurrentBookSectionProps> = ({ currentBook }) => {
  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
        <Book className="h-5 w-5" />
        Current Book
      </h2>
      {currentBook ? (
        <div>
          <h3 className="font-medium">{currentBook.title}</h3>
          <p className="text-gray-600">by {currentBook.author}</p>
        </div>
      ) : (
        <p className="text-gray-600">No book currently selected</p>
      )}
    </Card>
  );
};

export default CurrentBookSection;
