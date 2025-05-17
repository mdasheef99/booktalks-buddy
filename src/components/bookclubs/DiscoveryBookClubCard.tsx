import React, { useState, useEffect, useRef, memo } from 'react';
import { Users, ChevronDown, ChevronUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookClub } from './hooks/useClubDiscovery';

interface DiscoveryBookClubCardProps {
  club: BookClub;
  renderActionButton: (club: BookClub) => React.ReactNode;
  onViewClub: (clubId: string) => void;
}

const DiscoveryBookClubCard: React.FC<DiscoveryBookClubCardProps> = ({
  club,
  renderActionButton,
  onViewClub
}) => {
  const [expanded, setExpanded] = useState(false);
  const descriptionRef = useRef<HTMLParagraphElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    // Check if the description is overflowing
    if (descriptionRef.current) {
      const element = descriptionRef.current;
      setIsOverflowing(element.scrollHeight > element.clientHeight);
    }
  }, [club.description]);

  const toggleExpanded = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded(!expanded);
  };

  return (
    <Card
      className="p-6 hover:bg-gray-50 transition-colors"
      onClick={() => onViewClub(club.id)}
    >
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="flex-1">
          <h3 className="text-xl font-semibold">{club.name}</h3>

          <div className={`relative ${expanded ? '' : 'h-20 overflow-hidden'}`}>
            <p
              ref={descriptionRef}
              className={`text-gray-600 mt-1 ${expanded ? '' : 'max-h-20'}`}
            >
              {club.description || 'No description available'}
            </p>
            {!expanded && isOverflowing && (
              <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent"></div>
            )}
          </div>

          {isOverflowing && (
            <Button
              variant="ghost"
              size="sm"
              className="text-primary hover:text-primary/80 p-0 h-auto font-medium mt-1"
              onClick={toggleExpanded}
            >
              {expanded ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-1" />
                  Show Less
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-1" />
                  Read More
                </>
              )}
            </Button>
          )}

          <div className="flex items-center gap-2 mt-2">
            <span className={`text-xs px-2 py-1 rounded-full ${
              club.privacy === 'private'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-green-100 text-green-800'
            }`}>
              {club.privacy || 'public'}
            </span>
            <span className="text-xs text-gray-500 flex items-center">
              <Users className="h-3 w-3 mr-1" />
              Members
            </span>
          </div>
        </div>

        <div>
          {renderActionButton(club)}
        </div>
      </div>
    </Card>
  );
};

// Memoize the component to prevent unnecessary re-renders
export default memo(DiscoveryBookClubCard);
