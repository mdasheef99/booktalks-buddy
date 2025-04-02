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

- **Backend:**
  - Node.js
  - Express.js (or Supabase Functions)
  - Supabase PostgreSQL

- **Database:**
  - Supabase PostgreSQL

- **Authentication:**
  - Supabase Auth

- **Realtime:**
  - Supabase Realtime (or similar)

- **API Integration:**
  - Google Books API

- **Development Tools:**
  - VS Code
  - Git
  - npm or bun

## Development Setup:

1. **Install Node.js and npm (or bun).**
2. **Install VS Code and recommended extensions (e.g., ESLint, Prettier).**
3. **Clone the project repository from Git.**
4. **Install project dependencies using `npm install` or `bun install`.**
5. **Set up Supabase project and database.**
6. **Configure environment variables (e.g., Supabase API keys).**
7. **Start the frontend development server using `npm run dev` or `bun run dev`.**
8. **Start the backend server (if applicable).**

## Technical Constraints:

- **Supabase limitations:** Be aware of Supabase free tier limitations (if applicable) and potential scaling considerations.
- **API rate limits:** Consider rate limits for Google Books API and implement appropriate error handling and caching.
- **Real-time chat scalability:** Ensure real-time chat solution can scale to handle a growing number of users.

## Dependencies:

- Package dependencies are listed in `package.json` for both frontend and backend.
- Supabase client libraries.
- Google Books API client library (or REST API).

## Tool Usage Patterns:

- **VS Code:** Primary IDE for development.
- **Git:** Version control and collaboration.
- **npm/bun:** Package management and build tooling.
- **Supabase CLI:** Interacting with Supabase project.
- **Chrome DevTools:** Debugging frontend issues.
- **Postman/Insomnia:** Testing API endpoints.