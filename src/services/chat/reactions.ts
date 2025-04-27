
import { supabase } from '../base/supabaseService';

// ========== Reaction Functions ==========
export async function getMessageReactions(messageId: string): Promise<Array<{reaction: string, count: number, userReacted: boolean, username: string, users: string[]}>> {
  try {
    console.log("Fetching reactions for message:", messageId);

    // Add a cache-busting parameter to ensure we get fresh data
    const timestamp = new Date().getTime();

    // Use a direct query to ensure we get the latest data
    const { data, error } = await supabase
      .from('message_reactions')
      .select('reaction, username, created_at')
      .eq('message_id', messageId)
      .order('created_at', { ascending: false });  // Get newest reactions first

    if (error) {
      console.error("Error fetching reactions:", error);
      throw error;
    }

    if (!data || data.length === 0) {
      console.log("No reactions found for message:", messageId);
      return [];
    }

    console.log(`Found ${data.length} reactions at ${timestamp}:`, data);

    console.log("Raw reaction data:", data);

    // Group reactions and count them, ensuring each user is only counted once per emoji
    const reactionGroups: Record<string, {count: number, users: string[]}> = {};
    const userReactionTracker: Record<string, Set<string>> = {}; // Track which users have reacted with which emoji

    data.forEach((item: { reaction: string, username: string, created_at: string }) => {
      if (!reactionGroups[item.reaction]) {
        reactionGroups[item.reaction] = {
          count: 0,
          users: []
        };
        userReactionTracker[item.reaction] = new Set();
      }

      // Only count each user once per emoji
      if (!userReactionTracker[item.reaction].has(item.username)) {
        reactionGroups[item.reaction].count++;
        reactionGroups[item.reaction].users.push(item.username);
        userReactionTracker[item.reaction].add(item.username);
      }
    });

    // Get the current username to check if user reacted
    const currentUsername = localStorage.getItem('anon_username') ||
                           localStorage.getItem('username') ||
                           'Anonymous Reader';

    // Get unique reactions for the current user (in case of duplicates)
    const userReactions = [...new Set(
      data
        .filter((item: { username: string }) => item.username === currentUsername)
        .map((item: { reaction: string }) => item.reaction)
    )];

    console.log("Current user reactions:", userReactions);

    // Format the response
    const formattedReactions = Object.keys(reactionGroups).map(reaction => {
      const users = reactionGroups[reaction].users;
      return {
        reaction,
        count: users.length, // Use the actual number of users as the count
        userReacted: userReactions.includes(reaction),
        username: users[0], // Include the first username who reacted
        users: users // Include all users who reacted with this emoji
      };
    });

    console.log("Formatted reactions:", formattedReactions);

    // Log the count for each reaction
    formattedReactions.forEach(r => {
      console.log(`Reaction ${r.reaction} has ${r.count} reactions and ${r.users.length} users`);
    });
    return formattedReactions;
  } catch (error) {
    console.error("Failed to get message reactions:", error);
    return [];
  }
}

export async function addReaction(
  messageId: string,
  username: string,
  reaction: string
): Promise<boolean> {
  try {
    console.log("Adding/toggling reaction:", reaction, "for message:", messageId, "by user:", username);

    // Step 1: Check if this exact reaction exists (for toggling)
    const { data: existingReactions, error: checkError } = await supabase
      .from('message_reactions')
      .select('id')
      .eq('message_id', messageId)
      .eq('username', username)
      .eq('reaction', reaction);

    if (checkError) {
      console.error("Error checking existing reactions:", checkError);
      return false;
    }

    // If user has this reaction, remove it (toggle off)
    if (existingReactions && existingReactions.length > 0) {
      console.log("User already has this reaction, removing it (toggle off)");

      // Try to delete the reaction
      const { error: deleteError } = await supabase
        .from('message_reactions')
        .delete()
        .eq('id', existingReactions[0].id);

      if (deleteError) {
        console.error("Error removing reaction:", deleteError);
        return false;
      }

      console.log("Reaction removed successfully");
      return true;
    }

    // Step 2: Check if user has any other reactions to this message
    const { data: userReactions, error: userReactionsError } = await supabase
      .from('message_reactions')
      .select('id')
      .eq('message_id', messageId)
      .eq('username', username);

    if (userReactionsError) {
      console.error("Error checking user reactions:", userReactionsError);
      // Continue anyway, as the insert might still work
    }

    // If user has other reactions, delete them (one reaction per user)
    if (userReactions && userReactions.length > 0) {
      console.log(`User has ${userReactions.length} existing reactions, removing them`);

      for (const existingReaction of userReactions) {
        const { error: deleteError } = await supabase
          .from('message_reactions')
          .delete()
          .eq('id', existingReaction.id);

        if (deleteError) {
          console.error(`Error removing reaction ${existingReaction.id}:`, deleteError);
          // Continue with other deletions
        }
      }
    }

    // Step 3: Add the new reaction with a retry mechanism
    console.log("Adding new reaction:", reaction);

    // Try up to 3 times to insert the reaction
    let insertSuccess = false;
    let attempts = 0;
    let lastError = null;

    while (!insertSuccess && attempts < 3) {
      attempts++;

      try {
        const { error: insertError } = await supabase
          .from('message_reactions')
          .insert([{
            message_id: messageId,
            username,
            reaction,
            created_at: new Date().toISOString() // Add timestamp to ensure it's fresh
          }]);

        if (!insertError) {
          insertSuccess = true;
          console.log(`Reaction added successfully on attempt ${attempts}`);
        } else {
          lastError = insertError;
          console.warn(`Insert attempt ${attempts} failed:`, insertError);

          // If it's a unique constraint violation, we can stop trying
          if (insertError.code === '23505') {
            console.warn("Unique constraint violation - user already has a reaction");
            break;
          }

          // Wait a bit before retrying
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      } catch (e) {
        lastError = e;
        console.error(`Exception on insert attempt ${attempts}:`, e);
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }

    if (!insertSuccess) {
      console.error("Failed to add reaction after multiple attempts:", lastError);
      return false;
    }

    console.log("Reaction operation completed successfully");
    return true;
  } catch (error) {
    console.error("Failed to add/toggle reaction:", error);
    return false;
  }
}
