import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AdminRouteGuard from "./components/routeguards/AdminRouteGuard";
import MemberRouteGuard from "./components/routeguards/MemberRouteGuard";
import GlobalAdminRouteGuard from "./components/routeguards/GlobalAdminRouteGuard";
import { Toaster } from "sonner";
import { AuthProvider } from "./contexts/AuthContext";
import { UserProfileProvider } from "./contexts/UserProfileContext";
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
import CreateBookClubForm from "./components/bookclubs/CreateBookClubForm";
import CreateTopicForm from "./components/discussions/CreateTopicForm";
import TopicDetail from "./components/discussions/TopicDetail";
import ReplyForm from "./components/discussions/ReplyForm";
import BookClubMembers from "./components/admin/BookClubMembers";
import BookClubSettings from "./components/admin/BookClubSettings";
import Events from "./pages/Events";
import NotFound from "./pages/NotFound";
import Search from "./pages/Search";
import Unauthorized from "./pages/Unauthorized";

function App() {
  return (
    <>
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
              <Route path="/search" element={<Search />} />
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
              <Route path="clubs" element={<AdminClubManagementPage />} />
              <Route path="users" element={<AdminUserListPage />} />
              <Route path="requests" element={<AdminJoinRequestsPage />} />
            </Route>

            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
            </Routes>
          </UserProfileProvider>
        </AuthProvider>
        <Toaster />
      </BrowserRouter>
    </>
  );
}

export default App;
