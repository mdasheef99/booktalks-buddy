
import * as Sentry from "@sentry/react";
import { BookType } from "@/types/books";

const API_KEY = "AIzaSyBPHTMhjoMQgWF9iCnKLXWEpuWxnHGGbDk"; // This is a public API key
const BASE_URL = "https://www.googleapis.com/books/v1/volumes";

export async function fetchBooksByQuery(query: string, maxResults: number = 10): Promise<BookType[]> {
  try {
    if (!query) return [];
    
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
  } catch (error) {
    Sentry.captureException(error);
    console.error("Error fetching books from Google Books API:", error);
    return [];
  }
}

export async function fetchTrendingBooks(genre: string, maxResults: number = 5): Promise<BookType[]> {
  try {
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
  } catch (error) {
    Sentry.captureException(error);
    console.error("Error fetching trending books:", error);
    return [];
  }
}
