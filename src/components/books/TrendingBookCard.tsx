
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp } from "lucide-react";
import { BookType } from "@/types/books";

interface TrendingBookCardProps {
  book: BookType;
  onJoinDiscussion: () => void;
}

const TrendingBookCard = ({ book, onJoinDiscussion }: TrendingBookCardProps) => {
  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg border-bookconnect-brown/20 book-card bg-white/90">
      <div className="relative h-64 overflow-hidden">
        <img
          src={book.imageUrl || "https://images.unsplash.com/photo-1621944190310-e3cca1564bd7?q=80&w=1287&auto=format&fit=crop"}
          alt={`Cover of ${book.title}`}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
        <Badge 
          className="absolute top-3 right-3 bg-bookconnect-terracotta text-white shadow-lg flex items-center gap-1 px-2.5 py-1"
          style={{ 
            boxShadow: "0 0 15px rgba(201, 124, 93, 0.7)",
            border: "1px solid rgba(255,255,255,0.2)"
          }}
        >
          <TrendingUp className="h-4 w-4" /> 
          Trending
        </Badge>
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
          className="w-full bg-bookconnect-sage hover:bg-bookconnect-sage/90"
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

export default TrendingBookCard;
