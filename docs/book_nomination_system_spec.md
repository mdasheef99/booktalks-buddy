# Book Club Nomination System Technical Specification

## 1. Feature Overview and Purpose

### 1.1 Purpose
The Book Club Nomination System enables book club members to nominate books for the club to read, "like" nominations they're interested in, and allows club administrators to select the most popular books as the club's current book. This feature enhances member engagement and provides a democratic approach to book selection.

### 1.2 Core Functionality
- Book search using Google Books API
- Book nomination by club members
- "Like" system for nominated books
- Current book selection by club administrators
- Display of current book with enhanced details

### 1.3 User Roles and Capabilities
- **Regular Members**: Search books, nominate books, view nominations, like/unlike nominations
- **Club Administrators**: All member capabilities plus selecting current books and managing nominations

## 2. Database Schema Changes

### 2.1 New Tables

#### 2.1.1 books
```
books
  id: UUID (PK)
  google_books_id: TEXT (UNIQUE)
  title: TEXT (NOT NULL)
  author: TEXT (NOT NULL)
  cover_url: TEXT
  description: TEXT
  genre: TEXT
  created_at: TIMESTAMPTZ DEFAULT now()
```

#### 2.1.2 book_nominations
```
book_nominations
  id: UUID (PK)
  club_id: UUID (FK -> book_clubs.id)
  book_id: UUID (FK -> books.id)
  nominated_by: UUID (FK -> auth.users.id)
  status: TEXT CHECK (status IN ('active', 'selected', 'archived'))
  nominated_at: TIMESTAMPTZ DEFAULT now()
  UNIQUE(club_id, book_id)
```

#### 2.1.3 book_likes
```
book_likes
  nomination_id: UUID (FK -> book_nominations.id)
  user_id: UUID (FK -> auth.users.id)
  created_at: TIMESTAMPTZ DEFAULT now()
  PRIMARY KEY (nomination_id, user_id)
```

### 2.2 Modifications to Existing Tables

#### 2.2.1 current_books
```
ALTER TABLE current_books
ADD COLUMN book_id UUID REFERENCES books(id),
ADD COLUMN nomination_id UUID REFERENCES book_nominations(id);
```

### 2.3 Database Relationships
- A book can have multiple nominations across different clubs
- A nomination belongs to one club and references one book
- A nomination can have multiple likes from different users
- A user can like multiple nominations but only once per nomination
- A club has one current book at a time

## 3. API Functionality Specifications

### 3.1 Book Repository

#### 3.1.1 searchBooks
- **Purpose**: Search for books using Google Books API
- **Parameters**: query (string)
- **Returns**: Array of book objects with details
- **Permissions**: Available to all club members

#### 3.1.2 getBookById
- **Purpose**: Retrieve a specific book by ID
- **Parameters**: id (string)
- **Returns**: Book object with details
- **Permissions**: Available to all club members

#### 3.1.3 saveBook
- **Purpose**: Save a book to the database
- **Parameters**: book object
- **Returns**: Book ID
- **Permissions**: Internal function, called by nomination process

### 3.2 Nomination Manager

#### 3.2.1 nominateBook
- **Purpose**: Create a new book nomination
- **Parameters**: userId, clubId, book object
- **Returns**: Nomination ID
- **Permissions**: Club members only

#### 3.2.2 getNominations
- **Purpose**: Get all nominations for a club
- **Parameters**: clubId
- **Returns**: Array of nominations with book details and like counts
- **Permissions**: Club members only

#### 3.2.3 getNominationById
- **Purpose**: Get details of a specific nomination
- **Parameters**: nominationId
- **Returns**: Nomination with book details and like count
- **Permissions**: Club members only

### 3.3 Like Manager

#### 3.3.1 likeNomination
- **Purpose**: Like a book nomination
- **Parameters**: userId, nominationId
- **Returns**: Success status
- **Permissions**: Club members only

#### 3.3.2 unlikeNomination
- **Purpose**: Remove a like from a nomination
- **Parameters**: userId, nominationId
- **Returns**: Success status
- **Permissions**: Club members only

#### 3.3.3 getLikes
- **Purpose**: Get all likes for a nomination
- **Parameters**: nominationId
- **Returns**: Array of likes with user details
- **Permissions**: Club members only

### 3.4 Current Book Manager

#### 3.4.1 getCurrentBook
- **Purpose**: Get the current book for a club
- **Parameters**: clubId
- **Returns**: Current book with details
- **Permissions**: Club members only

#### 3.4.2 setCurrentBook
- **Purpose**: Set a nominated book as the current book
- **Parameters**: userId, clubId, nominationId
- **Returns**: Success status
- **Permissions**: Club administrators only

## 4. User Interface Components and Flows

### 4.1 Regular Club Members

#### 4.1.1 Discovering the Nomination Feature
- New "Nominations" tab in book club navigation
- Shows count of active nominations
- Accessible to all club members

#### 4.1.2 Searching and Nominating Books
- "Nominate a Book" button at top of nominations list
- Dedicated nomination page with tabbed interface
- Search tab with results from Google Books API
- Preview tab for reviewing book details before nomination
- Book cards showing cover, title, author, and description
- Responsive design for all screen sizes
- Comprehensive error handling and loading states

#### 4.1.3 Viewing Nominations
- List and grid view options for nominations
- Each nomination shows book cover, title, author, description, nominator, and like count
- Status indicators for active, selected, and archived nominations
- Sorting options (most liked, newest)
- Filtering options by status (active, selected, archived, all)
- Responsive layout that adapts to different screen sizes
- Staggered animation for smooth loading experience

#### 4.1.4 Liking/Unliking Nominations
- Like button on each nomination card with count indicator
- Visual indication of nominations the user has already liked (color change)
- Loading state during like/unlike operation
- Real-time update of like count when clicked
- Optimistic UI updates for better user experience
- Touch-friendly hit areas for mobile users

### 4.2 Club Administrators

#### 4.2.1 Reviewing Nominations
- Enhanced view of nominations list with admin controls
- Sorting by popularity to identify top nominations
- Status indicators for nominations

#### 4.2.2 Selecting Current Book
- "Set as Current Book" button on nomination cards
- Confirmation modal before changing current book
- Option to archive other nominations after selection

#### 4.2.3 Managing Nominations
- Ability to archive old or inappropriate nominations
- Option to feature specific nominations
- Controls for nomination rules (if implemented)

## 5. Integration Points with Existing Book Club Feature

### 5.1 Current Book Display
- Enhanced current book section showing cover image and full details
- Source information (nominated by, selected on)
- "Change Book" button for administrators

### 5.2 Club Navigation
- New "Nominations" tab alongside existing tabs
- Updated current book section with richer information
- Activity indicators for new nominations

### 5.3 Permissions System
- Leverage existing club_members roles for permissions
- Use isClubMember and isClubAdmin functions for access control

### 5.4 User Profiles
- Potential integration with user profiles to show books they've nominated

## 6. Implementation Phases and Priorities

### 6.1 Phase 1: Database Foundation ✅
- ✅ Create new tables (books, book_nominations, book_likes)
- ✅ Modify current_books table
- ✅ Migrate existing current book data
- ✅ Implement Row Level Security policies

**Status**: Completed on July 1, 2025
**Migration File**: `supabase/migrations/20250701_add_book_nomination_system.sql`

**Implementation Notes**:
- Successfully created all required tables with proper relationships
- Added foreign key references to the current_books table
- Implemented comprehensive RLS policies for security
- Created indexes for performance optimization

### 6.2 Phase 2: Core API Implementation ✅
- ✅ Implement Google Books API integration
- ✅ Develop nomination and like functionality
- ✅ Update current book management functions

**Status**: Completed on July 1, 2025
**Implementation Files**:
- `src/lib/api/bookclubs/nominations/index.ts` - Book nomination functionality
- `src/lib/api/bookclubs/nominations/create.ts` - Nomination creation
- `src/lib/api/bookclubs/nominations/retrieve.ts` - Nomination retrieval
- `src/lib/api/bookclubs/nominations/manage.ts` - Nomination management
- `src/lib/api/bookclubs/likes.ts` - Like/unlike functionality
- `src/lib/api/bookclubs/books/search.ts` - Book search functionality
- `src/lib/api/bookclubs/books/storage.ts` - Book storage functionality
- `src/lib/api/bookclubs/types.ts` - Type definitions
- `src/integrations/supabase/types.ts` - Updated database types

**Implementation Notes**:
- Modularized API functions into smaller, focused files for better maintainability
- Created comprehensive API functions for nominations with proper error handling
- Implemented like/unlike functionality with user-specific tracking
- Updated current book management to work with both the new schema and maintain backward compatibility
- Updated database types to include new tables and modified existing tables
- Fixed type issues and improved error handling throughout the API functions
- Implemented efficient like counting mechanism for better performance
- Ensured proper permission checks for all operations
- Added dedicated book search functionality with Google Books API integration

### 6.3 Phase 3: Basic UI Components ✅
- ✅ Create nominations tab and list
- ✅ Implement book search interface
- ✅ Develop nomination cards with like functionality

**Status**: Completed on July 1, 2025
**Implementation Files**:
- `src/components/bookclubs/sections/NominationsSection.tsx` - Main nominations section component
- `src/components/bookclubs/nominations/NominationsList.tsx` - List of nominations
- `src/components/bookclubs/nominations/NominationCard.tsx` - Individual nomination card
- `src/components/bookclubs/nominations/NominationGrid.tsx` - Grid view for nominations
- `src/components/bookclubs/BookClubDetailsWithJoin.tsx` - Integration with book club page

**Implementation Notes**:
- Created a comprehensive UI for viewing and managing book nominations
- Implemented book search functionality using Google Books API
- Added like/unlike functionality with real-time updates
- Integrated with the existing book club page layout
- Added sorting and filtering options for nominations
- Implemented admin controls for setting current books
- Created both list and grid views for nominations
- Added navigation to the dedicated nomination page

### 6.4 Phase 4: Admin Features ✅
- ✅ Implement current book selection
- ✅ Add nomination management controls
- ✅ Enhance current book display

**Status**: Completed on July 1, 2025
**Implementation Files**:
- `src/components/bookclubs/nominations/NominationManagementModal.tsx` - Admin management modal
- `src/lib/api/bookclubs/nominations.ts` - Added archiveNomination function
- `src/components/bookclubs/nominations/NominationCard.tsx` - Enhanced with admin controls
- `src/components/bookclubs/sections/CurrentBookSection.tsx` - Enhanced current book display

**Implementation Notes**:
- Created a comprehensive nomination management modal for admins
- Implemented archive functionality for nominations
- Enhanced the current book display with cover image, description, and Google Books link
- Added admin dropdown menu for nomination management
- Improved the UI for setting a nomination as the current book
- Ensured proper permission checks for all admin operations

### 6.5 Phase 5: Refinement and Optimization ✅
- ✅ Improve performance for clubs with many nominations
- ✅ Enhance UI/UX with improved loading states and error handling
- ✅ Create dedicated nomination page with improved user experience
- ✅ Implement responsive design optimizations
- ✅ Fix image loading issues and improve visual transitions

**Status**: Completed on July 15, 2025
**Implementation Files**:
- `src/pages/BookNominationFormPage.tsx` - Dedicated page for book nomination
- `src/pages/BookNominationsPage.tsx` - Refactored nominations page
- `src/components/bookclubs/nominations/SkeletonBookCover.tsx` - Progressive image loading
- `src/components/bookclubs/nominations/ErrorDisplay.tsx` - Enhanced error handling
- `src/components/bookclubs/nominations/LoadingButton.tsx` - Improved loading states
- `src/components/bookclubs/nominations/useNominations.tsx` - Custom hook for data management

**Implementation Notes**:
- Refactored large files into smaller, more modular components for better maintainability
- Created a dedicated page for book nominations with tabbed interface for search and preview
- Fixed image loading flickering issue in SkeletonBookCover with improved state management
- Implemented comprehensive error handling with contextual error messages and retry functionality
- Added loading states with staggered animations for a more natural loading experience
- Enhanced responsive design with specific breakpoints (480px, 768px, 1024px, 1280px)
- Improved touch targets for mobile users (minimum 44x44px)
- Implemented progressive image loading with smooth transitions
- Created comprehensive documentation for UI components and patterns

## 7. Technical Considerations and Challenges

### 7.1 Google Books API
- Rate limiting considerations
- Handling incomplete or inconsistent book data
- Caching strategy to reduce API calls

### 7.2 Performance Considerations
- Efficient queries for nominations with like counts
- Optimized image loading with progressive enhancement
- Staggered animations to reduce perceived loading time
- Lazy loading of images with the loading="lazy" attribute
- Responsive image handling for different screen sizes
- Optimistic UI updates for likes
- Modular code structure for better maintainability and performance
- Proper state management to prevent unnecessary re-renders

### 7.3 Data Migration
- Strategy for existing current books
- Handling edge cases during schema transition

### 7.4 Security Considerations
- Proper permission checks for all operations
- Validation of all user inputs
- Prevention of nomination/like spam
- Contextual error handling with appropriate user feedback
- Secure navigation between pages
- Proper error boundaries to prevent application crashes
- Comprehensive error logging for debugging

### 7.5 Future Extensibility
- Design to accommodate potential future features:
  - Reading progress tracking
  - Discussion threads tied to specific books
  - Book rating system
  - Reading history
