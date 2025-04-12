# System Patterns

## System Architecture:

The Lovable Bookconnect application follows a three-tier architecture:

1. **Frontend (Presentation Tier):**
   - Built with React and TypeScript.
   - Responsible for user interface, user interactions, and presentation logic.
   - Components:
     - UI Components (using Radix UI and Tailwind CSS)
     - Pages and Layouts
     - State Management (using Context API or Zustand)
     - Routing (using React Router)
     - **Book Club Components:**
       - BookClubList, BookClubDetailsWithJoin, BookClubProfilePage, BookClubMemberships, BookClubProfileSettings
       - DiscussionList, DiscussionInput, TopicDetail, Admin/Member navigation
     - **Real-time Updates using Supabase Realtime for club details, members, and current book**
     - **Profile and membership management with deep Supabase integration**

2. **Backend (Application Tier):**
   - Built with Node.js and Express.js (or Supabase Functions).
   - Responsible for business logic, data validation, and API endpoints.
   - Components:
     - API Controllers (e.g., `src/lib/api/profile.ts` for Book Club profiles/memberships)
     - Services (business logic for club management, membership, and profiles)
     - Data Access Layer (using Supabase client)
     - **Role-based Authorization Logic for admin/member flows**

3. **Database (Data Tier):**
   - Supabase PostgreSQL database.
   - Responsible for data storage, retrieval, and access control.
   - Schemas:
     - Users (via Supabase Auth)
     - Books
     - Book Discussions
     - **Book Clubs**
       - `book_clubs` (id, name, description, privacy, created_at, updated_at)
       - `club_members` (user_id, club_id, role, joined_at)
       - `discussion_topics` (id, club_id, user_id, title, created_at, updated_at)
       - `discussion_posts` (id, topic_id, user_id, parent_post_id, content, created_at, updated_at)
       - `current_books` (club_id, title, author, set_at)
     - **Row Level Security (RLS):**
       - Enabled on all Book Club tables.
       - Policies enforce:
         - Members can view clubs they belong to.
         - Admins can insert/update/delete clubs and members.
         - Members can insert/select discussion topics and posts in clubs they belong to.
         - Only admins can modify current books.
       - Assumes helper functions:
         - `is_club_member(club_id uuid)`
         - `is_club_admin(club_id uuid)`

## Key Technical Decisions:

- React, TypeScript, Node.js, Express.js, PostgreSQL, Supabase.
- RESTful API for communication between frontend and backend.
- JSON for data serialization.
- Git for version control.
- Tailwind CSS and Radix UI for component styling.
- Supabase Realtime for live discussion and club updates.
- Supabase Storage for profile avatars.

## Design Patterns:

- Modular Design: Breaking down the application into independent modules and components.
- Component-Based Architecture: Building the UI using reusable React components.
- Service Layer Pattern: Separating business logic from API controllers (e.g., `src/lib/api/profile.ts`).
- Repository Pattern: Abstracting data access logic (via Supabase client).
- Observer Pattern: Using Supabase Realtime subscriptions for real-time updates.
- Strategy Pattern: Dynamic UI rendering based on user roles and membership status.
- **Profile and Membership Management Pattern:** Centralized logic for fetching, updating, and displaying user profiles and club memberships.

## Component Relationships:

- BookClubListPage → BookClubList → BookClubDetailsWithJoin → BookClubProfilePage, BookClubMemberships, BookClubProfileSettings
- Admin/member navigation flows between club settings, member management, and discussions
- Real-time updates propagate through context and subscriptions

## Critical Implementation Paths:

1. User Authentication: Supabase Auth for registration, login, and session management.
2. Book Search API Integration: Google Books API for book search functionality.
3. Real-time Chat and Club Updates: Supabase Realtime for chat, club details, and membership changes.
4. **Book Club Schema & RLS:** Secure Book Club-related tables and access policies in Supabase. **(Completed)**
5. **API Endpoint Development:** RESTful API endpoints for frontend to interact with backend. **(Completed)**
6. **Frontend UI Development:** Advanced Book Club UI components, profile/membership management, and real-time features. **(Completed)**