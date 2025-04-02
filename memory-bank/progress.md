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
  - Explore Books page functionality (requires React Query fix and UI fixes)
- Backend API development (controllers, services, data access)
- Database schema design and implementation
- User authentication and authorization
- Book search and discovery functionality
- Book discussion forums and chat
- Book club management features
- Event scheduling and management
- Testing and deployment

## Current status:
- Landing page errors resolved.
- Investigating and resolving UI issues on the Explore page: duplicate headers with identical design and missing back button.
- The React Query issue investigation is paused until these Explore page UI issues are resolved.

## Known issues:
- **Explore Page UI Issues:** Duplicate headers with identical design and a missing back button on the Explore page.
- **React Query Error:** "No QueryClient set, use QueryClientProvider to set one" when accessing features using React Query hooks (e.g., ExploreBooks page). Requires setting up `QueryClientProvider` at the application root (to be addressed after Explore page UI issues).

## Evolution of project decisions:
- Initially considered using a different backend framework, but decided to go with Node.js and Express.js (or Supabase Functions).
- Decided to use Supabase for backend services.
- Added Three.js for interactive 3D components (Decision Reversed: This feature has been removed).
- Implementing asset verification system for development (No longer relevant after 3D removal).
- Identified need for React Query for data fetching and state management.