
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
    setShowScrollTop(scrollTop > 20);
    setShowScrollBottom(scrollTop < scrollHeight - clientHeight - 20);
  };

  // Add scroll event listener and run check initially
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll);
    handleScroll(); // Check initial position

    return () => container.removeEventListener('scroll', handleScroll);
  }, [scrollContainerRef]); // Only depend on scrollContainerRef, not the entire dependencies array

  // Scroll to bottom when dependencies change and showScrollBottom is false
  useEffect(() => {
    if (scrollContainerRef.current) {
      // Always scroll to bottom when new messages arrive
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [dependencies]); // Only depend on the dependencies array here

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
