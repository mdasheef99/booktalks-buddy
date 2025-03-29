
export interface BookType {
  id: string;
  title: string;
  author?: string;
  description?: string;
  imageUrl?: string | null;
  publishedDate?: string;
  pageCount?: number;
  categories?: string[];
}
