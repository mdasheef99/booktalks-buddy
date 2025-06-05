import { useEffect, useRef, useState } from 'react';

interface UseScrollAnimationOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

export const useScrollAnimation = (options: UseScrollAnimationOptions = {}) => {
  const {
    threshold = 0.05, // Reduced threshold for easier triggering
    rootMargin = '0px 0px 0px 0px', // Removed negative margins
    triggerOnce = true
  } = options;

  const [isVisible, setIsVisible] = useState(true); // START VISIBLE by default
  const [hasTriggered, setHasTriggered] = useState(false);
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (triggerOnce) {
            setHasTriggered(true);
          }
        } else if (!triggerOnce && !hasTriggered) {
          setIsVisible(false);
        }
      },
      {
        threshold,
        rootMargin
      }
    );

    observer.observe(element);

    // IMMEDIATE FALLBACK: Check if element is already in viewport
    const checkVisibility = () => {
      const rect = element.getBoundingClientRect();
      const isInViewport = rect.top < window.innerHeight && rect.bottom > 0;
      if (isInViewport && !isVisible) {
        console.warn('🔧 Element in viewport but observer not triggered, forcing visibility');
        setIsVisible(true);
      }
    };

    // Check immediately
    checkVisibility();

    // FALLBACK: If element is not visible after 1 second, force visibility
    const fallbackTimer = setTimeout(() => {
      if (!isVisible) {
        console.warn('🔧 Intersection Observer fallback triggered for element');
        setIsVisible(true);
      }
    }, 1000);

    return () => {
      observer.unobserve(element);
      clearTimeout(fallbackTimer);
    };
  }, [threshold, rootMargin, triggerOnce, hasTriggered, isVisible]);

  return { elementRef, isVisible };
};

// Hook for staggered animations in grids
export const useStaggeredAnimation = (itemCount: number, options: UseScrollAnimationOptions = {}) => {
  const { elementRef, isVisible } = useScrollAnimation(options);
  
  const getStaggerClass = (index: number) => {
    // Always show content immediately, just apply stagger animation
    const staggerIndex = Math.min(index + 1, 4); // Max 4 stagger classes
    return `animate-stagger-${staggerIndex}`;
  };

  return { elementRef, isVisible, getStaggerClass };
};

// Hook for section animations
export const useSectionAnimation = (animationType: 'fade-up' | 'fade-scale' = 'fade-up') => {
  const { elementRef, isVisible } = useScrollAnimation({
    threshold: 0.1, // Reduced from 0.2 to 0.1 for earlier triggering
    rootMargin: '0px 0px 0px 0px' // Removed negative bottom margin that was preventing triggering
  });

  // Always show content immediately with animation
  const animationClass = animationType === 'fade-up'
    ? 'animate-fade-in-up'
    : 'animate-fade-in-scale';



  return { elementRef, isVisible, animationClass };
};
