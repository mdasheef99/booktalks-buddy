import { supabase } from '../../supabase';
import { getUserEntitlements } from '@/lib/entitlements/cache';
import { canManageClub } from '@/lib/entitlements/permissions';
import type { CreateQuestionRequest } from '@/types/join-request-questions';
import { ClubPhotoService, type ClubPhotoData } from '@/lib/services/clubPhotoService';

/**
 * Book Club CRUD operations
 */

/**
 * Create a new book club with optional join request questions
 */
export async function createBookClub(
  userId: string,
  club: {
    name: string;
    description?: string;
    privacy?: string;
    join_questions_enabled?: boolean;
  }
) {
  if (!club.name) throw new Error('Club name is required');

  console.log('Creating book club with data:', {
    name: club.name,
    description: club.description,
    privacy: club.privacy,
    join_questions_enabled: club.join_questions_enabled,
    lead_user_id: userId,
    access_tier_required: 'free'
  });

  // Include lead_user_id which is required (NOT NULL constraint)
  const { data, error } = await supabase
    .from('book_clubs')
    .insert([{
      name: club.name,
      description: club.description,
      privacy: club.privacy,
      join_questions_enabled: club.join_questions_enabled || false,
      lead_user_id: userId,
      access_tier_required: 'free' // Default to free access tier
    }])
    .select()
    .single();

  if (error) {
    console.error('Error creating book club:', error);
    throw error;
  }

  console.log('Book club created successfully:', data);

  // Add creator as admin member
  const { error: memberError } = await supabase
    .from('club_members')
    .insert([{ user_id: userId, club_id: data.id, role: 'admin' }]);

  if (memberError) {
    console.error('Error adding creator as admin:', memberError);
    throw memberError;
  }

  return data;
}

/**
 * Create a new book club with optional photo data
 */
export async function createBookClubWithPhoto(
  userId: string,
  club: {
    name: string;
    description?: string;
    privacy?: string;
    join_questions_enabled?: boolean;
    photoData?: ClubPhotoData;
  }
) {
  if (!club.name) throw new Error('Club name is required');

  console.log('Creating book club with photo:', {
    name: club.name,
    description: club.description,
    privacy: club.privacy,
    join_questions_enabled: club.join_questions_enabled,
    hasPhoto: !!club.photoData,
    lead_user_id: userId,
    access_tier_required: 'free'
  });

  // Create club data without photo URLs initially
  const clubData = {
    name: club.name,
    description: club.description,
    privacy: club.privacy,
    join_questions_enabled: club.join_questions_enabled || false,
    lead_user_id: userId,
    access_tier_required: 'free'
  };

  const { data, error } = await supabase
    .from('book_clubs')
    .insert([clubData])
    .select()
    .single();

  if (error) {
    console.error('Error creating book club:', error);
    throw error;
  }

  console.log('Book club created successfully:', data);

  // Add creator as admin member
  const { error: memberError } = await supabase
    .from('club_members')
    .insert([{ user_id: userId, club_id: data.id, role: 'admin' }]);

  if (memberError) {
    console.error('Error adding creator as member:', memberError);
    throw memberError;
  }

  // If photo data exists, move photos from temp folder to club folder
  if (club.photoData) {
    try {
      console.log('🔄 [CLUB CREATION] Starting photo move process for club:', data.id);
      console.log('📸 [CLUB CREATION] Photo data received:', club.photoData);

      const movedPhotoData = await ClubPhotoService.movePhotosToClubFolder(data.id, club.photoData);

      console.log('✅ [CLUB CREATION] Photos moved successfully:', movedPhotoData);
      console.log('🔍 [CLUB CREATION] Final club data after photo move:', data);
    } catch (photoError) {
      console.error('❌ [CLUB CREATION] Error moving photos:', photoError);
      console.error('❌ [CLUB CREATION] Photo error details:', {
        message: photoError.message,
        stack: photoError.stack,
        clubId: data.id,
        photoData: club.photoData
      });
      // Don't fail the club creation if photo moving fails
      // The club is created successfully, just without photos
    }
  } else {
    console.log('ℹ️ [CLUB CREATION] No photo data provided for club:', data.id);
  }

  return data;
}

/**
 * Update an existing book club
 */
export async function updateBookClub(userId: string, clubId: string, updates: { name?: string; description?: string; privacy?: string }) {
  // Get user entitlements and check club management permission
  const entitlements = await getUserEntitlements(userId);

  // Get club's store ID for contextual permission checking
  const { data: club } = await supabase
    .from('book_clubs')
    .select('store_id')
    .eq('id', clubId)
    .single();

  const canManage = club ? canManageClub(entitlements, clubId, club.store_id) : false;

  if (!canManage) {
    console.log('🚨 Club update permission check failed for user:', userId);
    console.log('📍 Club ID:', clubId);
    console.log('🔑 User entitlements:', entitlements);
    throw new Error('Unauthorized: Only club administrators can update club settings');
  }

  const { data, error } = await supabase
    .from('book_clubs')
    .update(updates)
    .eq('id', clubId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete a book club and all associated data
 */
export async function deleteBookClub(userId: string, clubId: string) {
  // Get user entitlements and check club management permission
  const entitlements = await getUserEntitlements(userId);

  // Get club's store ID for contextual permission checking
  const { data: club } = await supabase
    .from('book_clubs')
    .select('store_id')
    .eq('id', clubId)
    .single();

  const canManage = club ? canManageClub(entitlements, clubId, club.store_id) : false;

  if (!canManage) {
    console.log('🚨 Club deletion permission check failed for user:', userId);
    console.log('📍 Club ID:', clubId);
    console.log('🔑 User entitlements:', entitlements);
    throw new Error('Unauthorized: Only club administrators can delete clubs');
  }

  console.log('Deleting book club:', clubId);

  // First delete all members
  console.log('Deleting club members first...');
  const { error: memberError } = await supabase
    .from('club_members')
    .delete()
    .eq('club_id', clubId);

  if (memberError) {
    console.error('Error deleting club members:', memberError);
    throw memberError;
  }

  // Then delete any discussion topics and posts
  console.log('Deleting discussion topics and posts...');
  try {
    // Get all topic IDs for this club
    const { data: topics } = await supabase
      .from('discussion_topics')
      .select('id')
      .eq('club_id', clubId);

    if (topics && topics.length > 0) {
      const topicIds = topics.map(t => t.id);

      // Delete all posts for these topics
      await supabase
        .from('discussion_posts')
        .delete()
        .in('topic_id', topicIds);

      // Delete the topics
      await supabase
        .from('discussion_topics')
        .delete()
        .eq('club_id', clubId);
    }
  } catch (error) {
    console.error('Error deleting topics/posts:', error);
    // Continue with deletion even if this fails
  }

  // Delete current book if exists
  console.log('Deleting current book if exists...');
  try {
    await supabase
      .from('current_books')
      .delete()
      .eq('club_id', clubId);
  } catch (error) {
    console.error('Error deleting current book:', error);
    // Continue with deletion even if this fails
  }

  // Finally delete the club
  console.log('Deleting the book club...');
  const { error } = await supabase
    .from('book_clubs')
    .delete()
    .eq('id', clubId);

  if (error) {
    console.error('Error deleting book club:', error);
    throw error;
  }

  console.log('Book club deleted successfully');
  return { success: true };
}

/**
 * List all book clubs a user is a member of
 */
export async function listBookClubs(userId: string) {
  console.log('[listBookClubs] called with userId:', userId);

  // First, get club IDs where user is a member (excluding pending requests)
  const { data: memberData, error: memberError } = await supabase
    .from('club_members')
    .select('club_id')
    .eq('user_id', userId)
    .not('role', 'eq', 'pending');

  console.log('[listBookClubs] memberData:', memberData, 'memberError:', memberError);

  if (memberError) throw memberError;
  const clubIds = memberData?.map((m) => m.club_id) ?? [];

  console.log('[listBookClubs] clubIds:', clubIds);

  if (clubIds.length === 0) {
    console.log('[listBookClubs] No clubs found for user');
    return [];
  }

  const { data, error } = await supabase
    .from('book_clubs')
    .select('*')
    .in('id', clubIds);

  console.log('[listBookClubs] book_clubs data:', data, 'error:', error);

  if (error) throw error;
  return data;
}

/**
 * Get details of a single club
 */
export async function getClubDetails(clubId: string) {
  const { data, error } = await supabase
    .from('book_clubs')
    .select('*')
    .eq('id', clubId)
    .single();

  if (error) throw error;
  return data;
}

// Alias for listBookClubs
export const getClubs = listBookClubs;

/**
 * Get clubs created by a user (where user is the lead)
 */
export async function getCreatedClubs(userId: string) {
  console.log('[getCreatedClubs] called with userId:', userId);

  const { data, error } = await supabase
    .from('book_clubs')
    .select('*')
    .eq('lead_user_id', userId)
    .order('created_at', { ascending: false });

  console.log('[getCreatedClubs] data:', data, 'error:', error);

  if (error) throw error;
  return data || [];
}

/**
 * Get clubs where user is a member but not the creator
 */
export async function getJoinedClubs(userId: string) {
  console.log('[getJoinedClubs] called with userId:', userId);

  // First, get club IDs where user is a member (excluding pending requests)
  const { data: memberData, error: memberError } = await supabase
    .from('club_members')
    .select('club_id')
    .eq('user_id', userId)
    .not('role', 'eq', 'pending');

  console.log('[getJoinedClubs] memberData:', memberData, 'memberError:', memberError);

  if (memberError) throw memberError;
  const clubIds = memberData?.map((m) => m.club_id) ?? [];

  if (clubIds.length === 0) {
    console.log('[getJoinedClubs] No clubs found for user');
    return [];
  }

  // Get clubs where user is member but NOT the creator
  const { data, error } = await supabase
    .from('book_clubs')
    .select('*')
    .in('id', clubIds)
    .not('lead_user_id', 'eq', userId)
    .order('created_at', { ascending: false });

  console.log('[getJoinedClubs] book_clubs data:', data, 'error:', error);

  if (error) throw error;
  return data || [];
}

/**
 * Create a new book club with initial questions in a single transaction
 */
export async function createBookClubWithQuestions(
  userId: string,
  club: {
    name: string;
    description?: string;
    privacy?: string;
    join_questions_enabled?: boolean;
  },
  questions: CreateQuestionRequest[] = []
) {
  if (!club.name) throw new Error('Club name is required');

  // Validate questions if provided
  if (questions.length > 5) {
    throw new Error('Maximum of 5 questions allowed per club');
  }

  // Validate each question
  for (const question of questions) {
    if (!question.question_text?.trim()) {
      throw new Error('All questions must have text');
    }
    if (question.question_text.length > 200) {
      throw new Error('Question text must be 200 characters or less');
    }
  }

  console.log('Creating book club with questions:', {
    name: club.name,
    description: club.description,
    privacy: club.privacy,
    join_questions_enabled: club.join_questions_enabled,
    lead_user_id: userId,
    questions_count: questions.length
  });

  try {
    // Step 1: Create the book club
    const { data: clubData, error: clubError } = await supabase
      .from('book_clubs')
      .insert([{
        name: club.name,
        description: club.description,
        privacy: club.privacy,
        join_questions_enabled: club.join_questions_enabled || false,
        lead_user_id: userId,
        access_tier_required: 'free'
      }])
      .select()
      .single();

    if (clubError) {
      console.error('Error creating book club:', clubError);
      throw clubError;
    }

    console.log('Book club created successfully:', clubData);

    // Step 2: Add creator as admin member
    const { error: memberError } = await supabase
      .from('club_members')
      .insert([{ user_id: userId, club_id: clubData.id, role: 'admin' }]);

    if (memberError) {
      console.error('Error adding creator as admin:', memberError);
      // Try to clean up the club if member creation fails
      await supabase.from('book_clubs').delete().eq('id', clubData.id);
      throw memberError;
    }

    // Step 3: Create questions if provided and questions are enabled
    if (club.join_questions_enabled && questions.length > 0) {
      console.log('Creating questions for club:', clubData.id, 'Questions:', questions);

      const questionsToInsert = questions.map((question, index) => ({
        club_id: clubData.id,
        question_text: question.question_text.trim(),
        is_required: question.is_required || false,
        display_order: index + 1
      }));

      console.log('Questions to insert:', questionsToInsert);

      const { data: insertedQuestions, error: questionsError } = await supabase
        .from('club_join_questions')
        .insert(questionsToInsert)
        .select();

      if (questionsError) {
        console.error('Error creating questions:', questionsError);
        // Try to clean up the club and membership if questions creation fails
        await supabase.from('club_members').delete().eq('club_id', clubData.id);
        await supabase.from('book_clubs').delete().eq('id', clubData.id);
        throw questionsError;
      }

      console.log('Questions created successfully:', insertedQuestions);
    }

    return clubData;
  } catch (error) {
    console.error('Error in createBookClubWithQuestions:', error);
    throw error;
  }
}
