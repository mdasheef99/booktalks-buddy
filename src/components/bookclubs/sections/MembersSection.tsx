import React from 'react';
import { Users } from 'lucide-react';
import { Card } from '@/components/ui/card';
import UserAvatar from '@/components/common/UserAvatar';
import UserName from '@/components/common/UserName';
import { Database } from '@/integrations/supabase/types';

type ClubMember = Database['public']['Tables']['club_members']['Row'];

interface MembersSectionProps {
  members: ClubMember[];
}

const MembersSection: React.FC<MembersSectionProps> = ({ members }) => {
  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
        <Users className="h-5 w-5" />
        Members ({members.length})
      </h2>
      <div className="space-y-3">
        {members.map((member) => (
          <div key={member.user_id} className="flex items-center gap-3">
            <UserAvatar userId={member.user_id} size="sm" />
            <div>
              <UserName
                userId={member.user_id}
                linkToProfile
                withRole={member.role}
                displayFormat="full"
                showTierBadge={true}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default MembersSection;
