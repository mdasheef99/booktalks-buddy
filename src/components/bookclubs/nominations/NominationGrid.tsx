import React from 'react';
import { Nomination } from '@/lib/api/bookclubs/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, ThumbsUp, Calendar, User, Check, MoreHorizontal } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { likeNomination, unlikeNomination } from '@/lib/api/bookclubs/likes';
import { setCurrentBookFromNomination } from '@/lib/api/bookclubs/books';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import NominationManagementModal from './NominationManagementModal';
import SkeletonBookCover from './SkeletonBookCover';
import LoadingButton from './LoadingButton';

interface NominationGridProps {
  nominations: Nomination[];
  isAdmin: boolean;
  onRefresh: () => void;
  clubId: string;
}

const NominationGrid: React.FC<NominationGridProps> = ({
  nominations,
  isAdmin,
  onRefresh,
  clubId
}) => {
  return (
    <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {nominations.map((nomination, index) => (
        <NominationGridCard
          key={nomination.id}
          nomination={nomination}
          isAdmin={isAdmin}
          onRefresh={onRefresh}
          clubId={clubId}
          style={{ animationDelay: `${index * 50}ms` }}
        />
      ))}
    </div>
  );
};

interface NominationGridCardProps {
  nomination: Nomination;
  isAdmin: boolean;
  onRefresh: () => void;
  clubId: string;
  style?: React.CSSProperties;
}

const NominationGridCard: React.FC<NominationGridCardProps> = ({
  nomination,
  isAdmin,
  onRefresh,
  clubId,
  style
}) => {
  const { user } = useAuth();
  const [isLiking, setIsLiking] = React.useState(false);
  const [isSettingCurrent, setIsSettingCurrent] = React.useState(false);
  const [managementModalOpen, setManagementModalOpen] = React.useState(false);

  const handleLikeToggle = async () => {
    if (!user?.id) return;

    setIsLiking(true);
    try {
      if (nomination.user_has_liked) {
        await unlikeNomination(user.id, nomination.id);
        toast.success('Removed your like');
      } else {
        await likeNomination(user.id, nomination.id);
        toast.success('Added your like');
      }
      onRefresh();
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error('Failed to update like');
    } finally {
      setIsLiking(false);
    }
  };

  const handleSetAsCurrent = async () => {
    if (!user?.id || !isAdmin) return;

    setIsSettingCurrent(true);
    try {
      await setCurrentBookFromNomination(user.id, clubId, nomination.id);
      toast.success('Current book updated successfully');
      onRefresh();
    } catch (error) {
      console.error('Error setting current book:', error);
      toast.error('Failed to set as current book');
    } finally {
      setIsSettingCurrent(false);
    }
  };

  const openManagementModal = () => {
    setManagementModalOpen(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = () => {
    switch (nomination.status) {
      case 'selected':
        return (
          <Badge className="bg-green-500 hover:bg-green-600 absolute top-2 right-2">
            <Check className="h-3 w-3 mr-1" />
            Current Book
          </Badge>
        );
      case 'archived':
        return (
          <Badge variant="outline" className="text-gray-500 border-gray-300 absolute top-2 right-2">
            Archived
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <Card
      className="overflow-hidden flex flex-col h-full hover:shadow-md transition-all duration-300 animate-fade-in"
      style={style}
    >
      <div className="relative">
        {getStatusBadge()}

        {/* Book Cover with progressive loading */}
        <div className="w-full h-36 sm:h-48">
          <SkeletonBookCover
            src={nomination.book.cover_url}
            alt={`Cover of ${nomination.book.title}`}
            width="w-full"
            height="h-full"
            viewType="grid"
          />
        </div>
      </div>

      <div className="p-3 sm:p-4 flex-1 flex flex-col">
        <div className="mb-2">
          <h3 className="font-medium text-base sm:text-lg line-clamp-1 text-center sm:text-left">
            {nomination.book.title}
          </h3>
          <p className="text-gray-600 text-xs sm:text-sm text-center sm:text-left">
            by {nomination.book.author}
          </p>
        </div>

        <div className="mt-1 flex flex-wrap justify-center sm:justify-start gap-2 text-xs text-gray-500">
          <span className="flex items-center min-w-[44px] min-h-[24px]">
            <User className="h-3 w-3 mr-1" />
            Nominated by {nomination.nominated_by.substring(0, 8)}
          </span>
          <span className="flex items-center min-w-[44px] min-h-[24px]">
            <Calendar className="h-3 w-3 mr-1" />
            {formatDate(nomination.nominated_at)}
          </span>
        </div>

        {nomination.book.description && (
          <p className="mt-2 text-xs sm:text-sm text-gray-700 line-clamp-2 sm:line-clamp-3 flex-1 text-center sm:text-left">
            {nomination.book.description}
          </p>
        )}

        {/* Actions */}
        <div className="mt-3 flex flex-col sm:flex-row gap-2 sm:gap-0 sm:justify-between items-center">
          <LoadingButton
            variant={nomination.user_has_liked ? "default" : "outline"}
            size="sm"
            onClick={handleLikeToggle}
            isLoading={isLiking}
            disabled={nomination.status !== 'active'}
            icon={<ThumbsUp className="h-4 w-4" />}
            loadingText=""
            className={`transition-all duration-300 min-w-[44px] min-h-[36px] ${
              nomination.user_has_liked
                ? "bg-bookconnect-terracotta hover:bg-bookconnect-terracotta/90"
                : ""
            }`}
          >
            {nomination.like_count}
          </LoadingButton>

          <div className="flex items-center gap-2 mt-2 sm:mt-0">
            {isAdmin && nomination.status === 'active' && (
              <LoadingButton
                variant="outline"
                size="sm"
                onClick={handleSetAsCurrent}
                isLoading={isSettingCurrent}
                icon={<BookOpen className="h-4 w-4" />}
                loadingText=""
                className="transition-all duration-300 min-w-[44px] min-h-[36px]"
              >
                <span className="hidden sm:inline">Set Current</span>
              </LoadingButton>
            )}

            {isAdmin && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 w-9 p-0 transition-all duration-300 hover:bg-gray-100 rounded-md"
                  >
                    <MoreHorizontal className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="animate-fade-in">
                  <DropdownMenuItem
                    onClick={openManagementModal}
                    className="transition-colors duration-200 min-h-[36px]"
                  >
                    Manage Nomination
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>

      {/* Management Modal */}
      <NominationManagementModal
        open={managementModalOpen}
        onClose={() => setManagementModalOpen(false)}
        nomination={nomination}
        clubId={clubId}
        onSuccess={onRefresh}
      />
    </Card>
  );
};

export default NominationGrid;
