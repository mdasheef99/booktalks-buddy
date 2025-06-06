# Phase 2: Carousel Management System Implementation

## Phase Overview
**Duration**: 8-10 days
**Actual Duration**: 3 days (accelerated implementation)
**Priority**: HIGH
**Dependencies**: Phase 1 complete
**Team Size**: 2-3 developers
**Status**: ✅ COMPLETED (January 28, 2025)

## Objectives
- Create CarouselSection component for landing page
- Build comprehensive carousel management admin interface
- Implement drag-and-drop book ordering functionality
- Add image upload and book entry system
- Implement responsive carousel with auto-slide features

## Component Architecture

### Landing Page Integration

#### CarouselSection Component
**File**: `src/components/landing/CarouselSection.tsx`

**Component Structure**:
```typescript
interface CarouselSectionProps {
  storeId: string;
}

interface CarouselItem {
  id: string;
  position: number;
  bookTitle: string;
  bookAuthor: string;
  bookImageUrl: string;
  customDescription?: string;
  featuredBadge?: string;
  overlayText?: string;
  clickDestinationUrl?: string;
  isActive: boolean;
}
```

**Key Features**:
- Displays up to 6 books in sliding carousel
- Auto-slide with configurable timing (3-8 seconds)
- Manual navigation with arrows and dots
- Responsive design (2-3 books on mobile, 6 on desktop)
- Smooth transitions with CSS animations
- Click tracking for analytics

**Styling Requirements**:
- Height: `min-h-[25vh]` (compact design)
- Background: Neutral gradient complementing hero section
- Book cards: Consistent with existing design patterns
- Hover effects: Subtle scale and shadow animations

#### BookCarousel Component
**File**: `src/components/landing/carousel/BookCarousel.tsx`

**Responsibilities**:
- Handle carousel navigation logic
- Manage auto-slide timing
- Implement touch/swipe gestures for mobile
- Control transition animations
- Track user interactions for analytics

#### BookCard Component
**File**: `src/components/landing/carousel/BookCard.tsx`

**Display Elements**:
- Book cover image with lazy loading
- Book title and author
- Optional featured badge (New, Staff Pick, Sale, etc.)
- Optional overlay text (price, availability)
- Click destination handling

### Admin Interface Components

#### CarouselManagement Page
**File**: `src/pages/admin/store/CarouselManagement.tsx`

**Interface Sections**:
1. **Carousel Preview**: Live preview of current carousel
2. **Book Management Grid**: 6-slot grid for book management
3. **Book Search/Add**: Search existing inventory or manual entry
4. **Bulk Operations**: Import/export, bulk updates
5. **Settings Panel**: Auto-slide timing, transition effects

#### BookManagementGrid Component
**File**: `src/components/admin/store/carousel/BookManagementGrid.tsx`

**Features**:
- 6 fixed positions with drag-and-drop reordering
- Empty slot placeholders with "Add Book" buttons
- Book preview cards with edit/remove options
- Position indicators (1-6)
- Validation feedback for required fields

#### BookEntryModal Component
**File**: `src/components/admin/store/carousel/BookEntryModal.tsx`

**Form Fields**:
- Book title (required, max 200 chars)
- Book author (required, max 100 chars)
- Book ISBN (optional, validation)
- Custom description (optional, max 300 chars)
- Featured badge selection
- Overlay text (optional, max 100 chars)
- Book cover image upload
- Click destination URL (optional)

#### BookSearchInterface Component
**File**: `src/components/admin/store/carousel/BookSearchInterface.tsx`

**Search Capabilities**:
- Search by title, author, ISBN
- Filter by genre, publication year
- Integration with external book APIs (Google Books, OpenLibrary)
- Import book data with cover images
- Manual entry fallback option

## API Implementation

### Carousel Data API
**File**: `src/lib/api/store/carousel.ts`

**Core Functions**:
```typescript
// Fetch carousel items for store
async function getCarouselItems(storeId: string): Promise<CarouselItem[]>

// Update carousel item
async function updateCarouselItem(storeId: string, item: CarouselItem): Promise<void>

// Reorder carousel items
async function reorderCarouselItems(storeId: string, newOrder: number[]): Promise<void>

// Delete carousel item
async function deleteCarouselItem(storeId: string, itemId: string): Promise<void>

// Upload book cover image
async function uploadBookCover(file: File, storeId: string): Promise<string>
```

**API Endpoints**:
- `GET /api/store/[storeId]/carousel` - Fetch carousel items
- `POST /api/store/[storeId]/carousel` - Create new carousel item
- `PUT /api/store/[storeId]/carousel/[itemId]` - Update carousel item
- `DELETE /api/store/[storeId]/carousel/[itemId]` - Delete carousel item
- `POST /api/store/[storeId]/carousel/reorder` - Reorder items

### Image Upload API
**File**: `src/lib/api/store/imageUpload.ts`

**Upload Features**:
- File validation (type, size, dimensions)
- Image optimization (resize, compress, WebP conversion)
- Progress tracking for large uploads
- Error handling with user feedback
- Automatic cleanup of unused images

**Supabase Storage Integration**:
- Bucket: `store-carousel-images`
- Path structure: `{storeId}/carousel/{itemId}/{filename}`
- Public URL generation for display
- Automatic image optimization pipeline

## Database Integration

### Carousel Items Management
**Table**: `store_carousel_items`

**Key Operations**:
```sql
-- Fetch active carousel items for store
SELECT * FROM store_carousel_items
WHERE store_id = $1 AND is_active = true
ORDER BY position ASC;

-- Update item position (for reordering)
UPDATE store_carousel_items
SET position = $2, updated_at = now()
WHERE id = $1 AND store_id = $3;

-- Toggle item active status
UPDATE store_carousel_items
SET is_active = $2, updated_at = now()
WHERE id = $1 AND store_id = $3;
```

**Position Management Logic**:
- Positions 1-6 are fixed slots
- When item is deleted, positions are automatically adjusted
- Drag-and-drop updates multiple positions in single transaction
- Validation prevents duplicate positions

### Store Customization Integration
**Table**: `store_landing_customization`

**Carousel Settings**:
```sql
-- Update carousel visibility
UPDATE store_landing_customization
SET sections_enabled = jsonb_set(
    sections_enabled,
    '{carousel}',
    'true'::jsonb
)
WHERE store_id = $1;
```

## Implementation Tasks

### Task 1: CarouselSection Landing Page Component
**Estimated Time**: 3 days
**Assignee**: Frontend Developer

**Subtasks**:
1. Create CarouselSection component with responsive design
2. Implement BookCarousel with navigation controls
3. Build BookCard component with hover effects
4. Add auto-slide functionality with pause on hover
5. Implement touch/swipe gestures for mobile
6. Add loading states and error handling
7. Integrate with analytics tracking

**Files to Create**:
- `src/components/landing/CarouselSection.tsx`
- `src/components/landing/carousel/BookCarousel.tsx`
- `src/components/landing/carousel/BookCard.tsx`
- `src/components/landing/carousel/CarouselControls.tsx`

**Integration Points**:
- Add to `src/pages/Landing.tsx` above HeroSection
- Implement conditional rendering based on carousel items
- Connect to store customization API

### Task 2: Carousel Management Admin Interface
**Estimated Time**: 4 days
**Assignee**: Frontend Developer + UX Designer

**Subtasks**:
1. Create CarouselManagement page layout
2. Build BookManagementGrid with drag-and-drop
3. Implement BookEntryModal with form validation
4. Create BookSearchInterface with external API integration
5. Add bulk operations functionality
6. Implement live preview of carousel changes
7. Add settings panel for carousel behavior

**Files to Create**:
- `src/pages/admin/store/CarouselManagement.tsx`
- `src/components/admin/store/carousel/BookManagementGrid.tsx`
- `src/components/admin/store/carousel/BookEntryModal.tsx`
- `src/components/admin/store/carousel/BookSearchInterface.tsx`
- `src/components/admin/store/carousel/CarouselPreview.tsx`

**UX Requirements**:
- Intuitive drag-and-drop with visual feedback
- Clear empty state messaging
- Progress indicators for uploads
- Validation feedback with helpful error messages

### Task 3: API and Database Integration
**Estimated Time**: 2 days
**Assignee**: Backend Developer

**Subtasks**:
1. Implement carousel CRUD API endpoints
2. Add image upload with optimization
3. Create reordering logic with transaction safety
4. Implement validation and error handling
5. Add analytics tracking for carousel interactions
6. Create database helper functions

**Files to Create**:
- `src/lib/api/store/carousel.ts`
- `src/lib/api/store/imageUpload.ts`
- `src/pages/api/store/[storeId]/carousel/index.ts`
- `src/pages/api/store/[storeId]/carousel/[itemId].ts`
- `src/pages/api/store/[storeId]/carousel/reorder.ts`

**Validation Requirements**:
- Store Owner authorization on all endpoints
- Image file type and size validation
- Book data validation (title, author required)
- Position uniqueness enforcement

### Task 4: External Book API Integration
**Estimated Time**: 1 day
**Assignee**: Backend Developer

**Subtasks**:
1. Integrate Google Books API for book search
2. Add OpenLibrary API as fallback
3. Implement book data normalization
4. Add cover image fetching and caching
5. Handle API rate limits and errors

**Files to Create**:
- `src/lib/external/googleBooksAPI.ts`
- `src/lib/external/openLibraryAPI.ts`
- `src/lib/external/bookDataNormalizer.ts`

**API Integration Requirements**:
- Search by title, author, ISBN
- Fetch high-quality cover images
- Normalize data format across APIs
- Handle API failures gracefully

## Testing Requirements

### Unit Tests
**Coverage Target**: >85%

**Test Files**:
- `src/components/landing/CarouselSection.test.tsx`
- `src/components/admin/store/carousel/BookManagementGrid.test.tsx`
- `src/lib/api/store/carousel.test.ts`

**Test Scenarios**:
- Carousel navigation and auto-slide
- Drag-and-drop reordering
- Image upload validation
- API error handling
- Responsive design breakpoints

### Integration Tests
**Test Scenarios**:
- End-to-end carousel management workflow
- Image upload and optimization pipeline
- Store Owner authorization
- Database transaction integrity
- External API integration

### Performance Tests
**Metrics**:
- Carousel load time <2 seconds
- Image optimization reduces size by >60%
- Smooth animations at 60fps
- Mobile touch responsiveness <100ms

## Success Criteria

### Functional Requirements
- [x] Store Owner can add/edit/remove carousel books ✅
- [x] Drag-and-drop reordering works smoothly ✅
- [x] Carousel displays correctly on landing page ✅
- [x] Auto-slide and manual navigation function properly ✅
- [x] Image uploads work with proper optimization ✅
- [x] External book search imports data correctly ✅
- [x] Section hides when no books are configured ✅

### Performance Requirements
- [x] Carousel loads in under 2 seconds ✅
- [x] Images are optimized and load quickly ✅
- [x] Animations are smooth on all devices ✅
- [x] Mobile responsiveness works across screen sizes ✅

### User Experience Requirements
- [x] Admin interface is intuitive and easy to use ✅
- [x] Visual feedback for all user actions ✅
- [x] Clear error messages and validation ✅
- [x] Consistent design with existing admin panel ✅

## Risk Mitigation

### Image Upload Risks
**Risk**: Large image files slow down uploads
**Mitigation**: Client-side compression, progress indicators, file size limits

### External API Risks
**Risk**: Book API rate limits or failures
**Mitigation**: Multiple API providers, caching, graceful fallbacks

### Performance Risks
**Risk**: Carousel affects landing page load time
**Mitigation**: Lazy loading, image optimization, efficient queries

### UX Risks
**Risk**: Drag-and-drop confusing for users
**Mitigation**: Clear visual feedback, tooltips, user testing

## Next Phase Preparation

### Phase 3 Prerequisites
- Carousel system fully functional
- Image upload infrastructure stable
- Admin interface tested and polished
- Analytics tracking implemented

### Integration Points for Phase 3
- Hero section will need to accommodate reduced height
- Promotional banners will be positioned after hero
- Analytics data will feed into landing page dashboard

---

## ✅ PHASE 2 COMPLETION SUMMARY (January 28, 2025)

### **Successfully Implemented Components**
1. **CarouselSection** (`src/components/landing/CarouselSection.tsx`) - Landing page integration
2. **BookCarousel** (`src/components/landing/carousel/BookCarousel.tsx`) - Responsive carousel with auto-slide
3. **BookCard** (`src/components/landing/carousel/BookCard.tsx`) - Individual book display cards
4. **CarouselControls** (`src/components/landing/carousel/CarouselControls.tsx`) - Navigation dots
5. **CarouselManagement** (`src/pages/admin/store/CarouselManagement.tsx`) - Admin interface
6. **BookManagementGrid** - Drag-and-drop book management
7. **BookEntryModal** - Book creation/editing interface
8. **BookSearchInterface** - External API book search

### **Key Features Delivered**
- ✅ 6-book carousel with responsive design (2-3 mobile, 6 desktop)
- ✅ Drag-and-drop reordering with visual feedback
- ✅ Image upload with optimization and validation
- ✅ Auto-slide with pause on hover
- ✅ Touch/swipe gestures for mobile
- ✅ Section hiding when no books configured
- ✅ Integration with Google Books API and OpenLibrary
- ✅ Complete admin management interface

### **Technical Achievements**
- ✅ Embla Carousel integration with custom controls
- ✅ React Query for efficient data management
- ✅ Supabase Storage integration for images
- ✅ Responsive breakpoints and mobile optimization
- ✅ Store Owner route guard integration
- ✅ Database schema and RLS policies

### **Next Phase Ready**
Phase 2 is complete and ready for Phase 4 (Promotional Banners) integration. All carousel functionality is operational and tested.
