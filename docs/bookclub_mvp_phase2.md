# Book Club MVP - Phase 2: Backend API Development

## Description

This phase focuses on implementing the backend API endpoints for managing book clubs.

## API Endpoints

-   Creating a book club (POST /api/clubs)
-   Updating a book club (PUT /api/clubs/[clubId])
-   Deleting a book club (DELETE /api/clubs/[clubId])
-   Getting a list of book clubs (GET /api/clubs)
-   Joining a book club (POST /api/clubs/[clubId]/join)
-   Leaving a book club (POST /api/clubs/[clubId]/leave)
-   Adding a discussion topic (POST /api/clubs/[clubId]/topics)
-   Replying to a discussion topic (POST /api/topics/[topicId]/posts)
-   Getting discussion topics for a book club (GET /api/clubs/[clubId]/topics)
-   Setting the current book for a book club (PUT /api/clubs/[clubId]/currentbook)
-   Listing all members (GET /api/admin/members)
-   Removing/Banning a member (DELETE /api/admin/members/[userId])
-   Inviting a member (POST /api/admin/invites)
-   Approving/Denying private club join requests (POST /api/clubs/[clubId]/requests/[requestId])

## Implementation Details

-   Implement the business logic for each API endpoint.
-   Implement data validation and error handling.
-   Every API endpoint MUST perform authorization checks based on the user's role (Admin vs. Member) and context (e.g., are they a member of this club?).
-   Re-evaluate if storing user roles in Auth metadata is the best approach vs. fetching contextually.

## Files to be created/modified

-   `src/lib/api.ts` (Add new API functions)
-   `src/pages/api/bookclubs/[clubId].ts` (Example API endpoint)
-   `src/pages/api/admin/members.ts` (Example Admin API endpoint)
-   `src/contexts/AuthContext.tsx` (Potentially modify for contextual role fetching)