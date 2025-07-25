
import { supabase } from '../base/supabaseService';

// ========== Reaction Functions ==========
export async function getMessageReactions(messageId: string): Promise<Array<{reaction: string, count: number, userReacted: boolean, username: string, users: string[]}>> {
  try {
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
      return [];
    }

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

    if (existingReactions && existingReactions.length > 0) {
      const { error: deleteError } = await supabase
        .from('message_reactions')
        .delete()
        .eq('id', existingReactions[0].id);

      if (deleteError) {
        console.error("Error removing reaction:", deleteError);
        return false;
      }

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
    }

    if (userReactions && userReactions.length > 0) {

      for (const existingReaction of userReactions) {
        const { error: deleteError } = await supabase
          .from('message_reactions')
          .delete()
          .eq('id', existingReaction.id);

        if (deleteError) {
          console.error(`Error removing reaction ${existingReaction.id}:`, deleteError);
        }
      }
    }


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
            created_at: new Date().toISOString()
          }]);

        if (!insertError) {
          insertSuccess = true;
        } else {
          lastError = insertError;

          if (insertError.code === '23505') {
            break;
          }
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      } catch (e) {
        lastError = e;
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }

    if (!insertSuccess) {
      console.error("Failed to add reaction after multiple attempts:", lastError);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Failed to add/toggle reaction:", error);
    return false;
  }
}
