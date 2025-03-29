
import { useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { searchBooks } from "@/services/bookService";
import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const Search = () => {
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  
  // Get query from URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const query = params.get("q") || "";
    setSearchQuery(query);
  }, [location]);
  
  // Search for books
  const { data: books, isLoading, refetch } = useQuery({
    queryKey: ['searchBooks', searchQuery],
    queryFn: () => searchBooks(searchQuery),
    enabled: !!searchQuery,
  });
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    refetch();
  };
  
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-serif font-bold mb-2">Search Results</h1>
          <p className="text-muted-foreground">
            {searchQuery ? `Results for "${searchQuery}"` : "Enter a search term to find books"}
          </p>
        </div>
        
        <form onSubmit={handleSearch} className="flex gap-2 max-w-lg">
          <Input
            type="search"
            placeholder="Search by title or author..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" disabled={!searchQuery.trim()}>
            Search
          </Button>
        </form>
        
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, index) => (
              <Card key={index} className="h-[280px] animate-pulse">
                <div className="h-56 bg-muted"></div>
                <CardContent className="p-4">
                  <div className="h-4 bg-muted rounded w-2/3 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : books?.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {books.map((book) => (
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
          </div>
        ) : searchQuery ? (
          <div className="text-center py-16">
            <h3 className="text-2xl font-serif mb-2">No results found</h3>
            <p className="text-muted-foreground">
              We couldn't find any books matching "{searchQuery}"
            </p>
          </div>
        ) : null}
      </div>
    </Layout>
  );
};

export default Search;
