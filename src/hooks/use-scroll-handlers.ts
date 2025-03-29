
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
    
    // Set thresholds for showing buttons
    const scrollThreshold = 20;
    const isScrolledFromTop = scrollTop > scrollThreshold;
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

  // Scroll to bottom when dependencies change
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
      
      // Check button visibility after scrolling
      setTimeout(() => {
        handleScroll();
      }, 50);
    }
  }, [dependencies]);

  const scrollToTop = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ 
        top: scrollContainerRef.current.scrollHeight, 
        behavior: 'smooth' 
      });
    }
  };

  return {
    showScrollTop,
    showScrollBottom,
    scrollToTop,
    scrollToBottom
  };
}
