
import { Routes, Route } from "react-router-dom";
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
import Events from "./pages/Events";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";
import Search from "./pages/Search";
import InteractiveChatEntry from "./pages/InteractiveChatEntry"; // Add this import

function App() {
  return (
    <>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/interactive-chat" element={<InteractiveChatEntry />} /> {/* Add this route */}
          <Route element={<Layout />}>
            <Route path="/profile" element={<Profile />} />
            <Route path="/user/:id" element={<UserProfile />} />
            <Route path="/books" element={<Books />} />
            <Route path="/book/:id" element={<BookDetail />} />
            <Route path="/book-discussion/:id" element={<BookDiscussion />} />
            <Route path="/explore-books" element={<ExploreBooks />} />
            <Route path="/chat-selection" element={<ChatSelection />} />
            <Route path="/book-club" element={<BookClub />} />
            <Route path="/book-clubs" element={<BookClub />} />
            <Route path="/events" element={<Events />} />
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
            <Route path="/search" element={<Search />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </AuthProvider>
      <Toaster />
    </>
  );
}

export default App;
