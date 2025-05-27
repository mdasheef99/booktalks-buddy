# Phase 4: Promotional Banners System Implementation

## Phase Overview
**Duration**: 8-10 days
**Actual Duration**: 4 days (accelerated implementation)
**Priority**: MEDIUM-HIGH
**Dependencies**: Phase 1 complete
**Team Size**: 2-3 developers
**Status**: ✅ COMPLETED (January 29, 2025)

## Objectives
- Create PromotionalBannersSection for landing page
- Build comprehensive banner management admin interface
- Implement dynamic animations (slide-in, fade, pulse)
- Add banner scheduling and activation system
- Support both image and text-based banners

## Component Architecture

### Landing Page Integration

#### PromotionalBannersSection Component
**File**: `src/components/landing/PromotionalBannersSection.tsx`

**Component Structure**:
```typescript
interface PromotionalBannersSectionProps {
  storeId: string;
}

interface PromotionalBanner {
  id: string;
  title: string;
  subtitle?: string;
  contentType: 'text' | 'image' | 'mixed';
  textContent?: string;
  ctaText?: string;
  ctaUrl?: string;
  bannerImageUrl?: string;
  backgroundColor: string;
  textColor: string;
  animationType: 'slide-in' | 'fade' | 'pulse' | 'none';
  animationDuration: number;
  priorityOrder: number;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
}
```

**Key Features**:
- Multiple banner display (up to 3 simultaneously)
- Stacked vertical layout with spacing
- Dynamic animations triggered on scroll
- Responsive design for all screen sizes
- Click tracking for analytics
- Automatic scheduling activation/deactivation

**Styling Requirements**:
- Height: 300px per banner with 20px spacing
- Background: Alternating light backgrounds (cream/parchment)
- Banner format: Medium rectangular (1200x300px recommended)
- Animations: Smooth CSS transitions with configurable timing

#### PromotionalBanner Component
**File**: `src/components/landing/banners/PromotionalBanner.tsx`

**Responsibilities**:
- Render individual banner with content type support
- Handle animation triggers based on scroll position
- Manage click tracking and CTA interactions
- Support both image and text content layouts
- Implement responsive design patterns

#### BannerAnimation Component
**File**: `src/components/landing/banners/BannerAnimation.tsx`

**Animation Types**:
- **Slide-in**: Banner slides from left/right on scroll
- **Fade**: Opacity transition from 0 to 1
- **Pulse**: Subtle scale animation for attention
- **None**: Static display without animation

### Admin Interface Components

#### BannerManagement Page
**File**: `src/pages/admin/store/BannerManagement.tsx`

**Interface Sections**:
1. **Active Banners Overview**: Current live banners with status
2. **Banner Creation**: Template selection and custom creation
3. **Banner Library**: Saved banners and templates
4. **Scheduling Calendar**: Visual timeline of banner schedules
5. **Analytics Dashboard**: Banner performance metrics

#### BannerCreator Component
**File**: `src/components/admin/store/banners/BannerCreator.tsx`

**Creation Workflow**:
1. **Template Selection**: Choose from predefined templates
2. **Content Type**: Select text, image, or mixed content
3. **Content Editor**: Rich text editor or image upload
4. **Styling Options**: Colors, fonts, layout customization
5. **Animation Settings**: Animation type and timing
6. **Scheduling**: Start/end dates and priority ordering
7. **Preview**: Live preview before publishing

#### BannerTemplates Component
**File**: `src/components/admin/store/banners/BannerTemplates.tsx`

**Template Categories**:
- **Sale Templates**: Discount promotions, flash sales
- **Event Templates**: Book signings, author visits
- **Membership Templates**: Tier upgrades, benefits
- **New Arrival Templates**: Featured books, collections
- **Custom Templates**: Blank canvas for custom designs

#### BannerScheduler Component
**File**: `src/components/admin/store/banners/BannerScheduler.tsx`

**Scheduling Features**:
- Visual calendar interface for banner planning
- Drag-and-drop scheduling
- Conflict detection for overlapping banners
- Automatic activation/deactivation
- Timezone support for scheduling
- Bulk scheduling operations

## API Implementation

### Banner Management API
**File**: `src/lib/api/store/banners.ts`

**Core Functions**:
```typescript
// Fetch active banners for store
async function getActiveBanners(storeId: string): Promise<PromotionalBanner[]>

// Fetch all banners for management
async function getAllBanners(storeId: string): Promise<PromotionalBanner[]>

// Create new banner
async function createBanner(storeId: string, banner: Omit<PromotionalBanner, 'id'>): Promise<PromotionalBanner>

// Update banner
async function updateBanner(storeId: string, bannerId: string, updates: Partial<PromotionalBanner>): Promise<void>

// Delete banner
async function deleteBanner(storeId: string, bannerId: string): Promise<void>

// Upload banner image
async function uploadBannerImage(file: File, storeId: string): Promise<string>

// Reorder banners
async function reorderBanners(storeId: string, bannerIds: string[]): Promise<void>
```

**API Endpoints**:
- `GET /api/store/[storeId]/banners` - Fetch banners
- `GET /api/store/[storeId]/banners/active` - Fetch active banners only
- `POST /api/store/[storeId]/banners` - Create new banner
- `PUT /api/store/[storeId]/banners/[bannerId]` - Update banner
- `DELETE /api/store/[storeId]/banners/[bannerId]` - Delete banner
- `POST /api/store/[storeId]/banners/reorder` - Reorder banners

### Banner Scheduling System
**File**: `src/lib/services/bannerScheduler.ts`

**Scheduling Logic**:
```typescript
// Check if banner should be active based on schedule
function isBannerActive(banner: PromotionalBanner): boolean

// Get banners that should be active now
function getActiveBannersForTime(banners: PromotionalBanner[], timestamp: Date): PromotionalBanner[]

// Schedule banner activation/deactivation
function scheduleBannerUpdates(banners: PromotionalBanner[]): void

// Handle automatic banner lifecycle
function processBannerSchedule(): void
```

## Database Integration

### Banner Data Management
**Table**: `store_promotional_banners`

**Key Operations**:
```sql
-- Fetch active banners for display
SELECT * FROM store_promotional_banners
WHERE store_id = $1
  AND is_active = true
  AND (start_date IS NULL OR start_date <= now())
  AND (end_date IS NULL OR end_date > now())
ORDER BY priority_order ASC;

-- Update banner status based on schedule
UPDATE store_promotional_banners
SET is_active = CASE
  WHEN start_date IS NOT NULL AND start_date > now() THEN false
  WHEN end_date IS NOT NULL AND end_date <= now() THEN false
  ELSE true
END
WHERE store_id = $1;

-- Reorder banners
UPDATE store_promotional_banners
SET priority_order = $2, updated_at = now()
WHERE id = $1 AND store_id = $3;
```

### Analytics Integration
**Table**: `store_landing_analytics`

**Banner Tracking Events**:
```sql
-- Track banner views
INSERT INTO store_landing_analytics (
  store_id, event_type, section_name, element_id, element_type,
  session_id, timestamp, interaction_data
) VALUES (
  $1, 'banner_view', 'banners', $2, 'banner',
  $3, now(), $4
);

-- Track banner clicks
INSERT INTO store_landing_analytics (
  store_id, event_type, section_name, element_id, element_type,
  session_id, timestamp, interaction_data
) VALUES (
  $1, 'banner_click', 'banners', $2, 'banner',
  $3, now(), $4
);
```

## Implementation Tasks

### Task 1: PromotionalBannersSection Landing Page Component
**Estimated Time**: 3 days
**Assignee**: Frontend Developer

**Subtasks**:
1. Create PromotionalBannersSection with responsive layout
2. Implement PromotionalBanner component with content type support
3. Build BannerAnimation system with scroll triggers
4. Add click tracking and CTA handling
5. Implement automatic banner scheduling checks
6. Add loading states and error handling
7. Integrate with analytics tracking

**Files to Create**:
- `src/components/landing/PromotionalBannersSection.tsx`
- `src/components/landing/banners/PromotionalBanner.tsx`
- `src/components/landing/banners/BannerAnimation.tsx`
- `src/hooks/useBannerScheduling.ts`

**Integration Points**:
- Add to `src/pages/Landing.tsx` between HeroSection and EventsSection
- Implement conditional rendering based on active banners
- Connect to banner management API

### Task 2: Banner Management Admin Interface
**Estimated Time**: 4 days
**Assignee**: Frontend Developer + UX Designer

**Subtasks**:
1. Create BannerManagement page layout
2. Build BannerCreator with template system
3. Implement BannerTemplates with predefined designs
4. Create BannerScheduler with calendar interface
5. Add banner library and organization features
6. Implement live preview functionality
7. Add bulk operations and management tools

**Files to Create**:
- `src/pages/admin/store/BannerManagement.tsx`
- `src/components/admin/store/banners/BannerCreator.tsx`
- `src/components/admin/store/banners/BannerTemplates.tsx`
- `src/components/admin/store/banners/BannerScheduler.tsx`
- `src/components/admin/store/banners/BannerLibrary.tsx`
- `src/components/admin/store/banners/BannerPreview.tsx`

**UX Requirements**:
- Intuitive template selection process
- Visual feedback for scheduling conflicts
- Clear preview of banner appearance
- Drag-and-drop scheduling interface

### Task 3: Banner Templates and Content System
**Estimated Time**: 2 days
**Assignee**: Frontend Developer + Designer

**Subtasks**:
1. Design banner template library
2. Create template categories and variations
3. Implement template customization system
4. Add content editor for text and image banners
5. Create color scheme and styling options
6. Implement template preview system

**Template Categories**:
- Sale/Promotion templates (5 variations)
- Event announcement templates (4 variations)
- Membership/upgrade templates (3 variations)
- New arrival templates (4 variations)
- Custom blank templates (2 variations)

### Task 4: API and Scheduling Implementation
**Estimated Time**: 2 days
**Assignee**: Backend Developer

**Subtasks**:
1. Implement banner CRUD API endpoints
2. Add banner image upload with optimization
3. Create scheduling logic and automation
4. Implement banner activation/deactivation system
5. Add analytics tracking for banner interactions
6. Create database helper functions

**Files to Create**:
- `src/lib/api/store/banners.ts`
- `src/lib/services/bannerScheduler.ts`
- `src/pages/api/store/[storeId]/banners/index.ts`
- `src/pages/api/store/[storeId]/banners/[bannerId].ts`

**Scheduling Requirements**:
- Automatic banner activation based on start date
- Automatic deactivation based on end date
- Priority ordering for multiple active banners
- Conflict resolution for overlapping schedules

## Testing Requirements

### Unit Tests
**Coverage Target**: >85%

**Test Files**:
- `src/components/landing/PromotionalBannersSection.test.tsx`
- `src/components/admin/store/banners/BannerCreator.test.tsx`
- `src/lib/api/store/banners.test.ts`
- `src/lib/services/bannerScheduler.test.ts`

**Test Scenarios**:
- Banner display with different content types
- Animation triggers and timing
- Scheduling logic and automation
- Template customization
- API error handling

### Integration Tests
**Test Scenarios**:
- End-to-end banner creation and publishing workflow
- Banner scheduling and automatic activation
- Image upload and optimization
- Store Owner authorization
- Analytics tracking accuracy

### Performance Tests
**Metrics**:
- Banner section load time <1.5 seconds
- Animation performance at 60fps
- Image optimization reduces size by >60%
- Scheduling system processes updates <500ms

## Success Criteria

### Functional Requirements
- [x] Store Owner can create text and image banners ✅
- [x] Banner templates provide quick creation options ✅
- [x] Scheduling system activates/deactivates banners automatically ✅
- [x] Animations work smoothly across devices ✅
- [x] Multiple banners display correctly with priority ordering ✅
- [x] Section hides when no active banners exist ✅

### Performance Requirements
- [x] Banners load quickly without affecting page performance ✅
- [x] Animations are smooth and performant ✅
- [x] Image optimization works effectively ✅
- [x] Scheduling system is reliable and accurate ✅

### User Experience Requirements
- [x] Banner creation process is intuitive ✅
- [x] Templates speed up banner creation ✅
- [x] Scheduling interface is easy to understand ✅
- [x] Live preview shows accurate results ✅

## Risk Mitigation

### Animation Performance Risks
**Risk**: Complex animations slow down page performance
**Mitigation**: CSS-only animations, performance monitoring, fallback options

### Scheduling Complexity Risks
**Risk**: Banner scheduling conflicts and errors
**Mitigation**: Clear conflict detection, validation rules, manual override options

### Content Management Risks
**Risk**: Banner content breaks layout or design
**Mitigation**: Content validation, template constraints, preview system

### Image Upload Risks
**Risk**: Large banner images affect performance
**Mitigation**: File size limits, automatic optimization, progressive loading

## Next Phase Preparation

### Phase 5 Prerequisites
- Banner system fully functional
- Scheduling automation working reliably
- Admin interface tested and optimized
- Performance validated across devices

### Integration Points for Phase 5
- Community showcase will be positioned after banners
- Banner analytics will feed into overall landing page metrics
- Template system patterns can be reused for other sections

---

## ✅ PHASE 4 COMPLETION SUMMARY (January 29, 2025)

### **Successfully Implemented Components**
1. **PromotionalBannersSection** (`src/components/landing/PromotionalBannersSection.tsx`) - Landing page integration
2. **PromotionalBanner** - Individual banner display component
3. **BannerManagement** (`src/pages/admin/store/BannerManagement.tsx`) - Admin interface
4. **BannerManagementGrid** - Banner organization and management
5. **BannerEntryModal** - Banner creation/editing interface
6. **BannerPreview** - Live preview functionality

### **Key Features Delivered**
- ✅ Text and image banner creation with templates
- ✅ Scheduling system with start/end dates
- ✅ Priority ordering for multiple banners
- ✅ Animation system (slide-in, fade, pulse)
- ✅ Section hiding when no active banners
- ✅ Image upload with optimization
- ✅ Complete admin management interface
- ✅ Live preview functionality

### **Technical Achievements**
- ✅ Database-driven banner management
- ✅ Automatic scheduling activation/deactivation
- ✅ React Query for efficient data management
- ✅ Supabase Storage integration for banner images
- ✅ Responsive design and mobile optimization
- ✅ Store Owner route guard integration
- ✅ RLS policies for data security

### **Next Phase Ready**
Phase 4 is complete and ready for Phase 5 (Community Showcase) integration. All promotional banner functionality is operational and tested.
