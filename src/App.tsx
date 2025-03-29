
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import * as Sentry from "@sentry/react";

// Pages
import Landing from "./pages/Landing";
import Index from "./pages/Index";
import Books from "./pages/Books";
import BookDetail from "./pages/BookDetail";
import Events from "./pages/Events";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import Search from "./pages/Search";
import NotFound from "./pages/NotFound";
import ChatSelection from "./pages/ChatSelection";

// Initialize Sentry
Sentry.init({
  dsn: "https://5eb30810e4486dcbffef4ec33686f468@o4509059414163456.ingest.de.sentry.io/4509061591072848",
  integrations: [
    Sentry.browserTracingIntegration(),
  ],
  // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring
  // In production, you might want to set this to a lower value
  tracesSampleRate: 1.0,
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
    },
  },
});

// Error boundary component
const FallbackComponent = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="text-center p-6 max-w-md mx-auto">
      <h1 className="text-4xl font-serif mb-4 text-accent">Oops!</h1>
      <p className="text-lg mb-6">Something went wrong. Please try again later.</p>
      <button 
        onClick={() => window.location.reload()}
        className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
      >
        Refresh the page
      </button>
    </div>
  </div>
);

const SentryRoutes = Sentry.withSentryReactRouterV6Routing(Routes);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <Sentry.ErrorBoundary fallback={FallbackComponent}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <SentryRoutes>
              <Route path="/" element={<Landing />} />
              <Route path="/home" element={<Index />} />
              <Route path="/books" element={<Books />} />
              <Route path="/books/:id" element={<BookDetail />} />
              <Route path="/events" element={<Events />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/search" element={<Search />} />
              <Route path="/chat-selection" element={<ChatSelection />} />
              <Route path="*" element={<NotFound />} />
            </SentryRoutes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </Sentry.ErrorBoundary>
  </QueryClientProvider>
);

export default Sentry.withProfiler(App);
