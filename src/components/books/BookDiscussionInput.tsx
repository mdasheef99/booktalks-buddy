
import React, { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface BookDiscussionInputProps {
  onSendMessage: (message: string) => Promise<void>;
}

const BookDiscussionInput: React.FC<BookDiscussionInputProps> = ({ onSendMessage }) => {
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      await onSendMessage(message);
      setMessage("");
      // Clear any previous error toast
      toast.dismiss("message-error");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message. Please try again.", {
        id: "message-error",
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
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
          disabled={isSubmitting}
          className="flex-1 p-1 bg-transparent border-none focus:outline-none font-serif text-bookconnect-brown text-sm h-7"
        />
        <Button 
          type="submit" 
          disabled={!message.trim() || isSubmitting} 
          className="bg-bookconnect-terracotta hover:bg-bookconnect-terracotta/90 text-white h-7 w-7 p-0"
        >
          {isSubmitting ? (
            <div className="h-3 w-3 border-t-transparent border-solid animate-spin rounded-full border-white border"></div>
          ) : (
            <Send className="h-3 w-3" />
          )}
        </Button>
      </div>
    </form>
  );
};

export default BookDiscussionInput;
