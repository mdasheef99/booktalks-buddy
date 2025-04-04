
export interface BookType {
  id: string;       // Original Google Books ID or other source ID
  uuid?: string;    // Database UUID (if available)
  title: string;
  author?: string;
  description?: string;
  imageUrl?: string | null;
  publishedDate?: string;
  pageCount?: number;
  categories?: string[];
}
