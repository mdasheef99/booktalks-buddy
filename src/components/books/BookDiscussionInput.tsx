
import React, { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BookDiscussionInputProps {
  onSendMessage: (message: string) => void;
}

const BookDiscussionInput: React.FC<BookDiscussionInputProps> = ({ onSendMessage }) => {
  const [message, setMessage] = useState("");
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message);
      setMessage("");
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-1 border border-bookconnect-brown/20">
      <div className="flex items-center">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Share your thoughts..."
          className="flex-1 p-1 bg-transparent border-none focus:outline-none font-serif text-bookconnect-brown text-sm h-7"
        />
        <Button 
          type="submit" 
          disabled={!message.trim()} 
          className="bg-bookconnect-terracotta hover:bg-bookconnect-terracotta/90 text-white h-7 w-7 p-0"
        >
          <Send className="h-3 w-3" />
        </Button>
      </div>
    </form>
  );
};

export default BookDiscussionInput;
