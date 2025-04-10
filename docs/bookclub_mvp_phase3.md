# Book Club MVP - Phase 3: Frontend UI Development

## Description

This phase focuses on implementing the frontend UI components for managing book clubs.

## UI Components

-   Displaying a list of book clubs
-   Displaying book club details
-   Creating a book club
-   Joining a book club
-   Adding a discussion topic
-   Replying to a discussion topic
-   Displaying discussion topics
-   Setting the current book for a book club (Admin only)
-   Admin Dashboard (basic counts)
-   Admin User List (display members, ban buttons)
-   Admin Club Management (list clubs with edit/delete)
-   Admin Join Requests (approve/deny)

## Implementation Details

-   Integrate the UI components with the backend API.
-   Implement real-time discussion updates using Supabase Realtime.
-   Components like `BookClubDetails`, `DiscussionList`, etc., will need significant internal logic to render differently based on user role (e.g., show delete buttons only for Admin).
-   Discussion Components need updates to handle the topic/post structure. `DiscussionInput` needs context (replying to topic vs. post).

## Files to be created/modified

-   `src/pages/BookClub.tsx` (Modify existing component)
-   `src/pages/AdminDashboard.tsx` (Create new component)
-   `src/components/bookclubs/BookClubList.tsx` (Example component)
-   `src/components/bookclubs/BookClubDetails.tsx` (Example component)
-   `src/components/discussions/DiscussionList.tsx` (Example component)
-   `src/components/discussions/DiscussionInput.tsx` (Example component)
-   `src/components/admin/AdminUserList.tsx` (Example component)
-   `src/components/admin/AdminClubManagement.tsx` (Example component)
-   `src/components/admin/AdminJoinRequests.tsx` (Example component)