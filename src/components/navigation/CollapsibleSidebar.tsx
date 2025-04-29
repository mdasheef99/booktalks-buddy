import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import MainNavigation from './MainNavigation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const CollapsibleSidebar: React.FC = () => {
  // Use localStorage to persist the collapsed state
  const [collapsed, setCollapsed] = useState(() => {
    const savedState = localStorage.getItem('sidebarCollapsed');
    return savedState ? JSON.parse(savedState) : false;
  });

  // Save collapsed state to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(collapsed));
  }, [collapsed]);

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  return (
    <div className="relative">
      {/* Sidebar container with fixed height and transition */}
      <aside
        className={cn(
          "transition-all duration-300 ease-in-out",
          "fixed top-16 bottom-0 left-0 z-10",
          "hidden md:block border-r",
          "overflow-y-auto h-[calc(100vh-4rem)]",
          "bg-gradient-to-b from-bookconnect-cream to-bookconnect-cream/90",
          "shadow-[inset_-5px_0_10px_-5px_rgba(0,0,0,0.05)]",
          collapsed ? "w-16" : "w-64"
        )}
        style={{
          backgroundImage: collapsed ? "" : "url(\"data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%235c4033' fill-opacity='0.03' fill-rule='evenodd'/%3E%3C/svg%3E\")",
          backgroundAttachment: "fixed"
        }}
      >
        {/* Logo and title section */}
        <div className={cn(
          "flex items-center px-4 py-3 border-b border-bookconnect-brown/10",
          collapsed ? "justify-center" : "justify-start"
        )}>
          <BookOpen className="h-6 w-6 text-bookconnect-brown" />
          {!collapsed && (
            <span className="ml-2 font-serif text-lg text-bookconnect-brown">BookConnect</span>
          )}
        </div>

        {/* Toggle button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className={cn(
            "absolute top-16 -right-3 h-6 w-6 rounded-full",
            "bg-white shadow-md border border-bookconnect-brown/10",
            "hover:bg-bookconnect-cream hover:text-bookconnect-brown",
            "transition-all duration-200"
          )}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        </Button>

        {/* Navigation content */}
        <div className={cn(
          "p-4",
          collapsed ? "pt-6" : "pt-4"
        )}>
          <MainNavigation collapsed={collapsed} />
        </div>
      </aside>

      {/* Spacer div to push content to the right */}
      <div className={`hidden md:block ${collapsed ? 'w-16' : 'w-64'}`}></div>
    </div>
  );
};

export default CollapsibleSidebar;
