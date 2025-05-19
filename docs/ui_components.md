# Book Nomination System UI Components

This document provides an overview of the UI components used in the Book Nomination System, focusing on the components that were enhanced during Phase 5 of development.

## Table of Contents

1. [Loading State Components](#loading-state-components)
2. [Error Handling Components](#error-handling-components)
3. [Responsive Design Components](#responsive-design-components)
4. [Animation and Transition Patterns](#animation-and-transition-patterns)

## Loading State Components

### SkeletonBookCover

A component that displays a book cover with a skeleton loading state and blur-up effect.

**Props:**
- `src`: URL of the image to load
- `alt`: Alt text for the image
- `width`: Width of the cover container (default: 'w-full')
- `height`: Height of the cover container (default: 'h-48')
- `className`: Additional CSS classes
- `viewType`: Whether this is a grid view (larger) or list view (smaller) (default: 'grid')

**Usage:**
```tsx
<SkeletonBookCover
  src={book.cover_url}
  alt={`Cover of ${book.title}`}
  width="w-16"
  height="h-24"
  className="rounded shadow"
  viewType="list"
/>
```

**Features:**
- Progressive loading with blur-up effect
- Fallback icon for missing images
- Smooth transitions between loading states

### EnhancedSkeleton

An enhanced skeleton component with shimmer effect and delayed appearance.

**Props:**
- `width`: Width of the skeleton
- `height`: Height of the skeleton
- `shimmer`: Whether to show a shimmer effect (default: true)
- `delay`: Delay before showing the skeleton in ms (default: 0)
- `rounded`: Rounding of the skeleton ('none', 'sm', 'md', 'lg', 'full') (default: 'md')
- `className`: Additional CSS classes

**Usage:**
```tsx
<EnhancedSkeleton
  height="h-6" 
  width="w-3/4" 
  delay={100} 
  className="mb-2"
/>
```

**Features:**
- Customizable shimmer effect
- Delayed appearance for staggered loading
- Configurable rounding

### NominationsLoadingState

A component that displays a loading state for nominations with staggered animations.

**Props:**
- `viewMode`: Whether to display in list or grid view

**Usage:**
```tsx
<NominationsLoadingState viewMode="grid" />
```

**Features:**
- Different layouts for grid and list views
- Staggered animation for natural appearance
- Randomized widths for more realistic skeleton content

### LoadingButton

A button that shows a loading state with a spinner.

**Props:**
- `isLoading`: Whether the button is in a loading state
- `icon`: The icon to display when not loading
- `loadingText`: The text to display when loading (default: 'Loading...')
- `variant`: The variant of the button (default: 'default')
- `size`: The size of the button (default: 'default')
- `className`: Additional CSS classes
- `children`: The children to display

**Usage:**
```tsx
<LoadingButton
  variant="outline"
  size="sm"
  onClick={handleAction}
  isLoading={isLoading}
  icon={<Icon className="h-4 w-4" />}
  loadingText="Processing..."
>
  Button Text
</LoadingButton>
```

**Features:**
- Spinner animation during loading
- Disabled state during loading
- Customizable loading text
- Support for icons

## Error Handling Components

### ErrorDisplay

A component that displays different types of errors with appropriate icons and actions.

**Props:**
- `type`: The type of error to display ('connection', 'permission', 'notFound', 'validation', 'unknown')
- `message`: The error message to display
- `details`: Optional detailed error message
- `onRetry`: Function to retry the operation
- `onBack`: Function to go back or cancel
- `className`: Additional CSS classes

**Usage:**
```tsx
<ErrorDisplay
  type="connection"
  message="Failed to connect to the server"
  details="Network error: Unable to reach api.example.com"
  onRetry={handleRetry}
  onBack={handleBack}
/>
```

**Features:**
- Different visual styles based on error type
- Contextual icons and colors
- Retry and back actions
- Detailed error information display

### NominationsErrorState

Error state component for the nominations page that displays different types of errors with appropriate visuals and actions.

**Props:**
- `error`: The error message
- `errorType`: The type of error (optional)
- `errorDetails`: Additional error details (optional)
- `onRetry`: Function to retry the operation
- `onBack`: Function to go back (optional)

**Usage:**
```tsx
<NominationsErrorState
  error="Failed to load nominations"
  onRetry={handleRetry}
  onBack={handleBack}
/>
```

**Features:**
- Automatic error type detection from error message
- Contextual error display
- Retry with exponential backoff
- Navigation options

## Responsive Design Components

The Book Nomination System uses a mobile-first approach with the following breakpoints:

- `xs`: 480px (Extra small devices)
- `sm`: 640px (Small devices)
- `md`: 768px (Medium devices)
- `lg`: 1024px (Large devices)
- `xl`: 1280px (Extra large devices)
- `2xl`: 1536px (2X large devices)

### NominationCard

A responsive card component for displaying a book nomination in list view.

**Features:**
- Stacked layout on mobile, horizontal layout on larger screens
- Centered content on mobile, left-aligned on larger screens
- Touch-friendly hit areas (minimum 44x44px)
- Responsive text sizes
- Responsive action button layout

### NominationGrid

A responsive grid component for displaying book nominations in a grid layout.

**Features:**
- 1 column on mobile, 2 columns on small screens, 3 columns on large screens
- Staggered animation for items
- Responsive card heights
- Touch-friendly controls

## Animation and Transition Patterns

The Book Nomination System uses the following animation patterns:

### Fade In

Used for elements that appear on the page.

```css
.animate-fade-in {
  animation: fade-in 0.3s ease-in-out;
}

@keyframes fade-in {
  0% { opacity: 0; }
  100% { opacity: 1; }
}
```

### Slide Up

Used for elements that appear from the bottom of the screen.

```css
.animate-slide-up {
  animation: slide-up 0.4s ease-out;
}

@keyframes slide-up {
  0% { transform: translateY(10px); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
}
```

### Shimmer

Used for skeleton loading states.

```css
.animate-shimmer {
  animation: shimmer 2.5s ease-in-out infinite;
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
```

### Pulse Subtle

Used for subtle loading indicators.

```css
.animate-pulse-subtle {
  animation: pulse-subtle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse-subtle {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}
```
