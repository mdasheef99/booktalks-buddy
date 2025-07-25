import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

interface ActionButton {
  label: string;
  icon: React.ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: 'default' | 'outline' | 'secondary';
}

interface AnalyticsPageHeaderProps {
  title: string;
  description: string;
  actions?: ActionButton[];
  children?: React.ReactNode; // For custom controls like time range selector
}

/**
 * Shared header component for analytics pages
 * Provides consistent title, description, and action button layout
 */
export const AnalyticsPageHeader: React.FC<AnalyticsPageHeaderProps> = ({
  title,
  description,
  actions = [],
  children
}) => {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
        <p className="text-gray-600 mt-2">{description}</p>
      </div>

      <div className="flex gap-2 items-center">
        {/* Custom controls (like time range selector) */}
        {children}
        
        {/* Action buttons */}
        {actions.map((action, index) => (
          action.href ? (
            <Button
              key={index}
              asChild
              variant={action.variant || "outline"}
              className="flex items-center gap-2"
            >
              <Link to={action.href}>
                {action.icon}
                {action.label}
              </Link>
            </Button>
          ) : (
            <Button
              key={index}
              onClick={action.onClick}
              variant={action.variant || "outline"}
              className="flex items-center gap-2"
            >
              {action.icon}
              {action.label}
            </Button>
          )
        ))}
      </div>
    </div>
  );
};
