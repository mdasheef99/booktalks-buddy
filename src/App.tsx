import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AdminRouteGuard from "./components/routeguards/AdminRouteGuard";
import MemberRouteGuard from "./components/routeguards/MemberRouteGuard";
import GlobalAdminRouteGuard from "./components/routeguards/GlobalAdminRouteGuard";
import { StoreOwnerRouteGuard } from "./components/routeguards/StoreOwnerRouteGuard";
import { StoreManagerRouteGuard } from "./components/routeguards/StoreManagerRouteGuard";

import { Toaster } from "sonner";
import { AuthProvider } from "./contexts/AuthContext";
import { AlertProvider } from "./contexts/AlertContext";
import { UserProfileProvider } from "./contexts/UserProfileContext";
import { SuspensionModalProvider } from "./contexts/SuspensionModalContext";
import { HelmetProvider } from "react-helmet-async";
import Layout from "./components/Layout";
import AdminLayout from "./components/layouts/AdminLayout";
import StoreManagerLayout from "./components/layouts/StoreManagerLayout";
import Landing from "./pages/Landing";
import Offers from "./pages/Offers";
import Profile from "./pages/Profile";
import UserProfile from "./pages/UserProfile";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Books from "./pages/Books";
import BooksSection from "./pages/BooksSection";
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
import LegacyProfileRedirect from "./components/routing/LegacyProfileRedirect";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminClubManagementPage from "./pages/admin/AdminClubManagementPage";
import AdminUserListPage from "./pages/admin/AdminUserListPage";
import AdminJoinRequestsPage from "./pages/admin/AdminJoinRequestsPage";
import AdminAnalyticsPage from "./pages/admin/AdminAnalyticsPage";
import AdminEventsPage from "./pages/admin/AdminEventsPage";

// Store Manager Pages
import StoreManagerDashboardPage from "./pages/store-manager/StoreManagerDashboardPage";
import StoreManagerAnalyticsPage from "./pages/store-manager/StoreManagerAnalyticsPage";
import StoreManagerUsersPage from "./pages/store-manager/StoreManagerUsersPage";
import StoreManagerClubsPage from "./pages/store-manager/StoreManagerClubsPage";
import StoreManagerModerationPage from "./pages/store-manager/StoreManagerModerationPage";
import StoreManagerEventsPage from "./pages/store-manager/StoreManagerEventsPage";
import StoreManagerCreateEventPage from "./pages/store-manager/StoreManagerCreateEventPage";
import StoreManagerEditEventPage from "./pages/store-manager/StoreManagerEditEventPage";
import CreateEventPage from "./pages/admin/CreateEventPage";
import EditEventPage from "./pages/admin/EditEventPage";
import ModerationPage from "./pages/admin/ModerationPage";
import SubscriptionManagementPage from "./pages/admin/SubscriptionManagementPage";
import SelfDeletionRequests from "./components/admin/SelfDeletionRequests";
import EntitlementsDebug from "./pages/debug/EntitlementsDebug";
import { StoreManagementDashboard } from "@/pages/admin/store/StoreManagementDashboard";
import { HeroCustomization } from "@/pages/admin/store/HeroCustomization";
import { LandingPageAnalytics } from "@/pages/admin/store/LandingPageAnalytics";
import { BookClubAnalytics } from "@/pages/admin/store/BookClubAnalytics";
import CarouselManagement from "@/pages/admin/store/CarouselManagement";
import BannerManagement from "@/pages/admin/store/BannerManagement";
import { QuoteManagement } from "@/pages/admin/store/QuoteManagement";
import { CommunityShowcaseManagement } from "@/pages/admin/store/CommunityShowcaseManagement";
import BookListingsManagement from "@/pages/admin/store/BookListingsManagement";
import BookAvailabilityRequestsManagement from "@/pages/admin/store/BookAvailabilityRequestsManagement";
import StoreManagersManagement from "@/pages/admin/store/StoreManagersManagement";
import ReportingSystemTest from "./components/testing/ReportingSystemTest";
import { AlertSystemTest } from "./components/testing/AlertSystemTest";
import { SubscriptionDebugger } from "./components/testing/SubscriptionDebugger";
import { SubscriptionAlertTest } from "./components/testing/SubscriptionAlertTest";
import ToastTest from "./components/testing/ToastTest";
import RoleAccessDeniedTest from "./components/testing/RoleAccessDeniedTest";
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
import BookRequestPage from "./pages/BookRequestPage";
import BookListingPage from "./pages/BookListingPage";
import NotFound from "./pages/NotFound";
import Search from "./pages/Search";
import Unauthorized from "./pages/Unauthorized";
import { SuspensionModal } from "./components/modals/SuspensionModal";


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
          <SuspensionModalProvider>
            <AuthProvider>
              <AlertProvider>
                <UserProfileProvider>
            <Routes>
            {/* Public routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/offers" element={<Offers />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/unauthorized" element={<Unauthorized />} />


            {/* Legacy profile URL redirect (outside Layout to avoid auth guards) */}
            <Route path="/profile/:userId" element={<LegacyProfileRedirect />} />

            {/* Main layout routes */}
            <Route element={<Layout />}>
              <Route path="/profile" element={<EnhancedProfilePage />} />
              <Route path="/user/:username" element={<BookClubProfilePage />} />
              <Route path="/books" element={<BooksSection />} />
              <Route path="/books-old" element={<Books />} />
              <Route path="/books/:id" element={<BookDetail />} />
              <Route path="/book/:id" element={<BookDetail />} />
              <Route path="/events" element={<Events />} />
              <Route path="/events/:eventId" element={<EventDetailsPage />} />
              <Route path="/search" element={<Search />} />
              <Route path="/book-request" element={<BookRequestPage />} />
              <Route path="/book-listing" element={<BookListingPage />} />

              {/* Testing Routes */}
              <Route path="/test/alerts" element={<AlertSystemTest />} />
              <Route path="/test/subscription-debug" element={<SubscriptionDebugger />} />
              <Route path="/test/subscription-alerts" element={<SubscriptionAlertTest />} />
              <Route path="/test/toasts" element={<ToastTest />} />
              <Route path="/test/role-access-denied" element={<RoleAccessDeniedTest />} />

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

            {/* Debug routes */}
            <Route path="/debug/entitlements" element={<EntitlementsDebug />} />

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
              <Route path="delete-requests" element={<SelfDeletionRequests />} />
              <Route path="events" element={<AdminEventsPage />} />
              <Route path="events/create" element={<CreateEventPage />} />
              <Route path="events/edit/:eventId" element={<EditEventPage />} />
              <Route path="moderation" element={<ModerationPage />} />
              <Route path="test-reporting" element={<ReportingSystemTest />} />
              {/* Username debug route removed - validation issues resolved */}

              {/* Subscription Management Route - Store Owner Only */}
              <Route path="subscriptions" element={
                <StoreOwnerRouteGuard>
                  <SubscriptionManagementPage />
                </StoreOwnerRouteGuard>
              } />

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
                    <Route path="book-listings" element={<BookListingsManagement />} />
                    <Route path="book-availability-requests" element={<BookAvailabilityRequestsManagement />} />
                    <Route path="analytics" element={<LandingPageAnalytics />} />
                    <Route path="book-club-analytics" element={<BookClubAnalytics />} />
                    <Route path="managers" element={<StoreManagersManagement />} />
                  </Routes>
                </StoreOwnerRouteGuard>
              } />
            </Route>

            {/* Store Manager Routes with Store Manager Guard */}
            <Route path="/store-manager" element={
              <StoreManagerRouteGuard>
                <StoreManagerLayout />
              </StoreManagerRouteGuard>
            }>
              <Route index element={<Navigate to="/store-manager/dashboard" replace />} />
              <Route path="dashboard" element={<StoreManagerDashboardPage />} />
              <Route path="analytics" element={<StoreManagerAnalyticsPage />} />
              <Route path="users" element={<StoreManagerUsersPage />} />
              <Route path="clubs" element={<StoreManagerClubsPage />} />
              <Route path="moderation" element={<StoreManagerModerationPage />} />
              <Route path="events" element={<StoreManagerEventsPage />} />
              <Route path="events/create" element={<StoreManagerCreateEventPage />} />
              <Route path="events/edit/:eventId" element={<StoreManagerEditEventPage />} />
            </Route>

            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
            </Routes>

            {/* Global Suspension Modal */}
            <SuspensionModal />

                </UserProfileProvider>
              </AlertProvider>
            </AuthProvider>
          </SuspensionModalProvider>
          <Toaster />
        </BrowserRouter>
      </HelmetProvider>
    </>
  );
}

export default App;
