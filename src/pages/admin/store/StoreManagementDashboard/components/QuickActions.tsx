/**
 * Quick Actions Component
 * 
 * Displays quick action buttons for common tasks
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { QuickActionsProps, QuickActionCardProps } from '../types';

/**
 * Quick Action Card Component
 */
const QuickActionCard: React.FC<QuickActionCardProps> = ({ action }) => {
  return (
    <Button
      asChild
      variant="outline"
      className="h-auto p-4 flex flex-col items-start gap-2"
      disabled={action.disabled}
    >
      <Link to={action.href}>
        <div className={`h-8 w-8 ${action.color} rounded-lg flex items-center justify-center mb-2`}>
          <action.icon className="h-4 w-4 text-white" />
        </div>
        <div className="text-left">
          <p className="font-medium text-sm">{action.title}</p>
          <p className="text-xs text-gray-500">{action.description}</p>
        </div>
      </Link>
    </Button>
  );
};

/**
 * Quick Actions Component
 */
export const QuickActions: React.FC<QuickActionsProps> = ({ actions }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Quick Actions
        </CardTitle>
        <CardDescription>
          Quickly add new content to your landing page
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {actions.map((action) => (
            <QuickActionCard
              key={action.title}
              action={action}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
