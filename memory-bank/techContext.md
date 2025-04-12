# Tech Context

## Technologies Used:

- **Frontend:**
  - React
  - TypeScript
  - Tailwind CSS
  - Radix UI
  - Zustand (or Context API)
  - React Router
  - Vite
  - **Real-time subscriptions via Supabase Realtime for discussions, club details, members, and current book**
  - **Modern UI libraries: lucide-react (icons), sonner (toasts), shadcn-ui (UI primitives)**

- **Backend:**
  - Node.js
  - Express.js (or Supabase Functions)
  - Supabase PostgreSQL
  - **API logic implemented in `src/lib/api.ts` and `src/lib/api/profile.ts` for Book Club profiles/memberships**
  - **Contextual role checks for authorization**

- **Database:**
  - Supabase PostgreSQL
  - **Row Level Security (RLS) enabled on Book Club tables**
  - **Helper functions:**
    - `is_club_member(club_id uuid)`
    - `is_club_admin(club_id uuid)`

- **Authentication:**
  - Supabase Auth

- **Realtime:**
  - **Supabase Realtime for discussion, club, and membership updates**
  - **Subscription management in components and context**

- **Storage:**
  - **Supabase Storage for profile avatars**

- **API Integration:**
  - Google Books API
  - **Book Club API endpoints for club, membership, and profile management**

- **Development Tools:**
  - VS Code
  - Git
  - npm or bun

## Development Setup:

1. Install Node.js and npm (or bun).
2. Install VS Code and recommended extensions (e.g., ESLint, Prettier).
3. Clone the project repository from Git.
4. Install project dependencies using `npm install` or `bun install`.
5. Set up Supabase project and database.
6. Configure environment variables (e.g., Supabase API keys).
7. Start the frontend development server using `npm run dev` or `bun run dev`.
8. Start the backend server (if applicable).

## Technical Constraints:

- Supabase free tier limitations and scaling considerations.
- API rate limits for Google Books API; implement error handling and caching.
- Real-time chat and club update scalability.
- **RLS policies depend on helper functions for role checks.**
- **Supabase Realtime subscription limits.**
- **Component re-renders with real-time updates.**
- **Routing must be kept up-to-date to integrate new Book Club components.**

## Dependencies:

- Package dependencies in `package.json`.
- Supabase client libraries.
- Google Books API client or REST API.
- Tailwind CSS for styling.
- Radix UI for accessible components.
- **lucide-react for icons**
- **sonner for toast notifications**
- **shadcn-ui for UI primitives**

## Tool Usage Patterns:

- VS Code for development.
- Git for version control.
- npm/bun for package management.
- Supabase CLI for database management.
- Chrome DevTools for frontend debugging.
- Postman/Insomnia for API testing.
- React DevTools for component debugging.