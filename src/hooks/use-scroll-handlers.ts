
import { useState, useEffect, RefObject } from "react";

export function useScrollHandlers<T extends HTMLElement>(
  scrollContainerRef: RefObject<T>,
  dependencies: any[] = []
) {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      setShowScrollTop(scrollTop > 20);
      setShowScrollBottom(scrollTop < scrollHeight - clientHeight - 20);
    };

    container.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => container.removeEventListener('scroll', handleScroll);
  }, [scrollContainerRef, ...dependencies]);

  useEffect(() => {
    if (scrollContainerRef.current && !showScrollBottom) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [dependencies, showScrollBottom]);

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
