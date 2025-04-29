
import React from 'react';
import NavBar from '@/components/NavBar';
import { Outlet } from 'react-router-dom';
import CollapsibleSidebar from '@/components/navigation/CollapsibleSidebar';

const Layout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <NavBar />
      <div className="flex-1 flex">
        {/* Collapsible Sidebar Navigation */}
        <CollapsibleSidebar />

        {/* Main Content */}
        <main className="flex-1 container mx-auto px-4 py-8 md:ml-16">
          <Outlet />
        </main>
      </div>
      <footer className="bg-gradient-to-r from-bookconnect-cream to-bookconnect-cream/90 border-t border-bookconnect-brown/10 py-6 shadow-[0_-1px_3px_rgba(0,0,0,0.05)]">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <p className="text-sm text-bookconnect-brown/70 font-medium">
                © {new Date().getFullYear()} BookConnect. All rights reserved.
              </p>
            </div>
            <div className="flex space-x-6">
              <a href="#" className="text-sm text-bookconnect-brown/70 hover:text-bookconnect-brown transition-colors duration-200">
                Privacy Policy
              </a>
              <a href="#" className="text-sm text-bookconnect-brown/70 hover:text-bookconnect-brown transition-colors duration-200">
                Terms of Service
              </a>
              <a href="#" className="text-sm text-bookconnect-brown/70 hover:text-bookconnect-brown transition-colors duration-200">
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
