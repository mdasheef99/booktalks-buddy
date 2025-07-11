/**
 * Books Header Component
 * 
 * Page header with navigation and user context for Books Section
 */

import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Library, FolderOpen, Store } from 'lucide-react';
import { BooksSectionTab } from '../hooks/useBooksNavigation';

interface BooksHeaderProps {
  activeTab: BooksSectionTab;
  onTabChange: (tab: BooksSectionTab) => void;
}

export const BooksHeader: React.FC<BooksHeaderProps> = ({
  activeTab,
  onTabChange
}) => {
  return (
    <div className="mb-8">
      {/* Page Title */}
      <div className="mb-6">
        <h1 className="font-serif text-3xl font-bold text-bookconnect-brown mb-2">
          Books
        </h1>
        <p className="text-bookconnect-brown/70">
          Discover, organize, and track your reading journey
        </p>
      </div>

      {/* Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={onTabChange} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="search" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Discover
          </TabsTrigger>
          <TabsTrigger value="library" className="flex items-center gap-2">
            <Library className="h-4 w-4" />
            My Library
          </TabsTrigger>
          <TabsTrigger value="store-requests" className="flex items-center gap-2">
            <Store className="h-4 w-4" />
            Store Requests
          </TabsTrigger>
          <TabsTrigger value="collections" className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4" />
            Collections
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
};
