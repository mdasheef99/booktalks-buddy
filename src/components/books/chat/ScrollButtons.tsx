
import React from "react";
import { ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

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
  onScrollBottom
}) => {
  // Debug visibility
  console.log("ScrollButtons - showScrollTop:", showScrollTop, "showScrollBottom:", showScrollBottom);
  
  return (
    <>
      {showScrollTop && (
        <div className="absolute left-1/2 top-6 -translate-x-1/2 z-10">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                onClick={onScrollTop}
                className="h-12 w-12 rounded-full bg-transparent backdrop-blur-sm shadow-md hover:bg-white/20 border border-white/30 transition-all duration-200"
              >
                <ArrowUp className="h-5 w-5 text-bookconnect-brown" />
                <span className="sr-only">Scroll to top</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Scroll to top</TooltipContent>
          </Tooltip>
        </div>
      )}

      {showScrollBottom && (
        <div className="absolute left-1/2 bottom-24 -translate-x-1/2 z-10">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                onClick={onScrollBottom}
                className="h-12 w-12 rounded-full bg-transparent backdrop-blur-sm shadow-md hover:bg-white/20 border border-white/30 transition-all duration-200"
              >
                <ArrowDown className="h-5 w-5 text-bookconnect-brown" />
                <span className="sr-only">Scroll to bottom</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Scroll to bottom</TooltipContent>
          </Tooltip>
        </div>
      )}
    </>
  );
};

export default ScrollButtons;
