
import * as Sentry from "@sentry/react";
import { BookType } from "@/types/books";

// Since the API key isn't working, we'll use fallback data
const FALLBACK_BOOKS = [
  { 
    id: "fallback-1",
    title: "The White Tiger", 
    author: "Aravind Adiga", 
    description: "A darkly humorous perspective on India's class struggle in a globalized world",
    imageUrl: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=1287&auto=format&fit=crop",
    publishedDate: "2008",
    categories: ["Fiction", "Literary Fiction"]
  },
  { 
    id: "fallback-2",
    title: "Shantaram", 
    author: "Gregory David Roberts", 
    description: "An escaped convict's journey through the underworld of contemporary Bombay",
    imageUrl: "https://images.unsplash.com/photo-1532012197267-da84d127e765?q=80&w=1287&auto=format&fit=crop",
    publishedDate: "2003",
    categories: ["Fiction", "Adventure"]
  },
  { 
    id: "fallback-3",
    title: "The God of Small Things", 
    author: "Arundhati Roy", 
    description: "A story about the childhood experiences of fraternal twins whose lives are destroyed by the 'Love Laws'",
    imageUrl: "https://images.unsplash.com/photo-1541963463532-d68292c34b19?q=80&w=1288&auto=format&fit=crop",
    publishedDate: "1997",
    categories: ["Fiction", "Literary Fiction"]
  },
  { 
    id: "fallback-4",
    title: "Midnight's Children", 
    author: "Salman Rushdie", 
    description: "A magical realist novel that follows the life of a child born at the stroke of midnight as India gained its independence",
    imageUrl: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=1287&auto=format&fit=crop",
    publishedDate: "1981",
    categories: ["Fiction", "Magical Realism"]
  },
  { 
    id: "fallback-5",
    title: "Train to Pakistan", 
    author: "Khushwant Singh", 
    description: "A historical novel about the Partition of India in August 1947",
    imageUrl: "https://images.unsplash.com/photo-1558901357-ca41e027e43a?q=80&w=1289&auto=format&fit=crop",
    publishedDate: "1956",
    categories: ["Fiction", "Historical Fiction"]
  },
  // Adding Harry Potter books to the fallback data
  { 
    id: "fallback-6",
    title: "Harry Potter and the Philosopher's Stone", 
    author: "J.K. Rowling", 
    description: "The first novel in the Harry Potter series, featuring a young wizard's adventures at Hogwarts School of Witchcraft and Wizardry",
    imageUrl: "https://images.unsplash.com/photo-1626618012641-bfbca5a31239?q=80&w=1064&auto=format&fit=crop",
    publishedDate: "1997",
    categories: ["Fiction", "Fantasy", "Young Adult"]
  },
  { 
    id: "fallback-7",
    title: "Harry Potter and the Chamber of Secrets", 
    author: "J.K. Rowling", 
    description: "The second novel in the Harry Potter series, in which Harry must face a monster unleashed in the Chamber of Secrets",
    imageUrl: "https://images.unsplash.com/photo-1618666012174-83b441c0bc76?q=80&w=1287&auto=format&fit=crop",
    publishedDate: "1998",
    categories: ["Fiction", "Fantasy", "Young Adult"]
  },
  { 
    id: "fallback-8",
    title: "Harry Potter and the Prisoner of Azkaban", 
    author: "J.K. Rowling", 
    description: "The third novel in the Harry Potter series, featuring Harry's encounter with an escaped prisoner who may have ties to his past",
    imageUrl: "https://images.unsplash.com/photo-1610466025839-a609baf94ae1?q=80&w=1051&auto=format&fit=crop",
    publishedDate: "1999",
    categories: ["Fiction", "Fantasy", "Young Adult"]
  }
];

export async function fetchBooksByQuery(query: string, maxResults: number = 10): Promise<BookType[]> {
  try {
    if (!query) return [];
    
    // For now, return fallback data since the API key doesn't work
    console.log(`Searching for books with query: ${query} (using fallbacks)`);
    
    // Filter fallbacks that match the search query
    return FALLBACK_BOOKS.filter(book => 
      book.title.toLowerCase().includes(query.toLowerCase()) || 
      book.author.toLowerCase().includes(query.toLowerCase()) ||
      book.description.toLowerCase().includes(query.toLowerCase())
    ).slice(0, maxResults);
    
    /* Original API code - commented out since API key doesn't work
    const response = await fetch(
      `${BASE_URL}?q=${encodeURIComponent(query)}&maxResults=${maxResults}&key=${API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error(`Google Books API returned ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.items || data.items.length === 0) {
      return [];
    }
    
    return data.items.map((item: any) => ({
      id: item.id,
      title: item.volumeInfo.title,
      author: item.volumeInfo.authors ? item.volumeInfo.authors.join(", ") : "Unknown Author",
      description: item.volumeInfo.description || "No description available",
      imageUrl: item.volumeInfo.imageLinks?.thumbnail || null,
      publishedDate: item.volumeInfo.publishedDate,
      pageCount: item.volumeInfo.pageCount,
      categories: item.volumeInfo.categories || []
    }));
    */
  } catch (error) {
    Sentry.captureException(error);
    console.error("Error fetching books from Google Books API:", error);
    return [];
  }
}

export async function fetchTrendingBooks(genre: string, maxResults: number = 5): Promise<BookType[]> {
  try {
    // Return filtered fallback data based on genre
    console.log(`Fetching trending books for genre: ${genre} (using fallbacks)`);
    
    // Filter by genre if specified, otherwise return all fallbacks
    const filtered = genre 
      ? FALLBACK_BOOKS.filter(book => 
          book.categories.some(cat => cat.toLowerCase().includes(genre.toLowerCase()))
        )
      : FALLBACK_BOOKS;
      
    return filtered.slice(0, maxResults);
    
    /* Original API code - commented out since API key doesn't work
    // Add relevance to India and the specified genre
    const query = `${genre} subject:${genre} inauthor:indian relevance:high`;
    
    const response = await fetch(
      `${BASE_URL}?q=${encodeURIComponent(query)}&maxResults=${maxResults}&orderBy=relevance&key=${API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error(`Google Books API returned ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.items || data.items.length === 0) {
      return [];
    }
    
    return data.items.map((item: any) => ({
      id: item.id,
      title: item.volumeInfo.title,
      author: item.volumeInfo.authors ? item.volumeInfo.authors.join(", ") : "Unknown Author",
      description: item.volumeInfo.description || "No description available",
      imageUrl: item.volumeInfo.imageLinks?.thumbnail || null,
      publishedDate: item.volumeInfo.publishedDate,
      pageCount: item.volumeInfo.pageCount,
      categories: item.volumeInfo.categories || []
    }));
    */
  } catch (error) {
    Sentry.captureException(error);
    console.error("Error fetching trending books:", error);
    return FALLBACK_BOOKS.slice(0, maxResults);
  }
}
