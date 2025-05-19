import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Whether the button is in a loading state
   */
  isLoading: boolean;
  /**
   * The icon to display when not loading
   */
  icon?: React.ReactNode;
  /**
   * The text to display when loading
   */
  loadingText?: string;
  /**
   * The variant of the button
   */
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  /**
   * The size of the button
   */
  size?: 'default' | 'sm' | 'lg' | 'icon';
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * The children to display
   */
  children: React.ReactNode;
}

/**
 * A button that shows a loading state with a spinner
 */
const LoadingButton: React.FC<LoadingButtonProps> = ({
  isLoading,
  icon,
  loadingText = 'Loading...',
  variant = 'default',
  size = 'default',
  className,
  children,
  ...props
}) => {
  return (
    <Button
      variant={variant}
      size={size}
      className={cn(
        "transition-all duration-300",
        isLoading && "opacity-80",
        className
      )}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          {loadingText}
        </>
      ) : (
        <>
          {icon && <span className="mr-2">{icon}</span>}
          {children}
        </>
      )}
    </Button>
  );
};

export default LoadingButton;
