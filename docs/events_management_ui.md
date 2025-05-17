# Events Management UI Documentation

This document provides an overview of the Events Management UI implementation, including layout considerations, component structure, and development notes.

## Table of Contents

1. [Overview](#overview)
2. [Component Structure](#component-structure)
3. [UI Layout Guidelines](#ui-layout-guidelines)
4. [Development Mode](#development-mode)
5. [Troubleshooting](#troubleshooting)

## Overview

The Events Management UI allows store owners and managers to create, view, edit, and delete events. The UI consists of:

- A dashboard with event statistics
- Filtering and search functionality
- A grid of event cards
- Create/edit event forms

## Component Structure

### Main Components

- **AdminEventsPage.tsx**: The main page component that handles fetching events, filtering, and overall layout
- **EventManagementList.tsx**: Displays the grid of event cards
- **EventForm.tsx**: Form for creating and editing events
- **FeaturedEventsToggle.tsx**: Toggle button for featuring events on the landing page

### Form Section Components

- **BasicInfoSection.tsx**: Form section for event title, description, type, and associated book club
- **DateTimeSection.tsx**: Form section for event date and time
- **LocationSection.tsx**: Form section for event location (physical or virtual)
- **AdditionalSettingsSection.tsx**: Form section for additional event settings

## UI Layout Guidelines

### Event Cards

Event cards are designed to maintain consistent height and layout regardless of content length. Key layout considerations:

1. **Card Structure**:
   - Use `flex flex-col h-full` to ensure consistent height
   - Use `border shadow-sm` for subtle borders and shadows
   - Maintain consistent padding with `px-4` and appropriate vertical padding

2. **Header Section**:
   - Use `flex justify-between items-start` for the header layout
   - Use `flex-wrap gap-2` for badges to handle multiple badges
   - Use `line-clamp-2` for titles to prevent overflow
   - Position the dropdown menu with negative margins for proper alignment

3. **Content Section**:
   - Use `flex-grow` to allow the content to expand
   - Use `truncate` for metadata text to prevent overflow
   - Use `min-h-[40px]` for description to maintain consistent spacing
   - Use `flex-shrink-0` for icons to prevent them from shrinking

4. **Footer Section**:
   - Use `mt-auto` to push the footer to the bottom
   - Use `border-t` to add a separator line
   - Use `flex justify-between items-center` for button alignment
   - Use fixed height buttons (`h-9`) for consistent sizing

### Button Styling

1. **View Details Button**:
   - Use `variant="outline"` for a subtle appearance
   - Use `size="sm"` for compact size
   - Include an icon with `mr-2` spacing

2. **Feature/Featured Toggle**:
   - Use fixed width (`w-[100px]`) for consistent sizing
   - Use different background colors for active/inactive states
   - Include an icon with appropriate spacing

## Development Mode

The Events Management UI includes development mode features to facilitate testing without requiring proper backend permissions:

### Mock Data

When the user doesn't have the required permissions (store owner or manager), the application falls back to mock data:

```typescript
// If permission check fails, use mock data for development
try {
  fetchedEvents = await getStoreEvents(user.id, storeId);
} catch (error) {
  console.warn('Permission check failed, using mock data for development:', error);
  
  // Mock data implementation
  fetchedEvents = [ /* mock events */ ];
}
```

### Mock Actions

Similarly, actions like toggling featured status or deleting events have fallback implementations:

```typescript
try {
  // Try with permission check
  await toggleEventFeatured(user.id, eventId, featured);
} catch (error) {
  // If it's a permission error, simulate success for development
  if (error.message && error.message.includes('Unauthorized')) {
    console.warn('Permission check failed, simulating success for development');
    // Development mode feedback
  } else {
    throw error;
  }
}
```

## Troubleshooting

### Common Layout Issues

1. **Inconsistent Card Heights**:
   - Ensure all cards use `flex flex-col h-full`
   - Check that content sections use `flex-grow`
   - Verify that footers use `mt-auto`

2. **Text Overflow**:
   - Use `truncate` for single-line text that might overflow
   - Use `line-clamp-2` for multi-line text with a maximum height
   - Wrap text in `<span>` tags with appropriate classes

3. **Button Alignment**:
   - Use `flex justify-between items-center` for button containers
   - Set fixed widths for buttons that need consistent sizing
   - Use `flex-shrink-0` to prevent buttons from shrinking

4. **Badge Alignment**:
   - Use `flex flex-wrap gap-2` for badge containers
   - Add `whitespace-nowrap` to badges to prevent them from breaking
   - Use consistent spacing with `mb-2` after badge containers

### Permission Issues

If you encounter "Unauthorized" errors:

1. Check that the current user has the appropriate role (store owner or manager)
2. Verify that the store ID is correct
3. For development, the mock data implementation will automatically provide fallback data

## Future Improvements

- Implement pagination for large numbers of events
- Add bulk actions for managing multiple events
- Enhance filtering options with date ranges and more event types
- Improve mobile responsiveness for small screens
