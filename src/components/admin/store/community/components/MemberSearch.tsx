/**
 * Member Search Component
 * Search interface for selecting store members
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Search, User, X } from 'lucide-react';
import type { MemberSearchProps, MemberSearchResultProps } from '../types/memberSpotlightTypes';
import { UI_TEXT, CSS_CLASSES } from '../constants/memberSpotlightConstants';
import { getMemberDisplayName, getMemberInitials } from '../utils/memberSpotlightUtils';
import { CommunityShowcaseAPI } from '@/lib/api/store/communityShowcase';

export const MemberSearch: React.FC<MemberSearchProps> = ({
  storeId,
  selectedMemberId,
  onMemberSelect,
  searchTerm,
  onSearchTermChange,
}) => {
  // Single query that handles both search and member lookup (like admin section)
  const {
    data: allMembers = [],
    isLoading,
    error: queryError
  } = useQuery({
    queryKey: ['store-members', storeId],
    queryFn: () => CommunityShowcaseAPI.searchStoreMembers(storeId, ''),
    enabled: !!storeId,
    staleTime: 2 * 60 * 1000, // 2 minutes - cache store members
  });

  // Client-side search filtering (like admin section)
  const filteredMembers = React.useMemo(() => {
    if (!searchTerm.trim()) {
      return []; // Show no results when no search term
    }

    if (searchTerm.length < 2) {
      return []; // Require at least 2 characters
    }

    const searchLower = searchTerm.toLowerCase();
    return allMembers.filter(member =>
      (member.username && member.username.toLowerCase().includes(searchLower)) ||
      (member.displayname && member.displayname.toLowerCase().includes(searchLower))
    );
  }, [allMembers, searchTerm]);

  const selectedMember = allMembers.find(m => m.id === selectedMemberId);
  const error = queryError ? 'Failed to load members' : null;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>{UI_TEXT.LABELS.SELECT_MEMBER} *</Label>

        {/* Selected Member Display */}
        {selectedMember && (
          <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className={CSS_CLASSES.MEMBER_AVATAR_SMALL}>
                {getMemberInitials(selectedMember)}
              </div>
              <div>
                <div className="font-medium text-gray-900">
                  {getMemberDisplayName(selectedMember)}
                </div>
                <div className="text-sm text-gray-500">
                  @{selectedMember.username} • {selectedMember.account_tier}
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onMemberSelect('')}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Search Input */}
        {!selectedMember && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={searchTerm}
              onChange={(e) => onSearchTermChange(e.target.value)}
              placeholder={UI_TEXT.PLACEHOLDERS.SEARCH_MEMBERS}
              className="pl-10"
            />
          </div>
        )}
      </div>

      {/* Search Results */}
      {!selectedMember && searchTerm && (
        <Card className="max-h-64 overflow-y-auto">
          <CardContent className="p-0">
            {searchTerm.length < 2 ? (
              <div className="p-4 text-center text-gray-500">
                Type at least 2 characters to search
              </div>
            ) : isLoading ? (
              <div className="p-4 text-center text-gray-500">
                {UI_TEXT.SEARCH_STATES.SEARCHING}
              </div>
            ) : error ? (
              <div className="p-4 text-center text-red-500">
                {error}
              </div>
            ) : filteredMembers.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                {UI_TEXT.SEARCH_STATES.NO_RESULTS}
              </div>
            ) : (
              <div className="divide-y">
                {filteredMembers.map((member) => (
                  <MemberSearchResult
                    key={member.id}
                    member={member}
                    isSelected={member.id === selectedMemberId}
                    onSelect={onMemberSelect}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Help Text */}
      {!selectedMember && !searchTerm && (
        <div className="text-sm text-gray-500">
          {UI_TEXT.SEARCH_STATES.START_TYPING}
        </div>
      )}
    </div>
  );
};

/**
 * Member Search Result Component
 */
export const MemberSearchResult: React.FC<MemberSearchResultProps> = ({
  member,
  isSelected,
  onSelect,
}) => {
  return (
    <button
      onClick={() => onSelect(member.id)}
      className={`${CSS_CLASSES.MEMBER_BUTTON} ${
        isSelected ? CSS_CLASSES.SELECTED_MEMBER : ''
      }`}
    >
      <div className="flex items-center space-x-3">
        <div className={CSS_CLASSES.MEMBER_AVATAR}>
          {getMemberInitials(member)}
        </div>
        <div className="flex-1 text-left">
          <div className="font-medium text-gray-900">
            {getMemberDisplayName(member)}
          </div>
          <div className="text-sm text-gray-500">
            @{member.username} • {member.account_tier}
          </div>
          <div className="text-xs text-gray-400">
            Joined {new Date(member.created_at).toLocaleDateString()}
          </div>
        </div>
      </div>
    </button>
  );
};

/**
 * Compact Member Search Component
 * Simplified version for smaller spaces
 */
interface CompactMemberSearchProps {
  storeId: string;
  selectedMemberId: string;
  onMemberSelect: (memberId: string) => void;
}

export const CompactMemberSearch: React.FC<CompactMemberSearchProps> = ({
  storeId,
  selectedMemberId,
  onMemberSelect,
}) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const { data: members = [], isLoading } = useMemberSearch(storeId);

  const selectedMember = members.find(m => m.id === selectedMemberId);

  return (
    <div className="space-y-2">
      {selectedMember ? (
        <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">
              {getMemberInitials(selectedMember)}
            </div>
            <span className="text-sm font-medium">
              {getMemberDisplayName(selectedMember)}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onMemberSelect('')}
            className="h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <>
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search members..."
            className="text-sm"
          />
          {searchTerm && (
            <div className="max-h-32 overflow-y-auto border rounded">
              {isLoading ? (
                <div className="p-2 text-xs text-gray-500">Searching...</div>
              ) : members.length === 0 ? (
                <div className="p-2 text-xs text-gray-500">No members found</div>
              ) : (
                members.map((member) => (
                  <button
                    key={member.id}
                    onClick={() => {
                      onMemberSelect(member.id);
                      setSearchTerm('');
                    }}
                    className="w-full p-2 text-left hover:bg-gray-50 text-sm"
                  >
                    {getMemberDisplayName(member)}
                  </button>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};


