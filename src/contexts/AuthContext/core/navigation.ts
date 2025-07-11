/**
 * Navigation Integration Functions
 * 
 * This module handles navigation logic and routing integration
 * for authentication flows.
 * 
 * Part of: AuthContext System Refactoring
 * Created: 2025-01-11
 */

/**
 * Handle post-authentication navigation
 * 
 * @param navigate - Navigation function
 * @param path - Path to navigate to
 */
export function navigateAfterAuth(navigate: (path: string) => void, path: string = '/book-club'): void {
  navigate(path);
}

/**
 * Handle sign out navigation
 * 
 * @param navigate - Navigation function
 * @param path - Path to navigate to after sign out
 */
export function navigateAfterSignOut(navigate: (path: string) => void, path: string = '/login'): void {
  navigate(path);
}

/**
 * Get redirect path based on user state
 * 
 * @param isAuthenticated - Whether user is authenticated
 * @param intendedPath - Originally intended path
 * @returns Appropriate redirect path
 */
export function getRedirectPath(isAuthenticated: boolean, intendedPath?: string): string {
  if (isAuthenticated) {
    return intendedPath || '/book-club';
  }
  return '/login';
}
