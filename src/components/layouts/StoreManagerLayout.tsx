import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  LogOut,
  ArrowLeft,
  BarChart,
  Calendar,
  Shield,
  Store
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useHasEntitlement } from '@/lib/entitlements/hooks';
import { useStoreManagerAccess } from '@/hooks/store-manager/useStoreManagerAccess';

const StoreManagerLayout: React.FC = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { result: canManageEvents } = useHasEntitlement('CAN_MANAGE_EVENTS');
  const { result: canViewStoreAnalytics } = useHasEntitlement('CAN_VIEW_STORE_ANALYTICS');
  const { result: canModerateContent } = useHasEntitlement('CAN_MODERATE_CONTENT');
  const { isStoreManager, storeName, loading: storeAccessLoading } = useStoreManagerAccess();

  const handleLogout = async () => {
    await signOut();
  };

  const handleBackToSite = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-bookconnect-cream flex">
      {/* Sidebar */}
      <div className="w-64 bg-bookconnect-terracotta text-white p-6 flex flex-col">
        <div className="mb-8">
          <h1 className="text-2xl font-serif font-bold">Store Manager Panel</h1>
          <p className="text-sm opacity-70">
            {storeName ? `${storeName} Management` : 'Store Management'}
          </p>
        </div>

        <nav className="flex-1 space-y-2">
          {/* Dashboard */}
          <NavLink
            to="/store-manager/dashboard"
            className={({ isActive }) =>
              `flex items-center p-3 rounded-lg ${isActive
                ? 'bg-white/20 text-white'
                : 'text-white/70 hover:bg-white/10'}`
            }
          >
            <LayoutDashboard className="h-5 w-5 mr-3" />
            Dashboard
          </NavLink>

          {/* Analytics */}
          {canViewStoreAnalytics && (
            <NavLink
              to="/store-manager/analytics"
              className={({ isActive }) =>
                `flex items-center p-3 rounded-lg ${isActive
                  ? 'bg-white/20 text-white'
                  : 'text-white/70 hover:bg-white/10'}`
              }
            >
              <BarChart className="h-5 w-5 mr-3" />
              Analytics
            </NavLink>
          )}

          {/* Clubs */}
          <NavLink
            to="/store-manager/clubs"
            className={({ isActive }) =>
              `flex items-center p-3 rounded-lg ${isActive
                ? 'bg-white/20 text-white'
                : 'text-white/70 hover:bg-white/10'}`
            }
          >
            <BookOpen className="h-5 w-5 mr-3" />
            Clubs
          </NavLink>

          {/* Users */}
          <NavLink
            to="/store-manager/users"
            className={({ isActive }) =>
              `flex items-center p-3 rounded-lg ${isActive
                ? 'bg-white/20 text-white'
                : 'text-white/70 hover:bg-white/10'}`
            }
          >
            <Users className="h-5 w-5 mr-3" />
            Users
          </NavLink>

          {/* Moderation */}
          {canModerateContent && (
            <NavLink
              to="/store-manager/moderation"
              className={({ isActive }) =>
                `flex items-center p-3 rounded-lg ${isActive
                  ? 'bg-white/20 text-white'
                  : 'text-white/70 hover:bg-white/10'}`
              }
            >
              <Shield className="h-5 w-5 mr-3" />
              Moderation
            </NavLink>
          )}

          {/* Events */}
          {canManageEvents && (
            <NavLink
              to="/store-manager/events"
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

          {/* Store Context Display */}
          {isStoreManager && !storeAccessLoading && storeName && (
            <div className="pt-4 pb-2 border-t border-white/20">
              <div className="flex items-center px-3 py-2">
                <Store className="h-4 w-4 mr-2 text-white/50" />
                <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">
                  Store Context
                </span>
              </div>
              <p className="px-3 text-xs text-white/40 mb-2">
                Managing: {storeName}
              </p>
            </div>
          )}
        </nav>

        {/* Footer */}
        <div className="space-y-2 pt-4 border-t border-white/20">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackToSite}
            className="w-full justify-start text-white/70 hover:text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Site
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="w-full justify-start text-white/70 hover:text-white hover:bg-white/10"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <main className="flex-1 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default StoreManagerLayout;
