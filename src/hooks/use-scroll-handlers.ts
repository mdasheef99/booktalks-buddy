
import { useState, useEffect, RefObject } from "react";

export function useScrollHandlers<T extends HTMLElement>(
  scrollContainerRef: RefObject<T>,
  dependencies: any[] = []
) {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  // Function to check scroll position and update visibility states
  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    
    // Reduced threshold to show buttons more aggressively
    const scrollThreshold = 10;
    const isScrolledFromTop = scrollTop > scrollThreshold;
    // Make it more sensitive to show the bottom button
    const isNotScrolledToBottom = scrollTop < scrollHeight - clientHeight - scrollThreshold;
    
    setShowScrollTop(isScrolledFromTop);
    setShowScrollBottom(isNotScrolledToBottom);
    
    console.log("Scroll position:", { 
      scrollTop, 
      scrollHeight, 
      clientHeight,
      showTop: isScrolledFromTop,
      showBottom: isNotScrolledToBottom
    });
  };

  // Add scroll event listener and run check initially
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll);
    
    // Force an initial check after a small delay to ensure DOM is ready
    setTimeout(() => {
      handleScroll();
    }, 100);

    return () => container.removeEventListener('scroll', handleScroll);
  }, [scrollContainerRef]);

  // Run scroll check when dependencies change
  useEffect(() => {
    // Force check buttons visibility after deps change
    setTimeout(() => {
      handleScroll();
    }, 100);
  }, [dependencies]);
  
  // Separate effect just for scrolling to bottom when messages change
  useEffect(() => {
    if (scrollContainerRef.current) {
      // Scroll to bottom on new messages
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [dependencies]);

  const scrollToTop = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      
      // Update button visibility after scrolling
      setTimeout(handleScroll, 300);
    }
  };

  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ 
        top: scrollContainerRef.current.scrollHeight, 
        behavior: 'smooth' 
      });
      
      // Update button visibility after scrolling
      setTimeout(handleScroll, 300);
    }
  };

  return {
    showScrollTop,
    showScrollBottom,
    scrollToTop,
    scrollToBottom
  };
}
