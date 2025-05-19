import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { BookPlus, ThumbsUp, SortAsc, SortDesc, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { getNominations } from '@/lib/api/bookclubs/nominations';
import { Nomination } from '@/lib/api/bookclubs/nominations';
import NominationsList from '../nominations/NominationsList';

interface NominationsSectionProps {
  clubId: string;
  isMember: boolean;
  isAdmin: boolean;
}

const NominationsSection: React.FC<NominationsSectionProps> = ({
  clubId,
  isMember,
  isAdmin
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [nominations, setNominations] = useState<Nomination[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'active' | 'selected' | 'archived' | 'all'>('active');
  const [sortOrder, setSortOrder] = useState<'likes' | 'newest'>('likes');

  useEffect(() => {
    if (clubId && user?.id && isMember) {
      fetchNominations();
    }
  }, [clubId, user?.id, isMember, status]);

  const fetchNominations = async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchedNominations = await getNominations(clubId, user?.id || '', status);

      // Sort nominations based on current sort order
      const sortedNominations = [...fetchedNominations].sort((a, b) => {
        if (sortOrder === 'likes') {
          return b.like_count - a.like_count;
        } else {
          return new Date(b.nominated_at).getTime() - new Date(a.nominated_at).getTime();
        }
      });

      // Limit to 3 nominations for the embedded section
      setNominations(sortedNominations.slice(0, 3));
    } catch (err) {
      console.error('Error fetching nominations:', err);
      setError('Failed to load book nominations');
    } finally {
      setLoading(false);
    }
  };

  const handleSortOrderChange = (newOrder: 'likes' | 'newest') => {
    setSortOrder(newOrder);

    // Re-sort the existing nominations without fetching again
    const sortedNominations = [...nominations].sort((a, b) => {
      if (newOrder === 'likes') {
        return b.like_count - a.like_count;
      } else {
        return new Date(b.nominated_at).getTime() - new Date(a.nominated_at).getTime();
      }
    });

    setNominations(sortedNominations);
  };

  const handleStatusChange = (newStatus: 'active' | 'selected' | 'archived' | 'all') => {
    setStatus(newStatus);
    // This will trigger the useEffect to fetch nominations with the new status
  };

  const handleNominateBook = () => {
    navigate(`/book-club/${clubId}/nominations/new`);
  };

  if (!isMember) {
    return null; // Don't show nominations section for non-members
  }

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <BookPlus className="h-5 w-5 text-bookconnect-terracotta" />
            Book Nominations
          </h2>
          <Link
            to={`/book-club/${clubId}/nominations`}
            className="text-sm text-gray-500 hover:text-bookconnect-terracotta flex items-center"
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            View All
          </Link>
        </div>
        <Button
          onClick={handleNominateBook}
          className="bg-bookconnect-terracotta hover:bg-bookconnect-terracotta/90"
        >
          <BookPlus className="h-4 w-4 mr-2" />
          Nominate a Book
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
        <Tabs
          value={status}
          onValueChange={(value) => handleStatusChange(value as 'active' | 'selected' | 'archived' | 'all')}
          className="w-full sm:w-auto"
        >
          <TabsList className="grid grid-cols-4 w-full sm:w-auto">
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="selected">Selected</TabsTrigger>
            <TabsTrigger value="archived">Archived</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant={sortOrder === 'likes' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleSortOrderChange('likes')}
            className="flex items-center gap-1"
          >
            <ThumbsUp className="h-4 w-4" />
            Most Liked
          </Button>
          <Button
            variant={sortOrder === 'newest' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleSortOrderChange('newest')}
            className="flex items-center gap-1"
          >
            {sortOrder === 'newest' ? (
              <SortDesc className="h-4 w-4" />
            ) : (
              <SortAsc className="h-4 w-4" />
            )}
            Newest
          </Button>
        </div>
      </div>

      {error ? (
        <Card className="p-6 text-center text-red-500">
          <p>{error}</p>
          <Button
            variant="outline"
            onClick={fetchNominations}
            className="mt-2"
          >
            Try Again
          </Button>
        </Card>
      ) : (
        <>
          <NominationsList
            nominations={nominations}
            loading={loading}
            isAdmin={isAdmin}
            onRefresh={fetchNominations}
            clubId={clubId}
          />

          {nominations.length > 0 && (
            <div className="mt-4 text-center">
              <Link
                to={`/book-club/${clubId}/nominations`}
                className="text-sm text-bookconnect-terracotta hover:text-bookconnect-terracotta/80 flex items-center justify-center"
              >
                View all nominations
                <ExternalLink className="h-3 w-3 ml-1" />
              </Link>
            </div>
          )}
        </>
      )}
    </>
  );
};

export default NominationsSection;
