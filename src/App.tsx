import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AdminRouteGuard from "./components/routeguards/AdminRouteGuard";
import MemberRouteGuard from "./components/routeguards/MemberRouteGuard";
import GlobalAdminRouteGuard from "./components/routeguards/GlobalAdminRouteGuard";
import { StoreOwnerRouteGuard } from "./components/routeguards/StoreOwnerRouteGuard";
import { Toaster } from "sonner";
import { AuthProvider } from "./contexts/AuthContext";
import { UserProfileProvider } from "./contexts/UserProfileContext";
import { HelmetProvider } from "react-helmet-async";
import Layout from "./components/Layout";
import AdminLayout from "./components/layouts/AdminLayout";
import Landing from "./pages/Landing";
import Profile from "./pages/Profile";
import UserProfile from "./pages/UserProfile";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Books from "./pages/Books";
import BookDetail from "./pages/BookDetail";
import ExploreBooks from "./pages/ExploreBooks";
import BookDiscussion from "./pages/BookDiscussion";
import ChatSelection from "./pages/ChatSelection";
import BookClub from "./pages/BookClub";
import BookClubListPage from "./pages/BookClubListPage";
import BookClubDetailsPage from "./pages/BookClubDetailsPage";
import BookClubDiscoveryPage from "./pages/BookClubDiscoveryPage";
import BookClubDiscussionsPage from "./pages/BookClubDiscussionsPage";
import BookClubTopicDetailPage from "./pages/BookClubTopicDetailPage";
import BookClubProfilePage from "./pages/BookClubProfilePage";
import EnhancedProfilePage from "./pages/EnhancedProfilePage";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminClubManagementPage from "./pages/admin/AdminClubManagementPage";
import AdminUserListPage from "./pages/admin/AdminUserListPage";
import AdminJoinRequestsPage from "./pages/admin/AdminJoinRequestsPage";
import AdminAnalyticsPage from "./pages/admin/AdminAnalyticsPage";
import AdminEventsPage from "./pages/admin/AdminEventsPage";
import CreateEventPage from "./pages/admin/CreateEventPage";
import EditEventPage from "./pages/admin/EditEventPage";
import ModerationPage from "./pages/admin/ModerationPage";
import { StoreManagementDashboard } from "@/pages/admin/store/StoreManagementDashboard";
import { HeroCustomization } from "@/pages/admin/store/HeroCustomization";
import { LandingPageAnalytics } from "@/pages/admin/store/LandingPageAnalytics";
import CarouselManagement from "@/pages/admin/store/CarouselManagement";
import BannerManagement from "@/pages/admin/store/BannerManagement";
import { QuoteManagement } from "@/pages/admin/store/QuoteManagement";
import { CommunityShowcaseManagement } from "@/pages/admin/store/CommunityShowcaseManagement";
import ReportingSystemTest from "./components/testing/ReportingSystemTest";
// Username validation debug tools removed - issues resolved
import CreateBookClubForm from "./components/bookclubs/CreateBookClubForm";
import CreateTopicForm from "./components/discussions/CreateTopicForm";
import TopicDetail from "./components/discussions/TopicDetail";
import ReplyForm from "./components/discussions/ReplyForm";
import BookClubMembers from "./components/admin/BookClubMembers";
import BookClubSettings from "./components/admin/BookClubSettings";
import ClubManagementPage from "./pages/ClubManagementPage";
import Events from "./pages/Events";
import EventDetailsPage from "./pages/EventDetailsPage";
import BookNominationsPage from "./pages/BookNominationsPage";
import BookNominationFormPage from "./pages/BookNominationFormPage";
import NotFound from "./pages/NotFound";
import Search from "./pages/Search";
import Unauthorized from "./pages/Unauthorized";

// Direct Messaging Components
import { ConversationListPage } from "./components/messaging/pages/ConversationListPage";
import { MessageThreadPage } from "./components/messaging/pages/MessageThreadPage";
import { NewConversationPage } from "./components/messaging/pages/NewConversationPage";
import {
  ConversationListErrorBoundary,
  MessageThreadErrorBoundary,
  NewConversationErrorBoundary
} from "./components/messaging/components/MessagingErrorBoundary";

function App() {
  return (
    <>
      <HelmetProvider>
        <BrowserRouter>
          <AuthProvider>
            <UserProfileProvider>
            <Routes>
            {/* Public routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* Main layout routes */}
            <Route element={<Layout />}>
              <Route path="/profile" element={<EnhancedProfilePage />} />
              <Route path="/user/:username" element={<BookClubProfilePage />} />
              {/* Add a route that accepts user ID for profile links */}
              <Route path="/profile/:userId" element={<BookClubProfilePage />} />
              <Route path="/books" element={<Books />} />
              <Route path="/books/:id" element={<BookDetail />} />
              <Route path="/book/:id" element={<BookDetail />} />
              <Route path="/events" element={<Events />} />
              <Route path="/events/:eventId" element={<EventDetailsPage />} />
              <Route path="/search" element={<Search />} />

              {/* Direct Messaging Routes */}
              <Route path="/messages" element={
                <ConversationListErrorBoundary>
                  <ConversationListPage />
                </ConversationListErrorBoundary>
              } />
              <Route path="/messages/new" element={
                <NewConversationErrorBoundary>
                  <NewConversationPage />
                </NewConversationErrorBoundary>
              } />
              <Route path="/messages/:conversationId" element={
                <MessageThreadErrorBoundary>
                  <MessageThreadPage />
                </MessageThreadErrorBoundary>
              } />
            </Route>

            {/* Routes outside main layout - Anonymous Chat Section */}
            <Route path="/explore-books" element={<ExploreBooks />} />
            <Route path="/chat-selection" element={<ChatSelection />} />
            <Route path="/book-discussion/:id" element={<BookDiscussion />} />

            {/* Book Club Routes */}
            <Route element={<Layout />}>
              <Route path="/book-club" element={<BookClubListPage />} />
              <Route path="/book-clubs" element={<Navigate to="/book-club" replace />} />
              <Route path="/discover-clubs" element={<BookClubDiscoveryPage />} />
              <Route path="/book-club/new" element={<CreateBookClubForm />} />
              <Route path="/book-club/:clubId" element={<BookClubDetailsPage />} />
              <Route path="/book-club/:clubId/nominations" element={<BookNominationsPage />} />
              <Route path="/book-club/:clubId/nominations/new" element={<BookNominationFormPage />} />
            </Route>

            {/* Member-protected routes */}
            <Route element={<Layout />}>
              <Route path="/book-club/:clubId/discussions" element={
                <MemberRouteGuard>
                  <BookClubDiscussionsPage />
                </MemberRouteGuard>
              } />
              <Route path="/book-club/:clubId/discussions/new" element={
                <MemberRouteGuard>
                  <CreateTopicForm />
                </MemberRouteGuard>
              } />
              <Route path="/book-club/:clubId/discussions/:topicId" element={
                <MemberRouteGuard>
                  <BookClubTopicDetailPage />
                </MemberRouteGuard>
              } />
              <Route path="/book-club/:clubId/discussions/:topicId/reply" element={
                <MemberRouteGuard>
                  <ReplyForm />
                </MemberRouteGuard>
              } />
            </Route>

            {/* Club Admin-protected routes */}
            <Route element={<Layout />}>
              <Route path="/book-club/:clubId/manage" element={
                <AdminRouteGuard>
                  <ClubManagementPage />
                </AdminRouteGuard>
              } />
              <Route path="/book-club/:clubId/members" element={
                <AdminRouteGuard>
                  <BookClubMembers />
                </AdminRouteGuard>
              } />
              <Route path="/book-club/:clubId/settings" element={
                <AdminRouteGuard>
                  <BookClubSettings />
                </AdminRouteGuard>
              } />
            </Route>

            {/* Legacy admin dashboard (to be deprecated) */}
            <Route path="/admin-dashboard" element={<Navigate to="/admin/dashboard" replace />} />

            {/* New Admin Routes with Global Admin Guard */}
            <Route path="/admin" element={
              <GlobalAdminRouteGuard>
                <AdminLayout />
              </GlobalAdminRouteGuard>
            }>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboardPage />} />
              <Route path="analytics" element={<AdminAnalyticsPage />} />
              <Route path="clubs" element={<AdminClubManagementPage />} />
              <Route path="users" element={<AdminUserListPage />} />
              <Route path="requests" element={<AdminJoinRequestsPage />} />
              <Route path="events" element={<AdminEventsPage />} />
              <Route path="events/create" element={<CreateEventPage />} />
              <Route path="events/edit/:eventId" element={<EditEventPage />} />
              <Route path="moderation" element={<ModerationPage />} />
              <Route path="test-reporting" element={<ReportingSystemTest />} />
              {/* Username debug route removed - validation issues resolved */}

              {/* Store Management Routes - Store Owner Only */}
              <Route path="store-management/*" element={
                <StoreOwnerRouteGuard>
                  <Routes>
                    <Route index element={<Navigate to="landing-page" replace />} />
                    <Route path="landing-page" element={<StoreManagementDashboard />} />
                    <Route path="hero" element={<HeroCustomization />} />
                    <Route path="carousel" element={<CarouselManagement />} />
                    <Route path="banners" element={<BannerManagement />} />
                    <Route path="community" element={<CommunityShowcaseManagement />} />
                    <Route path="quotes" element={<QuoteManagement />} />
                    <Route path="analytics" element={<LandingPageAnalytics />} />
                  </Routes>
                </StoreOwnerRouteGuard>
              } />
            </Route>

            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
            </Routes>
            </UserProfileProvider>
          </AuthProvider>
          <Toaster />
        </BrowserRouter>
      </HelmetProvider>
    </>
  );
}

export default App;
