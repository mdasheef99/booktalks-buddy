/**
 * Member Selection Grid Component
 *
 * Displays club members in a responsive grid layout for moderator selection.
 */

import React, { useState, useMemo } from 'react';
import { Search, Users, AlertCircle, Calendar } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ClubMember } from '@/lib/services/clubManagementService';
import MemberCard from './MemberCard';
import { ListAvatar } from '@/components/ui/SmartAvatar';

// =====================================================
// Types
// =====================================================

interface MemberSelectionGridProps {
  members: ClubMember[];
  selectedMember: ClubMember | null;
  onMemberSelect: (member: ClubMember) => void;
  loading?: boolean;
  error?: string | null;
}

// =====================================================
// Member Selection Grid Component
// =====================================================

const MemberSelectionGrid: React.FC<MemberSelectionGridProps> = ({
  members,
  selectedMember,
  onMemberSelect,
  loading = false,
  error = null
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Debug: Log member data to see what we're working with
  React.useEffect(() => {
    console.log('MemberSelectionGrid - Members data:', members);
    if (members.length > 0) {
      console.log('First member example:', members[0]);
    }
  }, [members]);

  // Filter members based on search query
  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) {
      return members;
    }

    const query = searchQuery.toLowerCase();
    return members.filter(member =>
      member.username.toLowerCase().includes(query) ||
      member.display_name.toLowerCase().includes(query)
    );
  }, [members, searchQuery]);

  // Loading state
  if (loading) {
    return (
      <div className="space-y-4">
        {/* Search bar skeleton */}
        <div className="relative">
          <div className="h-10 bg-gray-200 rounded-md animate-pulse"></div>
        </div>

        {/* Grid skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="border rounded-lg p-4 space-y-3">
                <div className="h-12 w-12 bg-gray-200 rounded-full mx-auto"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded mx-auto w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded mx-auto w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded mx-auto w-2/3"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  // Empty state
  if (members.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Eligible Members</h3>
        <p className="text-gray-600 max-w-md mx-auto">
          All current club members are already moderators, or there are no members to appoint.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Search members by name or username..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Results Count */}
      {searchQuery && (
        <div className="text-sm text-gray-600">
          {filteredMembers.length === 0
            ? 'No members found matching your search'
            : `${filteredMembers.length} member${filteredMembers.length === 1 ? '' : 's'} found`
          }
        </div>
      )}

      {/* Members List */}
      {filteredMembers.length === 0 && searchQuery ? (
        <div className="text-center py-8">
          <Search className="h-8 w-8 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">
            No members found matching "{searchQuery}"
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Try adjusting your search terms
          </p>
        </div>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto border border-gray-200 rounded-lg p-2 bg-gray-50 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200">
          {filteredMembers.map((member) => (
            <div
              key={member.id}
              onClick={() => onMemberSelect(member)}
              className={`
                flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-all duration-200
                hover:shadow-md hover:border-blue-300 hover:bg-blue-50
                ${selectedMember?.id === member.id
                  ? 'bg-blue-100 border-blue-500 ring-2 ring-blue-200'
                  : 'bg-white border-gray-200'
                }
              `}
            >
              {/* Avatar */}
              <div className="flex-shrink-0">
                <ListAvatar
                  profile={member as any}
                  className="border-2 border-gray-200"
                />
              </div>

              {/* Member Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900 text-base truncate">
                    {member.display_name || member.username || 'Unknown User'}
                  </h3>
                  {member.display_name && member.username && (
                    <span className="text-sm text-gray-500 font-medium">
                      @{member.username}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>Joined {new Date(member.joined_at).toLocaleDateString('en-US', {
                      month: 'short',
                      year: 'numeric'
                    })}</span>
                  </div>
                </div>
              </div>

              {/* Selection Indicator */}
              {selectedMember?.id === member.id && (
                <div className="flex-shrink-0">
                  <div className="bg-blue-500 text-white rounded-full p-2">
                    <Users className="h-4 w-4" />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Selection Summary */}
      {selectedMember && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
              <Users className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-900">
                Selected: {selectedMember.display_name || selectedMember.username}
              </p>
              <p className="text-xs text-blue-700">
                @{selectedMember.username}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberSelectionGrid;
