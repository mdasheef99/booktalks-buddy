import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ClubMembership } from '@/lib/api/profile';
import { Users, Book, Crown, User, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface BookClubMembershipsProps {
  memberships: ClubMembership[];
  loading: boolean;
  isCurrentUser?: boolean;
}

const BookClubMemberships: React.FC<BookClubMembershipsProps> = ({
  memberships,
  loading,
  isCurrentUser = false
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Get role icon based on role
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'moderator':
        return <Crown className="h-4 w-4 text-gray-500" />;
      default:
        return <User className="h-4 w-4 text-bookconnect-terracotta" />;
    }
  };

  // Get role label
  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Admin';
      case 'moderator':
        return 'Moderator';
      default:
        return 'Member';
    }
  };

  // Format join date
  const formatJoinDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short'
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-bookconnect-terracotta" />
            Book Club Memberships
          </CardTitle>
          {user && isCurrentUser && (
            <Button
              size="sm"
              disabled
              onClick={() => navigate('/book-club/new')}
              className="bg-bookconnect-terracotta hover:bg-bookconnect-terracotta/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create New Club
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-bookconnect-terracotta" />
          Book Club Memberships
        </CardTitle>
        {user && isCurrentUser && (
          <Button
            size="sm"
            onClick={() => navigate('/book-club/new')}
            className="bg-bookconnect-terracotta hover:bg-bookconnect-terracotta/90 shadow-sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create New Club
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {memberships.length > 0 ? (
          <div className="space-y-6">
            {memberships.map((membership) => (
              <div
                key={membership.club_id}
                className="border-b border-gray-100 last:border-0 pb-4 last:pb-0"
              >
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => navigate(`/book-club/${membership.club_id}`)}
                >
                  <div>
                    <h3 className="font-medium hover:text-bookconnect-terracotta transition-colors">
                      {membership.club_name}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                      <span className="flex items-center gap-1">
                        {getRoleIcon(membership.role)}
                        {getRoleLabel(membership.role)}
                      </span>
                      <span>•</span>
                      <span>Joined {formatJoinDate(membership.joined_at)}</span>
                    </div>
                  </div>
                </div>

                {membership.current_book && (
                  <div className="mt-3 flex items-start gap-3 bg-bookconnect-cream/30 p-3 rounded-md shadow-sm">
                    {membership.current_book.cover_url ? (
                      <img
                        src={membership.current_book.cover_url}
                        alt={membership.current_book.title}
                        className="h-16 w-12 object-cover rounded"
                      />
                    ) : (
                      <div className="h-16 w-12 bg-gray-200 rounded flex items-center justify-center">
                        <Book className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium">Currently Reading</p>
                      <p className="text-sm">{membership.current_book.title}</p>
                      <p className="text-xs text-gray-500">by {membership.current_book.author}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <Users className="h-12 w-12 mx-auto text-gray-300 mb-2" />
            <p className="text-gray-500">Not a member of any book clubs yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BookClubMemberships;
