
import { apiCall, supabase, Book } from '@/lib/supabase';

export async function getBooks(): Promise<Book[]> {
  const result = await apiCall<Book[]>(
    supabase.from('books').select('*').order('title'),
    'Failed to load books'
  );
  return result || [];
}

export async function getBookById(id: string): Promise<Book | null> {
  return await apiCall<Book>(
    supabase.from('books').select('*').eq('id', id).single(),
    'Failed to load book details'
  );
}

export async function searchBooks(query: string): Promise<Book[]> {
  const result = await apiCall<Book[]>(
    supabase
      .from('books')
      .select('*')
      .or(`title.ilike.%${query}%,author.ilike.%${query}%`)
      .order('title'),
    'Failed to search books'
  );
  return result || [];
}
