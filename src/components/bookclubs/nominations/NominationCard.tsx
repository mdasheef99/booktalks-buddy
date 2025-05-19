import React, { useState } from 'react';
import { ThumbsUp, BookOpen, Calendar, User, Check, AlertCircle, MoreHorizontal } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { Nomination } from '@/lib/api/bookclubs/types';
import { likeNomination, unlikeNomination } from '@/lib/api/bookclubs/likes';
import { setCurrentBookFromNomination } from '@/lib/api/bookclubs/books';
import { toast } from 'sonner';
import NominationManagementModal from './NominationManagementModal';
import SkeletonBookCover from './SkeletonBookCover';
import LoadingButton from './LoadingButton';

interface NominationCardProps {
  nomination: Nomination;
  isAdmin: boolean;
  onRefresh: () => void;
  clubId: string;
}

const NominationCard: React.FC<NominationCardProps> = ({
  nomination,
  isAdmin,
  onRefresh,
  clubId
}) => {
  const { user } = useAuth();
  const [isLiking, setIsLiking] = useState(false);
  const [isSettingCurrent, setIsSettingCurrent] = useState(false);
  const [managementModalOpen, setManagementModalOpen] = useState(false);

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
          <Badge className="bg-green-500 hover:bg-green-600">
            <Check className="h-3 w-3 mr-1" />
            Current Book
          </Badge>
        );
      case 'archived':
        return (
          <Badge variant="outline" className="text-gray-500 border-gray-300">
            Archived
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="p-3 sm:p-4 hover:shadow-md transition-all duration-300">
      <div className="flex flex-col xs:flex-row">
        {/* Book Cover with progressive loading */}
        <div className="mb-3 xs:mb-0 xs:mr-4 mx-auto xs:mx-0 flex-shrink-0">
          <SkeletonBookCover
            src={nomination.book.cover_url}
            alt={`Cover of ${nomination.book.title}`}
            width="w-24 xs:w-16"
            height="h-36 xs:h-24"
            className="rounded shadow"
            viewType="list"
          />
        </div>

        {/* Book Details */}
        <div className="flex-1">
          <div className="flex flex-col xs:flex-row xs:justify-between xs:items-start">
            <div className="text-center xs:text-left mb-2 xs:mb-0">
              <h3 className="font-medium text-base sm:text-lg">{nomination.book.title}</h3>
              <p className="text-gray-600 text-xs sm:text-sm">by {nomination.book.author}</p>
            </div>
            <div className="self-center xs:self-start mb-2 xs:mb-0">
              {getStatusBadge()}
            </div>
          </div>

          <div className="mt-1 sm:mt-2 flex flex-wrap justify-center xs:justify-start gap-2 text-xs text-gray-500">
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
            <p className="mt-2 text-xs sm:text-sm text-gray-700 line-clamp-2 text-center xs:text-left">
              {nomination.book.description}
            </p>
          )}

          {/* Actions */}
          <div className="mt-3 flex flex-col xs:flex-row gap-2 xs:gap-0 xs:justify-between items-center">
            <LoadingButton
              variant={nomination.user_has_liked ? "default" : "outline"}
              size="sm"
              onClick={handleLikeToggle}
              isLoading={isLiking}
              disabled={nomination.status !== 'active'}
              icon={<ThumbsUp className="h-4 w-4" />}
              loadingText="Updating..."
              className={`transition-all duration-300 min-w-[100px] min-h-[36px] ${
                nomination.user_has_liked
                  ? "bg-bookconnect-terracotta hover:bg-bookconnect-terracotta/90"
                  : ""
              }`}
            >
              {nomination.like_count} {nomination.like_count === 1 ? 'Like' : 'Likes'}
            </LoadingButton>

            <div className="flex items-center gap-2 mt-2 xs:mt-0">
              {isAdmin && nomination.status === 'active' && (
                <LoadingButton
                  variant="outline"
                  size="sm"
                  onClick={handleSetAsCurrent}
                  isLoading={isSettingCurrent}
                  icon={<BookOpen className="h-4 w-4" />}
                  loadingText="Setting..."
                  className="transition-all duration-300 min-w-[44px] min-h-[36px]"
                >
                  <span className="hidden sm:inline">Set as Current</span>
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

          {/* Management Modal */}
          <NominationManagementModal
            open={managementModalOpen}
            onClose={() => setManagementModalOpen(false)}
            nomination={nomination}
            clubId={clubId}
            onSuccess={onRefresh}
          />
        </div>
      </div>
    </Card>
  );
};

export default NominationCard;
