import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Settings, Users, Shield, MessageSquare, Book, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useCanManageClub } from '@/lib/entitlements/hooks';
import { supabase } from '@/lib/supabase';
import ClubManagementErrorBoundary from '@/components/clubManagement/ClubManagementErrorBoundary';
import { useAnalyticsAccess } from '@/hooks/useClubManagement';
import AnalyticsDashboard from '@/components/clubManagement/analytics/AnalyticsDashboard';
import ModeratorPermissionsPanel from '@/components/clubManagement/moderators/ModeratorPermissionsPanel';
import EventsSection from '@/components/clubManagement/events/EventsSection';

// Import existing management panels
import ClubSettingsPanel from '@/components/bookclubs/management/ClubSettingsPanel';
import MemberManagementPanel from '@/components/bookclubs/management/MemberManagementPanel';
import ContentModerationPanel from '@/components/bookclubs/management/ContentModerationPanel';
import CurrentBookPanel from '@/components/bookclubs/management/CurrentBookPanel';

interface ClubManagementPageProps {}

/**
 * Club Management Page Component
 *
 * This is the dedicated page for managing book clubs, converted from the popup-based system.
 * It provides a comprehensive interface for club leads to manage all aspects of their club.
 */
const ClubManagementPage: React.FC<ClubManagementPageProps> = () => {
  const { clubId } = useParams<{ clubId: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [clubName, setClubName] = useState<string>('');
  const [loadingClubName, setLoadingClubName] = useState(true);

  // Get the store ID for the club dynamically
  const [storeId, setStoreId] = useState<string | null>(null);
  const [fetchingStoreId, setFetchingStoreId] = useState(true);

  React.useEffect(() => {
    const fetchClubData = async () => {
      if (!clubId) {
        setFetchingStoreId(false);
        setLoadingClubName(false);
        return;
      }

      try {
        const { data: club } = await supabase
          .from('book_clubs')
          .select('store_id, name')
          .eq('id', clubId)
          .single();

        setStoreId(club?.store_id || null);
        setClubName(club?.name || 'Book Club');
      } catch (error) {
        console.error('Error fetching club data:', error);
        setStoreId(null);
        setClubName('Book Club');
      } finally {
        setFetchingStoreId(false);
        setLoadingClubName(false);
      }
    };

    fetchClubData();
  }, [clubId]);

  // Check if the user can manage this club using entitlements
  const { result: canManage, loading: loadingPermissions } = useCanManageClub(
    clubId || '',
    storeId || ''
  );

  // Get analytics access for current user
  const { hasAccess: hasAnalyticsAccess, loading: analyticsAccessLoading } = useAnalyticsAccess(clubId || '');

  const isLoading = authLoading || loadingPermissions || fetchingStoreId || loadingClubName;

  // Show loading state while checking permissions
  if (isLoading) {
    return (
      <div className="min-h-screen bg-bookconnect-cream">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="animate-pulse text-center">
                <div className="h-12 w-12 rounded-full bg-gray-300 mb-4 mx-auto"></div>
                <div className="h-4 w-32 bg-gray-300 mx-auto"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Redirect if not logged in
  if (!user) {
    navigate('/login');
    return null;
  }

  // Handle missing club ID
  if (!clubId) {
    navigate('/book-club');
    return null;
  }

  // Check if the user can manage this club
  if (!canManage) {
    navigate('/unauthorized');
    return null;
  }

  const handleBackToClub = () => {
    navigate(`/book-club/${clubId}`);
  };

  return (
    <div className="min-h-screen bg-bookconnect-cream">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header with breadcrumb navigation */}
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-4">
              <Button
                variant="ghost"
                onClick={handleBackToClub}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Club
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Club Management</h1>
                <p className="text-gray-600 mt-1">
                  Manage settings, members, and content for {clubName}
                </p>
              </div>
            </div>
          </div>

          {/* Management Interface */}
          <Card className="shadow-lg">
            <CardContent className="p-6">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-7 mb-6 h-auto">
                  <TabsTrigger value="overview" className="flex flex-col items-center gap-1 py-3">
                    <Settings className="h-4 w-4" />
                    <span className="text-xs">Overview</span>
                  </TabsTrigger>
                  <TabsTrigger value="events" className="flex flex-col items-center gap-1 py-3">
                    <Calendar className="h-4 w-4" />
                    <span className="text-xs">Events</span>
                  </TabsTrigger>
                  <TabsTrigger value="settings" className="flex flex-col items-center gap-1 py-3">
                    <Settings className="h-4 w-4" />
                    <span className="text-xs">Settings</span>
                  </TabsTrigger>
                  <TabsTrigger value="members" className="flex flex-col items-center gap-1 py-3">
                    <Users className="h-4 w-4" />
                    <span className="text-xs">Members</span>
                  </TabsTrigger>
                  <TabsTrigger value="moderators" className="flex flex-col items-center gap-1 py-3">
                    <Shield className="h-4 w-4" />
                    <span className="text-xs">Moderators</span>
                  </TabsTrigger>
                  <TabsTrigger value="content" className="flex flex-col items-center gap-1 py-3">
                    <MessageSquare className="h-4 w-4" />
                    <span className="text-xs">Content</span>
                  </TabsTrigger>
                  <TabsTrigger value="current-book" className="flex flex-col items-center gap-1 py-3">
                    <Book className="h-4 w-4" />
                    <span className="text-xs">Current Book</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                  <AnalyticsDashboard
                    clubId={clubId}
                    canViewAnalytics={hasAnalyticsAccess || canManage}
                    isClubLead={canManage}
                  />
                </TabsContent>

                <TabsContent value="events" className="space-y-4">
                  <ClubManagementErrorBoundary feature="Events" clubId={clubId}>
                    <EventsSection clubId={clubId} />
                  </ClubManagementErrorBoundary>
                </TabsContent>

                <TabsContent value="settings" className="space-y-4">
                  <ClubManagementErrorBoundary feature="Settings" clubId={clubId}>
                    <ClubSettingsPanel clubId={clubId} />
                  </ClubManagementErrorBoundary>
                </TabsContent>

                <TabsContent value="members" className="space-y-4">
                  <ClubManagementErrorBoundary feature="Members" clubId={clubId}>
                    <MemberManagementPanel clubId={clubId} />
                  </ClubManagementErrorBoundary>
                </TabsContent>

                <TabsContent value="moderators" className="space-y-4">
                  <ClubManagementErrorBoundary feature="Moderators" clubId={clubId}>
                    <ModeratorPermissionsPanel clubId={clubId} isClubLead={canManage} />
                  </ClubManagementErrorBoundary>
                </TabsContent>

                <TabsContent value="content" className="space-y-4">
                  <ClubManagementErrorBoundary feature="Content" clubId={clubId}>
                    <ContentModerationPanel clubId={clubId} />
                  </ClubManagementErrorBoundary>
                </TabsContent>

                <TabsContent value="current-book" className="space-y-4">
                  <ClubManagementErrorBoundary feature="Current Book" clubId={clubId}>
                    <CurrentBookPanel clubId={clubId} />
                  </ClubManagementErrorBoundary>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ClubManagementPage;
