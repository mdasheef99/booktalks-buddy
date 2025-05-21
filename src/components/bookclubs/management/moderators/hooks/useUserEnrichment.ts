import { useCallback } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * Hook for enriching data with user details
 * 
 * This hook provides a function to enrich data objects that contain user_id
 * with user details from the users table.
 */
export function useUserEnrichment() {
  /**
   * Enrich data with user details
   * 
   * @param data Array of objects containing user_id
   * @returns Array of objects with added user property
   */
  const enrichWithUserData = useCallback(async (data: any[]) => {
    if (!data || data.length === 0) return [];
    
    // Extract user IDs
    const userIds = data.map(item => item.user_id);
    
    try {
      // Fetch user details
      const { data: users, error } = await supabase
        .from('users')
        .select('id, username, email')
        .in('id', userIds);
        
      if (error) {
        console.error('Error fetching user details:', error);
        // Continue with default values
      }
      
      // Combine data with user details
      return data.map(item => {
        const user = users?.find(u => u.id === item.user_id) || null;
        
        // Create default user object
        const userObj = {
          username: 'Unknown',
          email: '',
          display_name: 'Unknown User'
        };
        
        // Update with actual data if available
        if (user) {
          userObj.username = user.username || 'Unknown';
          userObj.email = user.email || '';
          userObj.display_name = user.username || 'Unknown User';
        }
        
        return {
          ...item,
          user: userObj
        };
      });
    } catch (error) {
      console.error('Error enriching data with user details:', error);
      
      // Return data with default user objects
      return data.map(item => ({
        ...item,
        user: {
          username: 'Unknown',
          email: '',
          display_name: 'Unknown User'
        }
      }));
    }
  }, []);

  return { enrichWithUserData };
}

export default useUserEnrichment;
