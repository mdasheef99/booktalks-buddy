
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookType } from "@/types/books";
import { useNavigate } from "react-router-dom";

interface BookCardProps {
  book: BookType;
  onJoinDiscussion: () => void;
}

const BookCard = ({ book, onJoinDiscussion }: BookCardProps) => {
  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg border-bookconnect-brown/20 book-card bg-white/90">
      <div className="relative h-96 overflow-hidden bg-white">
        <img
          src={book.imageUrl || "https://images.unsplash.com/photo-1621944190310-e3cca1564bd7?q=80&w=1287&auto=format&fit=crop"}
          alt={`Cover of ${book.title}`}
          className="w-full h-full object-contain"
          loading="lazy"
          style={{
            maxHeight: "100%",
            maxWidth: "100%"
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none"></div>
      </div>
      <CardContent className="p-4">
        <h3 className="font-serif font-bold text-lg text-bookconnect-brown line-clamp-2 mb-2">
          {book.title}
        </h3>
        <p className="text-sm italic text-bookconnect-brown/70 mb-3">
          by {book.author || "Unknown Author"}
        </p>
        <p className="text-sm text-bookconnect-brown/80 line-clamp-3 mb-4 h-12">
          {book.description || "No description available."}
        </p>
        <Button 
          onClick={onJoinDiscussion}
          className="w-full bg-bookconnect-terracotta hover:bg-bookconnect-terracotta/90"
          style={{ 
            clipPath: "polygon(0 0, 100% 0, 95% 100%, 5% 100%)",
            padding: "0.5rem 1.5rem"
          }}
        >
          Join Discussion
        </Button>
      </CardContent>
    </Card>
  );
};

export default BookCard;
