/**
 * ProfileForm Module Exports
 * Centralized exports for the refactored ProfileForm components
 */

// Main component
export { default as ProfileForm } from './ProfileForm';

// Section components
export { default as BasicInfoSection } from './sections/BasicInfoSection';
export { default as ReadingPreferencesSection } from './sections/ReadingPreferencesSection';
export { default as BookClubPreferencesSection } from './sections/BookClubPreferencesSection';

// Custom hook
export { useProfileFormData } from './hooks/useProfileFormData';
export type { ProfileFormData, UseProfileFormDataReturn } from './hooks/useProfileFormData';

// Default export
export { default } from './ProfileForm';
