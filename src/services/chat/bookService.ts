
import { supabase, generateBookUuid, getBookDiscussionId, isUuid } from '../base/supabaseService';

// Create a book record if it doesn't exist yet - this helps solve the foreign key constraint issue
export async function ensureBookExists(googleBooksId: string, title: string, author: string, coverUrl?: string): Promise<string> {
  // Ensure we're using the original Google Books ID
  const originalId = isUuid(googleBooksId) ? getBookDiscussionId(googleBooksId) : googleBooksId;

  const dbBookId = generateBookUuid(originalId);

  console.log("Ensuring book exists in database:", googleBooksId, "original ID:", originalId, "with UUID:", dbBookId, "Title:", title, "Author:", author, "Cover URL:", coverUrl);

  // Check if book exists
  const { data: existingBook, error: checkError } = await supabase
    .from('books')
    .select('id, cover_url, title, author')
    .eq('id', dbBookId)
    .single();

  if (checkError && checkError.code !== 'PGRST116') {
    console.error("Error checking if book exists:", checkError);
  }

  // If book doesn't exist, create it
  if (!existingBook) {
    console.log("Book doesn't exist, creating:", title, "by", author, "with cover URL:", coverUrl);

    const { error: insertError } = await supabase
      .from('books')
      .insert([
        {
          id: dbBookId,
          google_books_id: originalId, // FIX: Store the Google Books ID
          title: title || 'Unknown Book',
          author: author || 'Unknown Author',
          genre: 'Uncategorized', // Required field
          cover_url: coverUrl || null
        }
      ]);

    if (insertError) {
      console.error("Error creating book record:", insertError);
      throw insertError;
    }

    console.log("Book created successfully with ID:", dbBookId);
  }
  // If book exists but doesn't have a cover URL and we have one now, update it
  else if (existingBook && !existingBook.cover_url && coverUrl) {
    console.log("Updating existing book with cover URL:", dbBookId, "Cover URL:", coverUrl);

    const { error: updateError } = await supabase
      .from('books')
      .update({ cover_url: coverUrl })
      .eq('id', dbBookId);

    if (updateError) {
      console.error("Error updating book cover:", updateError);
    } else {
      console.log("Successfully updated book cover URL for ID:", dbBookId);
    }
  } else {
    console.log("Book already exists in database with ID:", dbBookId, "Existing cover URL:", existingBook?.cover_url);

    // If we have a different cover URL than what's stored, update it
    if (existingBook && existingBook.cover_url !== coverUrl && coverUrl) {
      console.log("Updating book with new cover URL:", coverUrl);

      const { error: updateError } = await supabase
        .from('books')
        .update({ cover_url: coverUrl })
        .eq('id', dbBookId);

      if (updateError) {
        console.error("Error updating book cover with new URL:", updateError);
      } else {
        console.log("Successfully updated book with new cover URL for ID:", dbBookId);
      }
    }
  }

  return dbBookId;
}
