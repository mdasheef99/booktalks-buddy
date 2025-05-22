import React, { useState, useEffect, useRef } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CommentContentProps {
  content: string;
  isDeleted?: boolean;
  deletedByModerator?: boolean;
}

const CommentContent: React.FC<CommentContentProps> = ({
  content,
  isDeleted = false,
  deletedByModerator = false,
}) => {
  const [showFullContent, setShowFullContent] = useState(false);
  const contentRef = useRef<HTMLParagraphElement>(null);
  const [contentOverflows, setContentOverflows] = useState(false);

  // Check if content overflows and needs "Read more" button
  useEffect(() => {
    if (contentRef.current) {
      const { clientHeight, scrollHeight } = contentRef.current;
      setContentOverflows(scrollHeight > 200); // 200px threshold for "Read more"
    }
  }, [content]);

  return (
    <div className="ml-5">
      <div
        className={cn(
          "relative mt-1.5 overflow-hidden",
          !showFullContent && contentOverflows && "max-h-[200px]"
        )}
      >
        {isDeleted ? (
          <p className="text-[0.95rem] leading-[1.4] text-gray-400 italic">
            {deletedByModerator
              ? "Deleted by moderator"
              : "This message has been deleted"}
          </p>
        ) : (
          <p
            ref={contentRef}
            className="text-[0.95rem] leading-[1.4] text-gray-800 whitespace-pre-wrap break-words overflow-wrap-anywhere"
            style={{
              wordBreak: "break-word",
              overflowWrap: "break-word"
            }}
          >
            {content}
          </p>
        )}

        {/* Gradient fade for truncated content */}
        {!isDeleted && !showFullContent && contentOverflows && (
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
        )}
      </div>

      {/* Read more/less button */}
      {!isDeleted && contentOverflows && (
        <button
          onClick={() => setShowFullContent(!showFullContent)}
          className="text-bookconnect-terracotta hover:text-bookconnect-terracotta/80 text-xs flex items-center mt-1"
        >
          {showFullContent ? (
            <>
              Read less <ChevronUp className="h-3 w-3 ml-1" />
            </>
          ) : (
            <>
              Read more <ChevronDown className="h-3 w-3 ml-1" />
            </>
          )}
        </button>
      )}
    </div>
  );
};

export default CommentContent;
