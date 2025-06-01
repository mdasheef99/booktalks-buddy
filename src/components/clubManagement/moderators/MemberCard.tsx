/**
 * Member Card Component
 *
 * Displays individual club member information in a selectable card format.
 */

import React from 'react';
import { User, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { ClubMember } from '@/lib/services/clubManagementService';
import { CardAvatar } from '@/components/ui/SmartAvatar';

// =====================================================
// Types
// =====================================================

interface MemberCardProps {
  member: ClubMember;
  selected: boolean;
  onSelect: (member: ClubMember) => void;
  disabled?: boolean;
}

// =====================================================
// Member Card Component
// =====================================================

const MemberCard: React.FC<MemberCardProps> = ({
  member,
  selected,
  onSelect,
  disabled = false
}) => {
  const handleClick = () => {
    if (!disabled) {
      onSelect(member);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if ((event.key === 'Enter' || event.key === ' ') && !disabled) {
      event.preventDefault();
      onSelect(member);
    }
  };

  const formatJoinDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        year: 'numeric' 
      });
    } catch {
      return 'Unknown';
    }
  };



  return (
    <Card
      className={`
        cursor-pointer transition-all duration-200 hover:shadow-md
        ${selected 
          ? 'ring-2 ring-blue-500 bg-blue-50 border-blue-200' 
          : 'hover:border-gray-300'
        }
        ${disabled 
          ? 'opacity-50 cursor-not-allowed' 
          : 'hover:scale-105'
        }
      `}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={disabled ? -1 : 0}
      role="button"
      aria-pressed={selected}
      aria-label={`Select ${member.display_name || member.username} as moderator`}
    >
      <CardContent className="p-4 text-center">
        {/* Avatar */}
        <div className="mb-3 flex justify-center">
          <CardAvatar
            profile={member as any}
            className="border-2 border-gray-200"
          />
        </div>

        {/* Member Info */}
        <div className="space-y-1">
          {/* Display Name */}
          <h3 className="font-semibold text-gray-900 text-sm leading-tight">
            {member.display_name || member.username || 'Unknown User'}
          </h3>

          {/* Username */}
          {member.username && (
            <p className="text-xs text-gray-600">
              @{member.username}
            </p>
          )}

          {/* Join Date */}
          <div className="flex items-center justify-center gap-1 text-xs text-gray-500 mt-2">
            <Calendar className="h-3 w-3" />
            <span>Joined {formatJoinDate(member.joined_at)}</span>
          </div>
        </div>

        {/* Selection Indicator */}
        {selected && (
          <div className="mt-3 flex justify-center">
            <div className="bg-blue-500 text-white rounded-full p-1">
              <User className="h-3 w-3" />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MemberCard;
