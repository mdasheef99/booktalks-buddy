
import React from "react";
import { BookType } from "@/types/books";
import { Loader2, MessageCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface DiscussedBooksSectionProps {
  books: BookType[] | undefined;
  isLoading: boolean;
  isError: boolean;
  onJoinDiscussion: (bookId: string, bookTitle: string, bookAuthor?: string) => void;
}

const DiscussedBooksSection: React.FC<DiscussedBooksSectionProps> = ({
  books,
  isLoading,
  isError,
  onJoinDiscussion
}) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40 my-12">
        <div className="relative">
          <Loader2 className="h-12 w-12 animate-spin text-bookconnect-brown" />
          <span className="absolute -bottom-8 text-bookconnect-brown font-serif whitespace-nowrap">
            Loading discussed books...
          </span>
        </div>
      </div>
    );
  }

  if (isError || !books || books.length === 0) {
    return (
      <div className="bg-white/30 border border-bookconnect-brown/10 p-6 rounded-lg mb-12 text-center">
        <p className="text-bookconnect-brown/70 font-serif italic">No recently discussed books found.</p>
      </div>
    );
  }

  return (
    <div className="mb-12">
      <div className="flex items-center mb-4">
        <h2 className="text-2xl font-serif font-semibold text-bookconnect-brown">
          Currently Discussed Books
        </h2>
        <MessageCircle className="ml-2 h-5 w-5 text-bookconnect-sage" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {books.map((book) => (
          <Card key={book.id} className="bg-white/90 border-bookconnect-brown/10 overflow-hidden hover:shadow-md transition-shadow">
            <div className="flex p-3 h-full">
              <div className="h-24 w-16 mr-3 flex-shrink-0">
                <img
                  src={book.imageUrl || "https://images.unsplash.com/photo-1621944190310-e3cca1564bd7?q=80&w=1287&auto=format&fit=crop"}
                  alt={`Cover of ${book.title}`}
                  className="h-full w-full object-cover rounded"
                />
              </div>
              <CardContent className="p-0 flex flex-col justify-between flex-grow">
                <div>
                  <h3 className="font-serif font-medium text-sm text-bookconnect-brown line-clamp-2">
                    {book.title}
                  </h3>
                  <p className="text-xs italic text-bookconnect-brown/70 mb-1 line-clamp-1">
                    {book.author}
                  </p>
                </div>
                <div className="mt-auto">
                  <Badge className="bg-bookconnect-sage/20 text-bookconnect-sage text-xs hover:bg-bookconnect-sage/30 px-2 py-0.5">
                    Active Discussion
                  </Badge>
                  <Button 
                    onClick={() => onJoinDiscussion(book.id, book.title, book.author)}
                    variant="link" 
                    className="h-auto p-0 text-xs text-bookconnect-terracotta hover:text-bookconnect-brown mt-1"
                  >
                    Join Discussion →
                  </Button>
                </div>
              </CardContent>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default DiscussedBooksSection;
