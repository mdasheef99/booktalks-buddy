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
       - BookClubList, BookClubDetails
       - DiscussionList, DiscussionInput
       - Admin Components (UserList, ClubManagement, JoinRequests)
     - **Real-time Updates using Supabase Realtime**

2. **Backend (Application Tier):**
   - Built with Node.js and Express.js (initially considering Supabase Functions).
   - Responsible for business logic, data validation, and API endpoints.
   - Components:
     - API Controllers (e.g., `src/pages/api/bookclubs/[clubId].ts`, `src/pages/api/admin/members.ts`)
     - Services (for business logic, implemented in `src/lib/api.ts` for Book Clubs)
     - Data Access Layer (using Supabase client in `src/lib/api.ts`)
     - **Role-based Authorization Logic**

3. **Database (Data Tier):**
   - Supabase PostgreSQL database.
   - Responsible for data storage, retrieval, and access control.
   - Schemas:
     - Users (via Supabase Auth)
     - Books
     - Book Discussions
     - **Book Clubs**
       - `book_clubs` (id, store_id, name, description, privacy, created_at, updated_at)
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
- Supabase Realtime for live discussion updates.

## Design Patterns:

- Modular Design: Breaking down the application into independent modules and components.
- Component-Based Architecture: Building the UI using reusable React components.
- Service Layer Pattern: Separating business logic from API controllers (e.g., `src/lib/api.ts`).
- Repository Pattern: Abstracting data access logic (via Supabase client).
- Observer Pattern: Using Supabase Realtime subscriptions for real-time updates.
- Strategy Pattern: Dynamic UI rendering based on user roles.

## Component Relationships:

[Diagram or description of component relationships will be added here later]

## Critical Implementation Paths:

1. User Authentication: Implement user registration, login, and session management using Supabase Auth.
2. Book Search API Integration: Integrate with Google Books API for book search functionality.
3. Real-time Chat Implementation: Implement real-time chat using Supabase Realtime or a similar service.
4. **Book Club Schema & RLS:** Define, implement, and secure Book Club-related tables and access policies in Supabase. **(Completed)**
5. **API Endpoint Development:** Develop RESTful API endpoints for frontend to interact with backend. **(Completed)**
6. **Frontend UI Development:** Implement Book Club UI components and real-time features. **(Partially Completed - needs routing integration)**