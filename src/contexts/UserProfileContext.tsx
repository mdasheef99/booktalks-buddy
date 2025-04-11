import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getUserProfiles, UserProfile } from '@/services/profileService';

interface UserProfileContextType {
  profiles: Map<string, UserProfile>;
  loadProfiles: (userIds: string[]) => Promise<void>;
  getProfile: (userId: string) => UserProfile | undefined;
  isLoading: boolean;
}

const UserProfileContext = createContext<UserProfileContextType>({
  profiles: new Map(),
  loadProfiles: async () => {},
  getProfile: () => undefined,
  isLoading: false,
});

export const useUserProfiles = () => useContext(UserProfileContext);

interface UserProfileProviderProps {
  children: ReactNode;
}

export const UserProfileProvider: React.FC<UserProfileProviderProps> = ({ children }) => {
  const [profiles, setProfiles] = useState<Map<string, UserProfile>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

  // Load profiles for a list of user IDs
  const loadProfiles = async (userIds: string[]) => {
    // Filter out IDs that are already loaded or pending
    const newIds = userIds.filter(id => !profiles.has(id) && !pendingIds.has(id));
    
    if (newIds.length === 0) return;
    
    // Add new IDs to pending set
    setPendingIds(prev => {
      const updated = new Set(prev);
      newIds.forEach(id => updated.add(id));
      return updated;
    });
    
    setIsLoading(true);
    
    try {
      const fetchedProfiles = await getUserProfiles(newIds);
      
      setProfiles(prev => {
        const updated = new Map(prev);
        fetchedProfiles.forEach((profile, id) => {
          updated.set(id, profile);
        });
        return updated;
      });
    } catch (error) {
      console.error('Error loading profiles:', error);
    } finally {
      setIsLoading(false);
      
      // Remove IDs from pending set
      setPendingIds(prev => {
        const updated = new Set(prev);
        newIds.forEach(id => updated.delete(id));
        return updated;
      });
    }
  };
  
  // Get a profile by user ID
  const getProfile = (userId: string): UserProfile | undefined => {
    return profiles.get(userId);
  };
  
  const value = {
    profiles,
    loadProfiles,
    getProfile,
    isLoading,
  };
  
  return (
    <UserProfileContext.Provider value={value}>
      {children}
    </UserProfileContext.Provider>
  );
};

// Custom hook for efficiently loading profiles for a list of items
export function useLoadProfiles<T>(
  items: T[] | undefined,
  getUserId: (item: T) => string
) {
  const { loadProfiles, isLoading } = useUserProfiles();
  
  useEffect(() => {
    if (!items || items.length === 0) return;
    
    const userIds = items.map(item => getUserId(item));
    loadProfiles(userIds);
  }, [items, getUserId, loadProfiles]);
  
  return { isLoading };
}
