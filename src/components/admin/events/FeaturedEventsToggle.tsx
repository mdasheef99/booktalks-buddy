import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Star } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface FeaturedEventsToggleProps {
  eventId: string;
  isFeatured: boolean;
  onToggle: (eventId: string, featured: boolean) => Promise<void>;
}

/**
 * Component for toggling whether an event is featured on the landing page
 */
const FeaturedEventsToggle: React.FC<FeaturedEventsToggleProps> = ({
  eventId,
  isFeatured,
  onToggle
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async () => {
    setIsLoading(true);
    try {
      await onToggle(eventId, !isFeatured);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={isFeatured ? "default" : "outline"}
            size="sm"
            onClick={handleToggle}
            disabled={isLoading}
            className={`flex-shrink-0 w-[100px] h-9 ${isFeatured ? "bg-amber-500 hover:bg-amber-600" : ""}`}
          >
            <Star className={`h-4 w-4 ${isFeatured ? "fill-white" : "fill-none"} mr-1.5`} />
            {isFeatured ? "Featured" : "Feature"}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{isFeatured ? "Remove from featured events" : "Add to featured events on landing page"}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default FeaturedEventsToggle;
