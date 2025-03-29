
import React from "react";
import { ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ScrollButtonsProps {
  showScrollTop: boolean;
  showScrollBottom: boolean;
  onScrollTop: () => void;
  onScrollBottom: () => void;
}

const ScrollButtons: React.FC<ScrollButtonsProps> = ({
  showScrollTop,
  showScrollBottom,
  onScrollTop,
  onScrollBottom,
}) => {
  return (
    <div className="absolute inset-y-0 right-0 flex flex-col items-center justify-center pointer-events-none">
      <div className="flex flex-col gap-20 pointer-events-auto">
        {showScrollTop && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                onClick={onScrollTop}
                size="sm"
                variant="secondary"
                className="bg-bookconnect-brown/30 hover:bg-bookconnect-brown/50 text-white rounded-full h-10 w-10 p-0 animate-fade-in shadow-md transition-all duration-300"
              >
                <ArrowUp size={18} />
                <span className="sr-only">Scroll to top</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Scroll to top</TooltipContent>
          </Tooltip>
        )}
        
        {showScrollBottom && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                onClick={onScrollBottom}
                size="sm"
                variant="secondary"
                className="bg-bookconnect-brown/30 hover:bg-bookconnect-brown/50 text-white rounded-full h-10 w-10 p-0 animate-fade-in shadow-md transition-all duration-300"
              >
                <ArrowDown size={18} />
                <span className="sr-only">Scroll to bottom</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Scroll to bottom</TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  );
};

export default ScrollButtons;
