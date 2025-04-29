import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Home,
  BookOpen,
  Users,
  Calendar,
  Search as SearchIcon,
  User,
  Settings,
  LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface MainNavigationProps {
  collapsed?: boolean;
}

const MainNavigation: React.FC<MainNavigationProps> = ({ collapsed = false }) => {
  const { user, signOut, clubRoles } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = React.useState(false);

  React.useEffect(() => {
    // Check if user is an admin in any club based on clubRoles
    if (user && Object.values(clubRoles).includes('admin')) {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }
  }, [user, clubRoles]);

  const handleLogout = async () => {
    await signOut();
  };

  // Helper function to render nav links with tooltips when collapsed
  const renderNavLink = (to: string, icon: React.ReactNode, label: string) => {
    const linkContent = (isActive: boolean) => (
      <div className={`
        flex items-center p-2 rounded-lg
        ${isActive
          ? 'bg-bookconnect-brown/15 text-bookconnect-brown shadow-sm border border-bookconnect-brown/10'
          : 'text-gray-700 hover:bg-bookconnect-brown/5 hover:border hover:border-bookconnect-brown/5'}
        ${collapsed ? 'justify-center' : ''}
        transition-all duration-200
      `}>
        <div className={`${isActive ? 'text-bookconnect-brown' : 'text-bookconnect-brown/70'}`}>
          {icon}
        </div>
        {!collapsed && <span className={`ml-3 font-medium ${isActive ? 'text-bookconnect-brown' : 'text-gray-700'}`}>{label}</span>}
      </div>
    );

    return collapsed ? (
      <TooltipProvider key={to}>
        <Tooltip>
          <TooltipTrigger asChild>
            <NavLink to={to} className={({ isActive }) => linkContent(isActive)}>
              {({ isActive }) => linkContent(isActive)}
            </NavLink>
          </TooltipTrigger>
          <TooltipContent side="right">{label}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    ) : (
      <NavLink key={to} to={to} className={({ isActive }) => linkContent(isActive)}>
        {({ isActive }) => linkContent(isActive)}
      </NavLink>
    );
  };

  return (
    <nav className="flex flex-col h-full">
      <div className="space-y-1 flex-1">
        {renderNavLink("/", <Home className="h-5 w-5" />, "Home")}
        {renderNavLink("/books", <BookOpen className="h-5 w-5" />, "Books")}
        {renderNavLink("/book-club", <Users className="h-5 w-5" />, "Book Clubs")}
        {renderNavLink("/events", <Calendar className="h-5 w-5" />, "Events")}
        {renderNavLink("/search", <SearchIcon className="h-5 w-5" />, "Search")}
      </div>

      {user && (
        <div className="pt-4 border-t border-gray-200 space-y-1">
          {renderNavLink("/profile", <User className="h-5 w-5" />, "Profile")}

          {isAdmin && renderNavLink("/admin/dashboard", <Settings className="h-5 w-5" />, "Admin Panel")}

          {collapsed ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={handleLogout}
                    variant="ghost"
                    className={`
                      w-full p-2 rounded-lg
                      text-bookconnect-brown/70 hover:text-bookconnect-brown
                      hover:bg-bookconnect-brown/5 hover:border hover:border-bookconnect-brown/5
                      transition-all duration-200
                      ${collapsed ? 'justify-center' : 'justify-start'}
                    `}
                  >
                    <LogOut className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Logout</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <Button
              onClick={handleLogout}
              variant="ghost"
              className="
                w-full justify-start p-2 rounded-lg
                font-medium text-gray-700
                hover:bg-bookconnect-brown/5 hover:text-bookconnect-brown
                hover:border hover:border-bookconnect-brown/5
                transition-all duration-200
              "
            >
              <div className="text-bookconnect-brown/70">
                <LogOut className="h-5 w-5 mr-3" />
              </div>
              Logout
            </Button>
          )}
        </div>
      )}
    </nav>
  );
};

export default MainNavigation;
