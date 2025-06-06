import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface EmptyStateProps {
  title: string;
  description: string;
  icon: LucideIcon;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondaryAction?: () => void;
  variant?: 'default' | 'warning' | 'error' | 'info';
}

/**
 * Generic empty state component for club management panels
 */
const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon: Icon,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondaryAction,
  variant = 'default'
}) => {
  // Determine color scheme based on variant
  const getIconColorClass = () => {
    switch (variant) {
      case 'warning':
        return 'text-amber-300';
      case 'error':
        return 'text-red-300';
      case 'info':
        return 'text-blue-300';
      default:
        return 'text-gray-300';
    }
  };

  const getButtonVariant = () => {
    switch (variant) {
      case 'warning':
        return 'warning';
      case 'error':
        return 'destructive';
      case 'info':
        return 'secondary';
      default:
        return 'default';
    }
  };

  return (
    <Card className="border-dashed border-2">
      <CardContent className="pt-6 pb-6 text-center">
        <Icon className={`h-12 w-12 mx-auto mb-4 ${getIconColorClass()}`} />
        <h3 className="text-lg font-medium mb-2">{title}</h3>
        <p className="text-sm text-gray-500 mb-4 max-w-md mx-auto">
          {description}
        </p>
        {actionLabel && onAction && (
          <div className="space-x-2">
            <Button 
              onClick={onAction}
              variant={getButtonVariant() as any}
            >
              {actionLabel}
            </Button>
            {secondaryLabel && onSecondaryAction && (
              <Button 
                onClick={onSecondaryAction}
                variant="outline"
              >
                {secondaryLabel}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EmptyState;
