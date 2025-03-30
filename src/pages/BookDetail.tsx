
import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getBookById } from "@/services/bookService";
import { getBookChat, sendChatMessage, subscribeToChat, ChatMessage } from "@/services/chatService";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import * as Sentry from "@sentry/react";

const BookDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [messageInput, setMessageInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch book details
  const { data: book, isLoading, error } = useQuery({
    queryKey: ['book', id],
    queryFn: () => id ? getBookById(id) : null,
    enabled: !!id,
  });

  // Fetch chat messages
  const { data: initialMessages } = useQuery({
    queryKey: ['bookChat', id],
    queryFn: () => id ? getBookChat(id) : [],
    enabled: !!id,
  });

  // Update chat messages when initial messages are loaded
  useEffect(() => {
    if (initialMessages) {
      setChatMessages(initialMessages);
    }
  }, [initialMessages]);

  // Subscribe to chat messages
  useEffect(() => {
    if (!id) return;
    
    const subscription = subscribeToChat(id, (newMessage) => {
      setChatMessages((prev) => [...prev, newMessage as ChatMessage]);
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, [id]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!messageInput.trim() || !id) return;
    
    try {
      if (!user) {
        toast.error("You need to sign in to send messages");
        navigate("/login");
        return;
      }
      
      await sendChatMessage(
        messageInput,
        id,
        user.username || user.email,
        user.id
      );
      
      setMessageInput("");
    } catch (error) {
      console.error("Error sending message:", error);
      Sentry.captureException(error);
      toast.error("Failed to send message. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-10 w-1/3 bg-muted rounded"></div>
        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-1/3 h-80 bg-muted rounded"></div>
          <div className="w-full md:w-2/3 space-y-4">
            <div className="h-6 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-full"></div>
            <div className="h-4 bg-muted rounded w-full"></div>
            <div className="h-4 bg-muted rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="text-center py-16">
        <h2 className="text-3xl font-serif mb-4">Book not found</h2>
        <p className="text-muted-foreground mb-6">
          We couldn't find the book you're looking for.
        </p>
        <Button onClick={() => navigate('/books')}>
          Browse all books
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button
        variant="outline"
        onClick={() => navigate(-1)}
        className="mb-4"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4 mr-2"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 19l-7-7m0 0l7-7m-7 7h18"
          />
        </svg>
        Back
      </Button>

      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-1/3">
          {book.cover_url ? (
            <img 
              src={book.cover_url} 
              alt={book.title} 
              className="w-full h-auto rounded-md shadow-md object-cover"
            />
          ) : (
            <div className="bg-accent/30 h-80 w-full rounded-md shadow-md flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-20 w-20 text-accent/50"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
          )}
        </div>
        
        <div className="w-full md:w-2/3">
          <h1 className="text-3xl md:text-4xl font-serif font-bold mb-2">{book.title}</h1>
          <p className="text-xl text-muted-foreground mb-4">by {book.author}</p>
          
          <div className="mb-6">
            <span className="inline-block bg-accent/30 text-accent-foreground px-3 py-1 rounded-sm text-sm">
              {book.genre}
            </span>
          </div>
          
          <Tabs defaultValue="discussion" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="discussion">Discussion</TabsTrigger>
              <TabsTrigger value="description">Description</TabsTrigger>
            </TabsList>
            
            <TabsContent value="discussion" className="space-y-4">
              <Card>
                <CardContent className="p-4">
                  <div className="chat-container flex flex-col">
                    <ScrollArea className="flex-1 h-[400px] pr-4">
                      {chatMessages.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-center p-4">
                          <div>
                            <h3 className="font-serif font-medium mb-2">No messages yet</h3>
                            <p className="text-muted-foreground text-sm">
                              Be the first to start the discussion about this book!
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {chatMessages.map((msg) => (
                            <div key={msg.id} className={`flex ${msg.user_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                              <div 
                                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                                  msg.user_id === user?.id 
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted'
                                }`}
                              >
                                <div className="flex items-baseline justify-between gap-2 mb-1">
                                  <p className={`text-xs font-medium ${
                                    msg.user_id === user?.id ? 'text-primary-foreground/80' : 'text-muted-foreground'
                                  }`}>
                                    {msg.username}
                                  </p>
                                  <p className={`text-xs ${
                                    msg.user_id === user?.id ? 'text-primary-foreground/70' : 'text-muted-foreground'
                                  }`}>
                                    {new Date(msg.timestamp).toLocaleTimeString([], {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </p>
                                </div>
                                <p>{msg.message}</p>
                              </div>
                            </div>
                          ))}
                          <div ref={messagesEndRef} />
                        </div>
                      )}
                    </ScrollArea>
                    
                    <form onSubmit={handleSendMessage} className="mt-4 flex gap-2">
                      <Input
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        placeholder={user ? "Type your message..." : "Sign in to join the discussion"}
                        disabled={!user}
                        className="flex-1"
                      />
                      <Button type="submit" disabled={!user || !messageInput.trim()}>
                        Send
                      </Button>
                    </form>
                  </div>
                </CardContent>
              </Card>
              
              {!user && (
                <div className="text-center py-2">
                  <Button variant="link" onClick={() => navigate('/login')}>
                    Sign in to join the discussion
                  </Button>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="description">
              <Card>
                <CardContent className="p-6">
                  <p className="text-muted-foreground italic">
                    No description available for this book.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default BookDetail;
