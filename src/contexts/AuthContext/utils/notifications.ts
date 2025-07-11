/**
 * Notification Utilities
 * 
 * This module handles toast notifications and user messaging
 * for authentication-related events.
 * 
 * Part of: AuthContext System Refactoring
 * Created: 2025-01-11
 */

import { toast } from 'sonner';

/**
 * Show success notification for sign in
 */
export function showSignInSuccess(): void {
  toast.success("Successfully signed in!");
}

/**
 * Show success notification for sign up
 */
export function showSignUpSuccess(): void {
  toast.success("Account created! Welcome to BookConnect!");
}

/**
 * Show success notification for sign out
 */
export function showSignOutSuccess(): void {
  toast.success("You've been successfully signed out");
}

/**
 * Show welcome back message
 */
export function showWelcomeBack(): void {
  toast.success("Welcome back!");
}

/**
 * Show error notification for authentication failure
 * 
 * @param message - Error message to display
 */
export function showAuthError(message: string): void {
  toast.error(message || "Authentication failed");
}

/**
 * Show error notification for entitlements loading failure
 */
export function showEntitlementsError(): void {
  toast.error('Failed to load user permissions');
}

/**
 * Show error notification for club roles loading failure
 */
export function showClubRolesError(): void {
  toast.error('Failed to load club membership data');
}
