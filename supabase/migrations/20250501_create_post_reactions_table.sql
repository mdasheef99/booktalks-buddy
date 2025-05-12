-- Create post_reactions table for discussion post reactions
CREATE TABLE IF NOT EXISTS post_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES discussion_posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    reaction_type TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS post_reactions_post_id_idx ON post_reactions(post_id);
CREATE INDEX IF NOT EXISTS post_reactions_user_id_idx ON post_reactions(user_id);

-- Add RLS policies
ALTER TABLE post_reactions ENABLE ROW LEVEL SECURITY;

-- Anyone can read reactions
CREATE POLICY "Anyone can read reactions" 
ON post_reactions FOR SELECT 
USING (true);

-- Users can add their own reactions
CREATE POLICY "Users can add their own reactions" 
ON post_reactions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own reactions
CREATE POLICY "Users can delete their own reactions" 
ON post_reactions FOR DELETE 
USING (auth.uid() = user_id);
