/**
 * Tier Utility Functions
 * 
 * Utilities for converting between database tier values (uppercase) and 
 * UI component tier values (lowercase), ensuring consistent tier handling
 * across the application.
 * 
 * Created: 2025-07-10
 * Purpose: Fix tier badge display issues
 */

// =========================
// Type Definitions
// =========================

export type DatabaseTier = 'MEMBER' | 'PRIVILEGED' | 'PRIVILEGED_PLUS';
export type UITier = 'member' | 'privileged' | 'privileged_plus';

// =========================
// Conversion Functions
// =========================

/**
 * Converts database tier format (uppercase) to UI tier format (lowercase)
 * Used for displaying tier badges and UI components
 */
export function convertTierForUI(databaseTier: string | null | undefined): UITier | null {
  if (!databaseTier || typeof databaseTier !== 'string') {
    return null;
  }

  const normalizedTier = databaseTier.toUpperCase().trim();
  
  switch (normalizedTier) {
    case 'PRIVILEGED':
      return 'privileged';
    case 'PRIVILEGED_PLUS':
      return 'privileged_plus';
    case 'MEMBER':
      return 'member';
    default:
      return null;
  }
}

/**
 * Converts UI tier format (lowercase) to database tier format (uppercase)
 * Used for database operations and API calls
 */
export function convertTierForDatabase(uiTier: string | null | undefined): DatabaseTier {
  if (!uiTier || typeof uiTier !== 'string') {
    return 'MEMBER';
  }

  const normalizedTier = uiTier.toLowerCase().trim();
  
  switch (normalizedTier) {
    case 'privileged':
      return 'PRIVILEGED';
    case 'privileged_plus':
      return 'PRIVILEGED_PLUS';
    case 'member':
    default:
      return 'MEMBER';
  }
}

/**
 * Checks if a tier should display a badge (excludes MEMBER tier)
 */
export function shouldShowTierBadge(tier: string | null | undefined): boolean {
  if (!tier) return false;
  
  const normalizedTier = tier.toUpperCase().trim();
  return normalizedTier === 'PRIVILEGED' || normalizedTier === 'PRIVILEGED_PLUS';
}

/**
 * Gets a human-readable tier name for display
 */
export function getTierDisplayName(tier: string | null | undefined): string {
  if (!tier) return 'Member';
  
  const normalizedTier = tier.toUpperCase().trim();
  
  switch (normalizedTier) {
    case 'PRIVILEGED':
      return 'Privileged';
    case 'PRIVILEGED_PLUS':
      return 'Privileged Plus';
    case 'MEMBER':
    default:
      return 'Member';
  }
}

/**
 * Validates that a tier value is valid
 */
export function isValidTier(tier: string | null | undefined): boolean {
  if (!tier) return false;
  
  const normalizedTier = tier.toUpperCase().trim();
  return ['MEMBER', 'PRIVILEGED', 'PRIVILEGED_PLUS'].includes(normalizedTier);
}
