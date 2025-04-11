
import React from 'react';
import NavBar from '@/components/NavBar';
import { Outlet } from 'react-router-dom';
import MainNavigation from '@/components/navigation/MainNavigation';

const Layout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <NavBar />
      <div className="flex-1 flex">
        {/* Sidebar Navigation */}
        <aside className="hidden md:block w-64 border-r p-4 bg-bookconnect-cream/50">
          <MainNavigation />
        </aside>

        {/* Main Content */}
        <main className="flex-1 container mx-auto px-4 py-8">
          <Outlet />
        </main>
      </div>
      <footer className="bg-card border-t py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <p className="text-sm text-muted-foreground">
                © {new Date().getFullYear()} BookConnect. All rights reserved.
              </p>
            </div>
            <div className="flex space-x-6">
              <a href="#" className="text-sm text-muted-foreground hover:text-primary">
                Privacy Policy
              </a>
              <a href="#" className="text-sm text-muted-foreground hover:text-primary">
                Terms of Service
              </a>
              <a href="#" className="text-sm text-muted-foreground hover:text-primary">
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
