/**
 * Management Sections Component
 * 
 * Displays management section cards with navigation
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { ManagementSectionsProps, ManagementSectionCardProps } from '../types';

/**
 * Management Section Card Component
 */
const ManagementSectionCard: React.FC<ManagementSectionCardProps> = ({ section }) => {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`h-12 w-12 ${section.bgColor} rounded-lg flex items-center justify-center`}>
              <section.icon className={`h-6 w-6 ${section.color}`} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{section.title}</h3>
              <p className="text-sm text-gray-600">{section.description}</p>
              <p className="text-xs text-gray-500 mt-1">{section.stats}</p>
            </div>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link to={section.href}>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Management Sections Component
 */
export const ManagementSections: React.FC<ManagementSectionsProps> = ({ sections }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Management Sections
        </CardTitle>
        <CardDescription>
          Access all Store Management features
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sections.map((section) => (
            <ManagementSectionCard
              key={section.title}
              section={section}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
