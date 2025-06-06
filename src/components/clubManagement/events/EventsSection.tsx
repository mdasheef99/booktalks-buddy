/**
 * Events Section Component
 *
 * Main events management section for the Club Management page.
 * Displays upcoming meetings, allows creation/editing, and shows event analytics.
 */

import React, { useState } from 'react';
import { Plus, Calendar, Clock, Users, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useClubEvents, useClubMeetingAnalytics } from '@/hooks/clubManagement/useClubEvents';
import { useAuth } from '@/contexts/AuthContext';
import ClubManagementErrorBoundary from '../ClubManagementErrorBoundary';
import EventsList from './EventsList';
import EventCreationModal from './EventCreationModal';
import EventsLoadingSkeleton from './EventsLoadingSkeleton';
import RSVPAnalyticsOverview from './RSVPAnalyticsOverview';
import EventAnalyticsCard from './EventAnalyticsCard';

// =====================================================
// Types
// =====================================================

interface EventsSectionProps {
  clubId: string;
}

// =====================================================
// Events Section Component
// =====================================================

const EventsSection: React.FC<EventsSectionProps> = ({ clubId }) => {
  const [activeTab, setActiveTab] = useState('upcoming');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { user } = useAuth();

  // Hooks for data management
  const upcomingEvents = useClubEvents(clubId, { upcoming: true, limit: 10 });
  const allEvents = useClubEvents(clubId, { upcoming: false, limit: 50 });
  const meetingAnalytics = useClubMeetingAnalytics(clubId);

  // Determine which events to show based on active tab
  const currentEvents = activeTab === 'upcoming' ? upcomingEvents : allEvents;

  // Loading state
  if (currentEvents.loading && currentEvents.meetings.length === 0) {
    return (
      <ClubManagementErrorBoundary feature="Events" clubId={clubId}>
        <EventsLoadingSkeleton />
      </ClubManagementErrorBoundary>
    );
  }

  // Error state
  if (currentEvents.error) {
    return (
      <ClubManagementErrorBoundary feature="Events" clubId={clubId}>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to Load Events</h3>
              <p className="text-gray-600 mb-4">{currentEvents.error}</p>
              <Button onClick={currentEvents.refresh} variant="outline">
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </ClubManagementErrorBoundary>
    );
  }

  return (
    <ClubManagementErrorBoundary feature="Events" clubId={clubId}>
      <div className="space-y-6">
        {/* Header with Create Button */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Club Events & Meetings</h2>
            <p className="text-gray-600 mt-1">
              Manage club meetings, events, and member notifications
            </p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Create Meeting
          </Button>
        </div>

        {/* Analytics Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <EventAnalyticsCard
            analytics={meetingAnalytics.analytics}
            loading={meetingAnalytics.loading}
            error={meetingAnalytics.error}
            onRefresh={meetingAnalytics.refresh}
          />
          <RSVPAnalyticsOverview
            clubId={clubId}
          />
        </div>

        {/* Events Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upcoming" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Upcoming Events
              {upcomingEvents.meetings.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {upcomingEvents.meetings.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="all" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              All Events
              {allEvents.meetings.length > 0 && (
                <Badge variant="outline" className="ml-1">
                  {allEvents.meetings.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Upcoming Meetings
                </CardTitle>
                <CardDescription>
                  Meetings scheduled for the future
                </CardDescription>
              </CardHeader>
              <CardContent>
                <EventsList
                  events={upcomingEvents.meetings}
                  loading={upcomingEvents.loading}
                  error={upcomingEvents.error}
                  onRefresh={upcomingEvents.refresh}
                  onEventUpdate={upcomingEvents.updateMeeting}
                  onEventDelete={upcomingEvents.deleteMeeting}
                  clubId={clubId}
                  emptyMessage="No upcoming meetings scheduled"
                  emptyDescription="Create your first meeting to get started"
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="all" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  All Meetings
                </CardTitle>
                <CardDescription>
                  Complete history of club meetings and events
                </CardDescription>
              </CardHeader>
              <CardContent>
                <EventsList
                  events={allEvents.meetings}
                  loading={allEvents.loading}
                  error={allEvents.error}
                  onRefresh={allEvents.refresh}
                  onEventUpdate={allEvents.updateMeeting}
                  onEventDelete={allEvents.deleteMeeting}
                  clubId={clubId}
                  emptyMessage="No meetings found"
                  emptyDescription="Create your first meeting to get started"
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Create Meeting Modal */}
        <EventCreationModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onEventCreated={(newEvent) => {
            // Refresh both upcoming and all events
            upcomingEvents.refresh();
            allEvents.refresh();
            meetingAnalytics.refresh();
            setShowCreateModal(false);
          }}
          clubId={clubId}
        />
      </div>
    </ClubManagementErrorBoundary>
  );
};

export default EventsSection;
