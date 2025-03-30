
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getBooks } from "@/services/bookService";
import { getEvents } from "@/services/eventService";
import { Link } from "react-router-dom";

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const { data: books } = useQuery({
    queryKey: ['featuredBooks'],
    queryFn: async () => {
      const allBooks = await getBooks();
      return allBooks.slice(0, 4); // Just get the first 4 for featured
    }
  });
  
  const { data: upcomingEvents } = useQuery({
    queryKey: ['upcomingEvents'],
    queryFn: async () => {
      const allEvents = await getEvents();
      return allEvents.slice(0, 3); // Just get the first 3 for upcoming
    }
  });

  return (
    <div>
      {/* Hero Section */}
      <section className="relative py-20 px-4 my-8 rounded-xl bg-bookconnect-cream">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-serif font-bold mb-6 text-bookconnect-brown">
            Connect Through <span className="text-bookconnect-terracotta">Books</span>
          </h1>
          <p className="text-lg md:text-xl mb-8 text-bookconnect-brown/80">
            Join our community of book lovers. Discover new books, participate in events,
            and chat with others about your favorite reads.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button 
              size="lg" 
              onClick={() => navigate('/books')}
              className="bg-bookconnect-terracotta hover:bg-bookconnect-terracotta/90 text-white"
            >
              Explore Books
            </Button>
            {!user && (
              <Button 
                variant="outline" 
                size="lg" 
                onClick={() => navigate('/register')}
                className="border-bookconnect-brown text-bookconnect-brown hover:bg-bookconnect-brown/10"
              >
                Join Now
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Featured Books Section */}
      <section className="py-12">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-serif font-bold">Featured Books</h2>
          <Link to="/books" className="text-primary hover:underline">
            View all
          </Link>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {books?.map((book) => (
            <Link to={`/books/${book.id}`} key={book.id}>
              <Card className="h-full overflow-hidden book-card">
                <div className="h-56 bg-muted flex items-center justify-center">
                  {book.cover_url ? (
                    <img 
                      src={book.cover_url} 
                      alt={book.title} 
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="bg-accent/30 h-full w-full flex items-center justify-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-12 w-12 text-accent/50"
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
                <CardContent className="p-4">
                  <h3 className="font-serif font-semibold mb-1 line-clamp-1">{book.title}</h3>
                  <p className="text-sm text-muted-foreground">{book.author}</p>
                  <div className="mt-2">
                    <span className="inline-block bg-accent/30 text-accent-foreground text-xs px-2 py-1 rounded-sm">
                      {book.genre}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
          
          {!books?.length && (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground">No featured books available</p>
            </div>
          )}
        </div>
      </section>

      {/* Upcoming Events Section */}
      <section className="py-12">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-serif font-bold">Upcoming Events</h2>
          <Link to="/events" className="text-primary hover:underline">
            View all
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {upcomingEvents?.map((event) => (
            <Card key={event.id} className="overflow-hidden book-card">
              <CardContent className="p-6">
                <div className="mb-4">
                  <span className="inline-block bg-primary/10 text-primary text-sm px-3 py-1 rounded-sm">
                    {new Date(event.date).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="font-serif font-semibold text-xl mb-2">{event.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {event.description}
                </p>
              </CardContent>
            </Card>
          ))}
          
          {!upcomingEvents?.length && (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground">No upcoming events at the moment</p>
            </div>
          )}
        </div>
      </section>
      
      {/* Community Section */}
      <section className="py-12 bg-bookconnect-cream rounded-xl px-4 md:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-serif font-bold mb-4">Join Our Community</h2>
          <p className="text-lg mb-8">
            Connect with other readers, share your thoughts, and participate in book discussions in real-time.
          </p>
          <Button 
            size="lg" 
            onClick={() => user ? navigate('/books') : navigate('/register')}
            className="bg-bookconnect-terracotta hover:bg-bookconnect-terracotta/90 text-white"
          >
            {user ? 'Explore Discussions' : 'Sign Up Now'}
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Index;
