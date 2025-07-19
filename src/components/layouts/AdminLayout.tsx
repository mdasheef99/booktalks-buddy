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
  Store,
  Settings,
  Image,
  MessageSquare,
  Quote,
  TrendingUp,
  Package,
  Search,
  CreditCard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useHasEntitlement } from '@/lib/entitlements/hooks';
import { useStoreOwnerAccess } from '@/hooks/useStoreOwnerAccess';

const AdminLayout: React.FC = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { result: canManageEvents } = useHasEntitlement('CAN_MANAGE_EVENTS');
  const { isStoreOwner, storeName, loading: storeAccessLoading } = useStoreOwnerAccess();

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
            to="/admin/moderation"
            className={({ isActive }) =>
              `flex items-center p-3 rounded-lg ${isActive
                ? 'bg-white/20 text-white'
                : 'text-white/70 hover:bg-white/10'}`
            }
          >
            <Shield className="h-5 w-5 mr-3" />
            Moderation
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

          {/* Store Management Section - Only for Store Owners */}
          {isStoreOwner && !storeAccessLoading && (
            <>
              <div className="pt-4 pb-2 border-t border-white/20">
                <div className="flex items-center px-3 py-2">
                  <Store className="h-4 w-4 mr-2 text-white/50" />
                  <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">
                    Store Management
                  </span>
                </div>
                {storeName && (
                  <p className="px-3 text-xs text-white/40 mb-2">
                    {storeName}
                  </p>
                )}
              </div>

              <NavLink
                to="/admin/subscriptions"
                className={({ isActive }) =>
                  `flex items-center p-3 rounded-lg ${isActive
                    ? 'bg-white/20 text-white'
                    : 'text-white/70 hover:bg-white/10'}`
                }
              >
                <CreditCard className="h-5 w-5 mr-3" />
                Subscription Management
              </NavLink>

              <NavLink
                to="/admin/store-management"
                className={({ isActive }) =>
                  `flex items-center p-3 rounded-lg ${isActive
                    ? 'bg-white/20 text-white'
                    : 'text-white/70 hover:bg-white/10'}`
                }
              >
                <Settings className="h-5 w-5 mr-3" />
                Landing Page
              </NavLink>

              <NavLink
                to="/admin/store-management/carousel"
                className={({ isActive }) =>
                  `flex items-center p-3 rounded-lg ml-4 ${isActive
                    ? 'bg-white/20 text-white'
                    : 'text-white/70 hover:bg-white/10'}`
                }
              >
                <Image className="h-4 w-4 mr-3" />
                Carousel
              </NavLink>

              <NavLink
                to="/admin/store-management/banners"
                className={({ isActive }) =>
                  `flex items-center p-3 rounded-lg ml-4 ${isActive
                    ? 'bg-white/20 text-white'
                    : 'text-white/70 hover:bg-white/10'}`
                }
              >
                <MessageSquare className="h-4 w-4 mr-3" />
                Banners
              </NavLink>

              <NavLink
                to="/admin/store-management/community"
                className={({ isActive }) =>
                  `flex items-center p-3 rounded-lg ml-4 ${isActive
                    ? 'bg-white/20 text-white'
                    : 'text-white/70 hover:bg-white/10'}`
                }
              >
                <Users className="h-4 w-4 mr-3" />
                Community
              </NavLink>

              <NavLink
                to="/admin/store-management/quotes"
                className={({ isActive }) =>
                  `flex items-center p-3 rounded-lg ml-4 ${isActive
                    ? 'bg-white/20 text-white'
                    : 'text-white/70 hover:bg-white/10'}`
                }
              >
                <Quote className="h-4 w-4 mr-3" />
                Quotes
              </NavLink>

              <NavLink
                to="/admin/store-management/book-listings"
                className={({ isActive }) =>
                  `flex items-center p-3 rounded-lg ml-4 ${isActive
                    ? 'bg-white/20 text-white'
                    : 'text-white/70 hover:bg-white/10'}`
                }
              >
                <Package className="h-4 w-4 mr-3" />
                Book Listings
              </NavLink>

              <NavLink
                to="/admin/store-management/book-availability-requests"
                className={({ isActive }) =>
                  `flex items-center p-3 rounded-lg ml-4 ${isActive
                    ? 'bg-white/20 text-white'
                    : 'text-white/70 hover:bg-white/10'}`
                }
              >
                <Search className="h-4 w-4 mr-3" />
                Book Requests
              </NavLink>

              <NavLink
                to="/admin/store-management/analytics"
                className={({ isActive }) =>
                  `flex items-center p-3 rounded-lg ml-4 ${isActive
                    ? 'bg-white/20 text-white'
                    : 'text-white/70 hover:bg-white/10'}`
                }
              >
                <TrendingUp className="h-4 w-4 mr-3" />
                Landing Analytics
              </NavLink>

              <NavLink
                to="/admin/store-management/book-club-analytics"
                className={({ isActive }) =>
                  `flex items-center p-3 rounded-lg ml-4 ${isActive
                    ? 'bg-white/20 text-white'
                    : 'text-white/70 hover:bg-white/10'}`
                }
              >
                <BookOpen className="h-4 w-4 mr-3" />
                Book Club Analytics
              </NavLink>
            </>
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
