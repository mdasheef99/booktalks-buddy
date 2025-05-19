/**
 * Shared type definitions for book clubs
 */

/**
 * Represents a book that has been nominated
 */
export interface NominatedBook {
  id: string;
  google_books_id: string;
  title: string;
  author: string;
  cover_url: string | null;
  description: string | null;
  genre: string | null;
}

/**
 * Represents a book nomination in a book club
 */
export interface Nomination {
  id: string;
  club_id: string;
  book_id: string;
  nominated_by: string;
  status: 'active' | 'selected' | 'archived';
  nominated_at: string;
  book: NominatedBook;
  like_count: number;
  user_has_liked?: boolean;
}

/**
 * Represents a like on a book nomination
 */
export interface Like {
  nomination_id: string;
  user_id: string;
  created_at: string;
}
