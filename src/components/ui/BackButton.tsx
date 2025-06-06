import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BackButtonProps {
  /** Custom fallback route if no history is available */
  fallbackRoute?: string;
  
  /** Additional CSS classes */
  className?: string;
  
  /** Button size variant */
  size?: 'sm' | 'default' | 'lg';
  
  /** Button style variant */
  variant?: 'default' | 'outline' | 'ghost';
  
  /** Custom label text */
  label?: string;
  
  /** Whether to show tooltip */
  showTooltip?: boolean;
  
  /** Custom onClick handler (overrides default navigation) */
  onClick?: () => void;
}

export const BackButton: React.FC<BackButtonProps> = ({
  fallbackRoute = '/book-clubs',
  className,
  size = 'sm',
  variant = 'outline',
  label = 'Back',
  showTooltip = true,
  onClick
}) => {
  const navigate = useNavigate();
  const [canGoBack, setCanGoBack] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Check if there's history to go back to
  useEffect(() => {
    // Check if there's previous history
    // Note: We can't directly access history length in modern browsers for security reasons
    // So we'll use a heuristic based on the referrer and navigation state
    const hasHistory = window.history.length > 1;
    const hasReferrer = document.referrer && document.referrer !== window.location.href;
    
    setCanGoBack(hasHistory || hasReferrer);
  }, []);

  const handleClick = () => {
    if (onClick) {
      onClick();
      return;
    }

    try {
      // Try to go back in history
      if (canGoBack && window.history.length > 1) {
        navigate(-1);
      } else {
        // Fallback to a safe route
        navigate(fallbackRoute);
      }
    } catch (error) {
      console.error('Navigation error:', error);
      // Ultimate fallback
      navigate(fallbackRoute);
    }
  };

  return (
    <div className="relative inline-block">
      <Button
        variant={variant}
        size={size}
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          // Base styling
          "transition-all duration-200 transform hover:scale-105 active:scale-95",
          
          // Color scheme based on variant
          variant === 'outline' && "border-bookconnect-brown/30 text-bookconnect-brown hover:bg-bookconnect-cream hover:border-bookconnect-brown/50",
          variant === 'ghost' && "text-bookconnect-brown hover:bg-bookconnect-cream/50",
          variant === 'default' && "bg-bookconnect-brown text-white hover:bg-bookconnect-brown/90",
          
          // Shadow and focus states
          "shadow-sm hover:shadow-md focus:ring-2 focus:ring-bookconnect-brown/20 focus:ring-offset-2",
          
          className
        )}
        aria-label={`${label} to previous page`}
      >
        <ChevronLeft className={cn(
          "transition-transform duration-200",
          size === 'sm' ? "h-4 w-4" : size === 'lg' ? "h-6 w-6" : "h-5 w-5",
          isHovered ? "-translate-x-0.5" : "",
          label ? "mr-2" : ""
        )} />
        {label && (
          <span className="font-medium">
            {label}
          </span>
        )}
      </Button>

      {/* Tooltip */}
      {showTooltip && isHovered && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black/80 text-white text-xs rounded whitespace-nowrap z-50 pointer-events-none">
          {canGoBack ? 'Go back to previous page' : `Go to ${fallbackRoute.replace('/', '').replace('-', ' ')}`}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-transparent border-t-black/80"></div>
        </div>
      )}
    </div>
  );
};

export default BackButton;
