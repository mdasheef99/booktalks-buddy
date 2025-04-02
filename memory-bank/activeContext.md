# Active Context

## Current Work Focus:
Debugging errors (`Could not load /textures/book-cover.jpg`, `<ForwardRef(Canvas)>` error) occurring on the landing page, likely due to incomplete removal of the 3D interactive book feature. These errors manifest when interacting with elements like the "Start anonymous chat" button.

## Recent Changes:
- Removed the entire 3D interactive book feature based on user request.
  - Deleted `src/components/books/interactive/` directory.
  - Deleted `src/components/landing/InteractiveBookSection.tsx`.
  - Deleted `src/pages/InteractiveChatEntry.tsx`.
  - Deleted `public/textures/` directory.
  - Removed `three`, `@react-three/fiber`, `@react-three/drei` dependencies from `package.json`.
  - Updated `src/pages/Landing.tsx` to remove references and state related to the interactive book.
  - Updated `src/App.tsx` to remove the import and route for `InteractiveChatEntry`.
- Fixed the "Start anonymous chat" button functionality on the Landing page (`HeroSection`) to correctly open the `UsernameDialog`.
  - Added `handleOpenUsernameDialog` function in `Landing.tsx`.
  - Passed the handler to `HeroSection`.

## Next Steps:
- Investigate `src/pages/Landing.tsx` and its child components (e.g., `HeroSection`) for any remaining references to the deleted 3D book components (`InteractiveBook`, `InteractiveBookSection`, `Canvas`) or assets (`/textures/book-cover.jpg`).
- Remove any leftover code, imports, or state related to the 3D feature.
- Test the landing page interactions (like clicking "Start anonymous chat") to ensure the errors are resolved.
- Re-evaluate the React Query issue mentioned previously once the landing page errors are fixed.

## Active Decisions and Considerations:
- **Thorough Cleanup:** Ensure all traces of the removed 3D feature are eliminated to prevent residual errors.
- **Error Boundaries:** Reiterate the need for error boundaries, especially around complex UI sections, to gracefully handle unexpected issues.
- **React Query Setup:** Keep the previous note about `QueryClientProvider` setup, as it will likely be the next focus after fixing the current errors.

## Important Patterns and Preferences:
- **Centralized Providers:** Keep context providers (like AuthProvider, QueryClientProvider) near the application root (`main.tsx` or `App.tsx`) for clarity and proper scoping.
- **Hook Usage:** Ensure React Query hooks are only used within components wrapped by the `QueryClientProvider`.

## Learnings and Project Insights:
- Removing significant features requires careful cleanup of components, routes, state, and dependencies to avoid runtime errors.
- Core library providers (like React Query's) must be correctly configured at the application root to function properly.