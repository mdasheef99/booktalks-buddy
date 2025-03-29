import { supabase } from '../base/supabaseService';

// ========== Reaction Functions ==========
export async function getMessageReactions(messageId: string): Promise<Array<{reaction: string, count: number, userReacted: boolean, username: string}>> {
  try {
    console.log("Fetching reactions for message:", messageId);
    const { data, error } = await supabase
      .from('message_reactions')
      .select('reaction, username')
      .eq('message_id', messageId);
      
    if (error) {
      console.error("Error fetching reactions:", error);
      throw error;
    }
    
    if (!data || data.length === 0) {
      console.log("No reactions found for message:", messageId);
      return [];
    }
    
    console.log("Raw reaction data:", data);
    
    // Group reactions and count them
    const reactionGroups: Record<string, {count: number, users: string[]}> = {};
    
    data.forEach((item) => {
      if (!reactionGroups[item.reaction]) {
        reactionGroups[item.reaction] = {
          count: 0,
          users: []
        };
      }
      
      reactionGroups[item.reaction].count++;
      reactionGroups[item.reaction].users.push(item.username);
    });
    
    // Get the current username to check if user reacted
    const currentUsername = localStorage.getItem('anon_username') || 
                           localStorage.getItem('username') || 
                           'Anonymous Reader';
    
    // Format the response
    const formattedReactions = Object.keys(reactionGroups).map(reaction => ({
      reaction,
      count: reactionGroups[reaction].count,
      userReacted: reactionGroups[reaction].users.includes(currentUsername),
      username: reactionGroups[reaction].users[0] // Include the first username who reacted
    }));
    
    console.log("Formatted reactions:", formattedReactions);
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
    
    // First check if user already reacted with this emoji
    const { data: existingReaction, error: checkError } = await supabase
      .from('message_reactions')
      .select('id')
      .eq('message_id', messageId)
      .eq('username', username)
      .eq('reaction', reaction)
      .maybeSingle();
      
    if (checkError) {
      console.error("Error checking existing reaction:", checkError);
      throw checkError;
    }
    
    // If reaction already exists, remove it (toggle behavior)
    if (existingReaction) {
      console.log("Removing existing reaction:", existingReaction.id);
      const { error: deleteError } = await supabase
        .from('message_reactions')
        .delete()
        .eq('id', existingReaction.id);
        
      if (deleteError) {
        console.error("Error removing reaction:", deleteError);
        throw deleteError;
      }
      
      return true;
    }
    
    // Otherwise, add the reaction
    console.log("Adding new reaction");
    const { error: insertError } = await supabase
      .from('message_reactions')
      .insert([{
        message_id: messageId,
        username,
        reaction
      }]);
      
    if (insertError) {
      console.error("Error adding reaction:", insertError);
      throw insertError;
    }
    
    console.log("Reaction added successfully");
    return true;
  } catch (error) {
    console.error("Failed to add/toggle reaction:", error);
    return false;
  }
}
