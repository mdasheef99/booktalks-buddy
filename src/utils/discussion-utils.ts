/**
 * Utility functions for handling discussion data
 */

interface Post {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  parent_post_id: string | null;
  topic_id?: string | null;
  updated_at?: string | null;
}

export interface ThreadedPost extends Post {
  replies: ThreadedPost[];
  depth: number;
}

/**
 * Transforms a flat array of posts into a nested tree structure
 * @param posts Flat array of posts
 * @param parentId Parent post ID to filter by (null for top-level posts)
 * @param depth Current depth level (for styling)
 * @returns Array of posts with nested replies
 */
export function buildThreadedPosts(
  posts: Post[],
  parentId: string | null = null,
  depth: number = 0
): ThreadedPost[] {
  return posts
    .filter(post => post.parent_post_id === parentId)
    .map(post => {
      // Find all replies to this post
      const replies = buildThreadedPosts(posts, post.id, depth + 1);
      
      // Return the post with its replies and depth
      return {
        ...post,
        replies,
        depth
      };
    });
}
