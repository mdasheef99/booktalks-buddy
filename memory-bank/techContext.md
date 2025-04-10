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
  - **Real-time subscriptions via Supabase Realtime**

- **Backend:**
  - Node.js
  - Express.js (or Supabase Functions)
  - Supabase PostgreSQL
  - **API logic implemented in `src/lib/api.ts`**
  - **Contextual role checks for authorization**

- **Database:**
  - Supabase PostgreSQL
  - **Row Level Security (RLS) enabled on Book Club tables**
  - **Helper functions assumed:**
    - `is_club_member(club_id uuid)`
    - `is_club_admin(club_id uuid)`

- **Authentication:**
  - Supabase Auth

- **Realtime:**
  - **Supabase Realtime for discussion updates**
  - **Subscription management in components**

- **API Integration:**
  - Google Books API
  - **Book Club API endpoints**

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
- Real-time chat scalability.
- **RLS policies depend on helper functions for role checks.**
- **Supabase Realtime subscription limits.**
- **Component re-renders with real-time updates.**
- **Routing needs to be updated to integrate new components.**

## Dependencies:

- Package dependencies in `package.json`.
- Supabase client libraries.
- Google Books API client or REST API.
- Tailwind CSS for styling.
- Radix UI for accessible components.

## Tool Usage Patterns:

- VS Code for development.
- Git for version control.
- npm/bun for package management.
- Supabase CLI for database management.
- Chrome DevTools for frontend debugging.
- Postman/Insomnia for API testing.
- React DevTools for component debugging.