
import { supabase, generateBookUuid } from '../base/supabaseService';

// Create a book record if it doesn't exist yet - this helps solve the foreign key constraint issue
export async function ensureBookExists(googleBooksId: string, title: string, author: string, coverUrl?: string): Promise<string> {
  const dbBookId = generateBookUuid(googleBooksId);
  
  console.log("Ensuring book exists in database:", googleBooksId, "with UUID:", dbBookId);
  
  // Check if book exists
  const { data: existingBook, error: checkError } = await supabase
    .from('books')
    .select('id, cover_url')
    .eq('id', dbBookId)
    .single();
    
  if (checkError && checkError.code !== 'PGRST116') {
    console.error("Error checking if book exists:", checkError);
  }
  
  // If book doesn't exist, create it
  if (!existingBook) {
    console.log("Book doesn't exist, creating:", title, "by", author);
    
    const { error: insertError } = await supabase
      .from('books')
      .insert([
        {
          id: dbBookId,
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
    console.log("Updating existing book with cover URL:", dbBookId);
    
    const { error: updateError } = await supabase
      .from('books')
      .update({ cover_url: coverUrl })
      .eq('id', dbBookId);
      
    if (updateError) {
      console.error("Error updating book cover:", updateError);
    }
  } else {
    console.log("Book already exists in database with ID:", dbBookId);
  }
  
  return dbBookId;
}
