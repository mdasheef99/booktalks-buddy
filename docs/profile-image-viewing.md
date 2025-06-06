# Profile Image Viewing Feature

## Overview

The profile image viewing functionality allows users to click on other users' profile pictures to view them in full size. This feature is available when viewing other users' profiles from book club membership lists or discussion participant lists.

## How It Works

### Entry Points
- **Book Club Membership Lists**: Click on any member's profile to access their profile page
- **Discussion Participant Lists**: Click on any participant's profile to access their profile page
- **Profile Pages**: Once on a user's profile page, click their avatar to view the full-size image

### User Experience
1. **Visual Indicators**: When hovering over a clickable profile picture, users see:
   - Subtle scale animation (105% zoom)
   - Enhanced shadow effect
   - Border color change to terracotta
   - Tooltip saying "Click to view full size"

2. **Modal Experience**: When clicking on a profile picture:
   - Full-screen modal opens with dark background
   - High-quality image displayed (uses best available resolution)
   - Download button for saving the image
   - Close button and ESC key support
   - Click outside to close

### Technical Implementation

#### Components
- **ProfileImageModal**: Main modal component for displaying full-size images
- **BookClubProfileHeader**: Updated to support clickable avatars
- **SmartAvatar**: Enhanced with clickable functionality

#### Image Quality Priority
The system uses the highest quality image available:
1. `avatar_full_url` (600x600) - Primary choice
2. `avatar_medium_url` (300x300) - Fallback
3. `avatar_url` (100x100) - Last resort

#### Accessibility Features
- Proper ARIA labels and descriptions
- Keyboard navigation (ESC to close)
- Screen reader support
- Alt text for images
- Focus management

#### Responsive Design
- Works on both desktop and mobile devices
- Touch-friendly interface
- Adaptive image sizing
- Mobile-optimized modal layout

### Error Handling
- **No Image Available**: Shows placeholder with user initials
- **Image Load Failure**: Displays error message with fallback
- **Network Issues**: Graceful degradation with retry options

### Security Considerations
- Only works for viewing OTHER users' profiles (not self)
- Respects existing avatar permissions and privacy settings
- Uses existing image URLs from the avatar system

## Usage Examples

### For Users
1. Navigate to any book club
2. Click on a member's name/avatar to view their profile
3. On their profile page, click their profile picture
4. View the full-size image in the modal
5. Optionally download the image
6. Close the modal by clicking X, pressing ESC, or clicking outside

### For Developers
```tsx
// The functionality is automatically available on BookClubProfilePage
// No additional setup required

// To check if an avatar is clickable:
const hasProfileImage = hasAvatar(profile);
const isClickable = !isCurrentUser && hasProfileImage;
```

## Configuration

### Enabling/Disabling
The feature is automatically enabled for all users viewing other users' profiles. It's disabled for:
- Users viewing their own profiles (they have edit functionality instead)
- Profiles without uploaded images

### Customization
The modal appearance can be customized by modifying:
- `ProfileImageModal.tsx` - Modal styling and behavior
- `BookClubProfileHeader.tsx` - Avatar hover effects and tooltip

## Browser Support
- Modern browsers with ES6+ support
- Mobile browsers (iOS Safari, Chrome Mobile, etc.)
- Desktop browsers (Chrome, Firefox, Safari, Edge)

## Performance Considerations
- Images are loaded on-demand when modal opens
- Progressive loading with fallback chain
- Optimized image sizes for different contexts
- Lazy loading prevents unnecessary bandwidth usage

## Future Enhancements
- Image zoom functionality within the modal
- Slideshow for multiple profile images
- Social sharing options
- Image metadata display
- Fullscreen mode for better viewing experience
