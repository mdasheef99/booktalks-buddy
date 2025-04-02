# Progress

## What works:
- Basic project setup and tooling
- Memory bank documentation structure
- Initial documentation files created
- Landing page structure and basic components
- "Start anonymous chat" button opens username dialog
- Basic routing setup

## What's left to build:
- Frontend application development (UI components, pages, routing, state management)
  - Explore Books page functionality (requires React Query fix)
- Backend API development (controllers, services, data access)
- Database schema design and implementation
- User authentication and authorization
- Book search and discovery functionality
- Book discussion forums and chat
- Book club management features
- Event scheduling and management
- Testing and deployment

## Current status:
- Debugging errors on the landing page (`Could not load /textures/book-cover.jpg`, `<ForwardRef(Canvas)>` error) related to the removal of the 3D interactive book feature.
- The React Query issue investigation is paused until these landing page errors are resolved.

## Known issues:
- **Landing Page Errors:** Errors like `Could not load /textures/book-cover.jpg` and errors within `<ForwardRef(Canvas)>` occur on the landing page, likely due to leftover code from the removed 3D interactive book feature.
- **React Query Error:** "No QueryClient set, use QueryClientProvider to set one" when accessing features using React Query hooks (e.g., ExploreBooks page). Requires setting up `QueryClientProvider` at the application root (to be addressed after landing page errors).

## Evolution of project decisions:
- Initially considered using a different backend framework, but decided to go with Node.js and Express.js (or Supabase Functions).
- Decided to use Supabase for backend services.
- Added Three.js for interactive 3D components (Decision Reversed: This feature has been removed).
- Implementing asset verification system for development (No longer relevant after 3D removal).
- Identified need for React Query for data fetching and state management.