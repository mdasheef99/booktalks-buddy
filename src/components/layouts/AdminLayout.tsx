import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  UserPlus,
  LogOut,
  ArrowLeft,
  BarChart,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useHasEntitlement } from '@/lib/entitlements/hooks';

const AdminLayout: React.FC = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { result: canManageEvents } = useHasEntitlement('CAN_MANAGE_EVENTS');

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-bookconnect-cream flex">
      {/* Sidebar */}
      <div className="w-64 bg-bookconnect-brown text-white p-6 flex flex-col">
        <div className="mb-8">
          <h1 className="text-2xl font-serif font-bold">Admin Panel</h1>
          <p className="text-sm opacity-70">BookConnect Management</p>
        </div>

        <nav className="flex-1 space-y-2">
          <NavLink
            to="/admin/dashboard"
            className={({ isActive }) =>
              `flex items-center p-3 rounded-lg ${isActive
                ? 'bg-white/20 text-white'
                : 'text-white/70 hover:bg-white/10'}`
            }
          >
            <LayoutDashboard className="h-5 w-5 mr-3" />
            Dashboard
          </NavLink>

          <NavLink
            to="/admin/analytics"
            className={({ isActive }) =>
              `flex items-center p-3 rounded-lg ${isActive
                ? 'bg-white/20 text-white'
                : 'text-white/70 hover:bg-white/10'}`
            }
          >
            <BarChart className="h-5 w-5 mr-3" />
            Analytics
          </NavLink>

          <NavLink
            to="/admin/clubs"
            className={({ isActive }) =>
              `flex items-center p-3 rounded-lg ${isActive
                ? 'bg-white/20 text-white'
                : 'text-white/70 hover:bg-white/10'}`
            }
          >
            <BookOpen className="h-5 w-5 mr-3" />
            Clubs
          </NavLink>

          <NavLink
            to="/admin/users"
            className={({ isActive }) =>
              `flex items-center p-3 rounded-lg ${isActive
                ? 'bg-white/20 text-white'
                : 'text-white/70 hover:bg-white/10'}`
            }
          >
            <Users className="h-5 w-5 mr-3" />
            Users
          </NavLink>

          <NavLink
            to="/admin/requests"
            className={({ isActive }) =>
              `flex items-center p-3 rounded-lg ${isActive
                ? 'bg-white/20 text-white'
                : 'text-white/70 hover:bg-white/10'}`
            }
          >
            <UserPlus className="h-5 w-5 mr-3" />
            Join Requests
          </NavLink>

          {canManageEvents && (
            <NavLink
              to="/admin/events"
              className={({ isActive }) =>
                `flex items-center p-3 rounded-lg ${isActive
                  ? 'bg-white/20 text-white'
                  : 'text-white/70 hover:bg-white/10'}`
              }
            >
              <Calendar className="h-5 w-5 mr-3" />
              Events
            </NavLink>
          )}
        </nav>

        <div className="pt-6 border-t border-white/20 space-y-2">
          <Button
            variant="ghost"
            className="w-full justify-start text-white/70 hover:bg-white/10 hover:text-white p-3"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="h-5 w-5 mr-3" />
            Back to Site
          </Button>

          <Button
            variant="ghost"
            className="w-full justify-start text-white/70 hover:bg-white/10 hover:text-white p-3"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5 mr-3" />
            Logout
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
