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

const MainNavigation: React.FC = () => {
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

  return (
    <nav className="flex flex-col h-full">
      <div className="space-y-1 flex-1">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex items-center p-2 rounded-lg ${isActive
              ? 'bg-bookconnect-brown/10 text-bookconnect-brown'
              : 'text-gray-700 hover:bg-bookconnect-brown/5'}`
          }
        >
          <Home className="h-5 w-5 mr-3" />
          Home
        </NavLink>

        <NavLink
          to="/books"
          className={({ isActive }) =>
            `flex items-center p-2 rounded-lg ${isActive
              ? 'bg-bookconnect-brown/10 text-bookconnect-brown'
              : 'text-gray-700 hover:bg-bookconnect-brown/5'}`
          }
        >
          <BookOpen className="h-5 w-5 mr-3" />
          Books
        </NavLink>

        <NavLink
          to="/book-club"
          className={({ isActive }) =>
            `flex items-center p-2 rounded-lg ${isActive
              ? 'bg-bookconnect-brown/10 text-bookconnect-brown'
              : 'text-gray-700 hover:bg-bookconnect-brown/5'}`
          }
        >
          <Users className="h-5 w-5 mr-3" />
          Book Clubs
        </NavLink>

        <NavLink
          to="/events"
          className={({ isActive }) =>
            `flex items-center p-2 rounded-lg ${isActive
              ? 'bg-bookconnect-brown/10 text-bookconnect-brown'
              : 'text-gray-700 hover:bg-bookconnect-brown/5'}`
          }
        >
          <Calendar className="h-5 w-5 mr-3" />
          Events
        </NavLink>

        <NavLink
          to="/search"
          className={({ isActive }) =>
            `flex items-center p-2 rounded-lg ${isActive
              ? 'bg-bookconnect-brown/10 text-bookconnect-brown'
              : 'text-gray-700 hover:bg-bookconnect-brown/5'}`
          }
        >
          <SearchIcon className="h-5 w-5 mr-3" />
          Search
        </NavLink>
      </div>

      {user && (
        <div className="pt-4 border-t border-gray-200 space-y-1">
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `flex items-center p-2 rounded-lg ${isActive
                ? 'bg-bookconnect-brown/10 text-bookconnect-brown'
                : 'text-gray-700 hover:bg-bookconnect-brown/5'}`
            }
          >
            <User className="h-5 w-5 mr-3" />
            Profile
          </NavLink>

          {isAdmin && (
            <NavLink
              to="/admin/dashboard"
              className={({ isActive }) =>
                `flex items-center p-2 rounded-lg ${isActive
                  ? 'bg-bookconnect-brown/10 text-bookconnect-brown'
                  : 'text-gray-700 hover:bg-bookconnect-brown/5'}`
              }
            >
              <Settings className="h-5 w-5 mr-3" />
              Admin Panel
            </NavLink>
          )}

          <Button
            onClick={handleLogout}
            variant="ghost"
            className="flex items-center p-2 rounded-lg w-full justify-start text-gray-700 hover:bg-bookconnect-brown/5"
          >
            <LogOut className="h-5 w-5 mr-3" />
            Logout
          </Button>


        </div>
      )}
    </nav>
  );
};

export default MainNavigation;
