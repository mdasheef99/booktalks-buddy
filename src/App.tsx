import { BrowserRouter, Routes, Route } from "react-router-dom";
import AdminRouteGuard from "./components/routeguards/AdminRouteGuard";
import MemberRouteGuard from "./components/routeguards/MemberRouteGuard";
import { Toaster } from "sonner";
import { AuthProvider } from "./contexts/AuthContext";
import Layout from "./components/Layout";
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
import { BookClubDetails } from "./components/bookclubs/BookClubDetails";
import CreateBookClubForm from "./components/bookclubs/CreateBookClubForm";
import CreateTopicForm from "./components/discussions/CreateTopicForm";
import TopicDetail from "./components/discussions/TopicDetail";
import ReplyForm from "./components/discussions/ReplyForm";
import BookClubMembers from "./components/admin/BookClubMembers";
import BookClubSettings from "./components/admin/BookClubSettings";
import Events from "./pages/Events";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";
import Search from "./pages/Search";
import Unauthorized from "./pages/Unauthorized";

function App() {
  return (
    <>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/chat-selection" element={<ChatSelection />} />
            <Route element={<Layout />}>
              <Route path="/profile" element={<Profile />} />
              <Route path="/user/:username" element={<UserProfile />} />
              <Route path="/books" element={<Books />} />
              <Route path="/books/:id" element={<BookDetail />} />
              <Route path="/book/:id" element={<BookDetail />} />
            </Route>
            <Route path="/book-discussion/:id" element={<BookDiscussion />} />
              <Route path="/explore-books" element={<ExploreBooks />} />
              <Route path="/book-club" element={<BookClub />} />
              <Route path="/book-clubs" element={<BookClub />} />
              {/* Book Club Routes */}
              <Route path="/book-club/new" element={<CreateBookClubForm />} />
              <Route path="/book-club/:clubId" element={<BookClubDetails />} />
              <Route
                path="/book-club/:clubId/discussions"
                element={
                  <MemberRouteGuard>
                    <TopicDetail />
                  </MemberRouteGuard>
                }
              />
              <Route
                path="/book-club/:clubId/members"
                element={
                  <AdminRouteGuard>
                    <BookClubMembers />
                  </AdminRouteGuard>
                }
              />
              <Route
                path="/book-club/:clubId/settings"
                element={
                  <AdminRouteGuard>
                    <BookClubSettings />
                  </AdminRouteGuard>
                }
              />

              {/* Add new routes for discussions */}
              <Route path="/book-club/:clubId/discussions/new" element={
                <MemberRouteGuard>
                  <CreateTopicForm />
                </MemberRouteGuard>
              } />
              <Route path="/book-club/:clubId/discussions/:topicId" element={
                <MemberRouteGuard>
                  <TopicDetail />
                </MemberRouteGuard>
              } />
              <Route path="/book-club/:clubId/discussions/:topicId/reply" element={
                <MemberRouteGuard>
                  <ReplyForm />
                </MemberRouteGuard>
              } />

              <Route path="/events" element={<Events />} />
              <Route path="/admin-dashboard" element={<AdminDashboard />} />
              <Route path="/search" element={<Search />} />
              <Route path="/unauthorized" element={<Unauthorized />} />
              <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
        <Toaster />
      </BrowserRouter>
    </>
  );
}

export default App;
