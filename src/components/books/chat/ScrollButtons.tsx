
import React from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    <div className="absolute right-4 bottom-24 flex flex-col gap-2">
      {showScrollTop && (
        <Button
          size="icon"
          variant="ghost"
          onClick={onScrollTop}
          className="h-8 w-8 rounded-full bg-white/30 backdrop-blur-sm hover:bg-white/50 transition-all duration-200"
        >
          <ChevronUp className="h-4 w-4 text-bookconnect-brown" />
        </Button>
      )}
      {showScrollBottom && (
        <Button
          size="icon"
          variant="ghost"
          onClick={onScrollBottom}
          className="h-8 w-8 rounded-full bg-white/30 backdrop-blur-sm hover:bg-white/50 transition-all duration-200"
        >
          <ChevronDown className="h-4 w-4 text-bookconnect-brown" />
        </Button>
      )}
    </div>
  );
};

export default ScrollButtons;
