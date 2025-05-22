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
  is_deleted?: boolean;
  deleted_by?: string | null;
  deleted_by_moderator?: boolean;
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

/**
 * Clears all session storage related to a specific topic's collapsed states
 * @param topicId The ID of the discussion topic
 * @param sessionKeyPrefix Optional prefix for the session storage key (default: 'discussion')
 */
export function resetTopicCollapseState(topicId: string, sessionKeyPrefix: string = 'discussion'): void {
  if (typeof window === 'undefined') return;

  const sessionKey = `${sessionKeyPrefix}-${topicId}`;
  const keysToRemove: string[] = [];

  // Find all keys in session storage that match our pattern
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key && key.startsWith(sessionKey)) {
      keysToRemove.push(key);
    }
  }

  // Remove all matching keys
  keysToRemove.forEach(key => {
    sessionStorage.removeItem(key);
  });
}
