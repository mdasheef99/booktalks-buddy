# Technical Specification: Current Book Reading Update Feature

## Table of Contents
1. [Database Schema Design](#database-schema-design)
2. [API Endpoint Specifications](#api-endpoint-specifications)
3. [UI Component Architecture](#ui-component-architecture)
4. [Privacy Controls Implementation](#privacy-controls-implementation)
5. [Feature Toggle System](#feature-toggle-system)
6. [Real-time Updates](#real-time-updates)
7. [Mobile Responsiveness](#mobile-responsiveness)

## Database Schema Design

### New Table: `member_reading_progress`

```sql
CREATE TABLE member_reading_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID NOT NULL REFERENCES book_clubs(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    book_id UUID REFERENCES books(id) ON DELETE SET NULL,
    
    -- Progress tracking fields
    status TEXT NOT NULL CHECK (status IN ('not_started', 'reading', 'finished')) DEFAULT 'not_started',
    progress_type TEXT CHECK (progress_type IN ('percentage', 'chapter', 'page')),
    current_progress INTEGER CHECK (current_progress >= 0),
    total_progress INTEGER CHECK (total_progress > 0),
    progress_percentage INTEGER CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    notes TEXT CHECK (char_length(notes) <= 500),
    
    -- Privacy and metadata
    is_private BOOLEAN NOT NULL DEFAULT false,
    started_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,
    last_updated TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Constraints
    UNIQUE(club_id, user_id, book_id),
    
    -- Validation constraints
    CONSTRAINT valid_progress_data CHECK (
        (progress_type = 'percentage' AND progress_percentage IS NOT NULL AND current_progress IS NULL AND total_progress IS NULL) OR
        (progress_type IN ('chapter', 'page') AND current_progress IS NOT NULL AND total_progress IS NOT NULL AND progress_percentage IS NULL) OR
        (status = 'not_started' AND progress_type IS NULL)
    ),
    CONSTRAINT valid_started_at CHECK (
        (status IN ('reading', 'finished') AND started_at IS NOT NULL) OR
        (status = 'not_started' AND started_at IS NULL)
    ),
    CONSTRAINT valid_finished_at CHECK (
        (status = 'finished' AND finished_at IS NOT NULL) OR
        (status != 'finished' AND finished_at IS NULL)
    )
);
```

### Modified Table: `book_clubs`

```sql
-- Add feature toggle column
ALTER TABLE book_clubs 
ADD COLUMN progress_tracking_enabled BOOLEAN DEFAULT false;
```

### Indexes for Performance

```sql
-- Composite indexes for frequent queries
CREATE INDEX idx_member_reading_progress_club_user ON member_reading_progress(club_id, user_id);
CREATE INDEX idx_member_reading_progress_club_book ON member_reading_progress(club_id, book_id);

-- Single column indexes
CREATE INDEX idx_member_reading_progress_user ON member_reading_progress(user_id);
CREATE INDEX idx_member_reading_progress_status ON member_reading_progress(club_id, status);
CREATE INDEX idx_member_reading_progress_updated ON member_reading_progress(last_updated DESC);

-- Feature toggle index
CREATE INDEX idx_book_clubs_progress_enabled ON book_clubs(progress_tracking_enabled) WHERE progress_tracking_enabled = true;
```

### Row Level Security (RLS) Policies

```sql
-- Enable RLS
ALTER TABLE member_reading_progress ENABLE ROW LEVEL SECURITY;

-- Users can view their own progress
CREATE POLICY "Users can view own reading progress" ON member_reading_progress
  FOR SELECT USING (user_id = auth.uid());

-- Users can view public progress of club members
CREATE POLICY "Users can view public progress in their clubs" ON member_reading_progress
  FOR SELECT USING (
    is_private = false
    AND EXISTS (
      SELECT 1 FROM club_members cm
      WHERE cm.club_id = member_reading_progress.club_id
      AND cm.user_id = auth.uid()
    )
  );

-- Users can insert their own progress
CREATE POLICY "Users can insert own reading progress" ON member_reading_progress
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM club_members cm
      WHERE cm.club_id = NEW.club_id
      AND cm.user_id = auth.uid()
    )
  );

-- Users can update their own progress
CREATE POLICY "Users can update own reading progress" ON member_reading_progress
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Users can delete their own progress
CREATE POLICY "Users can delete own reading progress" ON member_reading_progress
  FOR DELETE USING (user_id = auth.uid());
```

### Database Functions

```sql
-- Function to get club reading completion statistics
CREATE OR REPLACE FUNCTION get_club_reading_stats(p_club_id UUID)
RETURNS TABLE (
  total_members INTEGER,
  not_started_count INTEGER,
  reading_count INTEGER,
  finished_count INTEGER,
  completion_percentage DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*)::INTEGER FROM club_members WHERE club_id = p_club_id) as total_members,
    COUNT(CASE WHEN mrp.status = 'not_started' THEN 1 END)::INTEGER as not_started_count,
    COUNT(CASE WHEN mrp.status = 'reading' THEN 1 END)::INTEGER as reading_count,
    COUNT(CASE WHEN mrp.status = 'finished' THEN 1 END)::INTEGER as finished_count,
    CASE 
      WHEN COUNT(*) > 0 THEN 
        ROUND((COUNT(CASE WHEN mrp.status = 'finished' THEN 1 END)::DECIMAL / COUNT(*)::DECIMAL) * 100, 2)
      ELSE 0.0
    END as completion_percentage
  FROM member_reading_progress mrp
  WHERE mrp.club_id = p_club_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## API Endpoint Specifications

### Core Types and Interfaces

```typescript
export interface ReadingProgress {
  id: string;
  club_id: string;
  user_id: string;
  book_id: string | null;
  status: 'not_started' | 'reading' | 'finished';
  progress_type: 'percentage' | 'chapter' | 'page' | null;
  current_progress: number | null;
  total_progress: number | null;
  progress_percentage: number | null;
  notes: string | null;
  is_private: boolean;
  started_at: string | null;
  finished_at: string | null;
  last_updated: string;
  created_at: string;
}

export interface CreateProgressRequest {
  club_id: string;
  book_id?: string;
  status: 'not_started' | 'reading' | 'finished';
  progress_type?: 'percentage' | 'chapter' | 'page';
  current_progress?: number;
  total_progress?: number;
  progress_percentage?: number;
  notes?: string;
  is_private?: boolean;
}

export interface UpdateProgressRequest {
  status?: 'not_started' | 'reading' | 'finished';
  progress_type?: 'percentage' | 'chapter' | 'page';
  current_progress?: number;
  total_progress?: number;
  progress_percentage?: number;
  notes?: string;
  is_private?: boolean;
}
```

### API Functions

#### 1. Upsert Reading Progress
```typescript
async function upsertReadingProgress(
  userId: string,
  progressData: CreateProgressRequest
): Promise<ReadingProgress>
```

**Validation Rules:**
- User must be club member
- Status must be valid enum value
- Progress percentage (0-100) only for 'reading' status
- Chapter/page numbers must be positive integers
- Notes limited to 500 characters

#### 2. Get User Reading Progress
```typescript
async function getUserReadingProgress(
  requestingUserId: string,
  targetUserId: string,
  clubId: string,
  bookId?: string
): Promise<ReadingProgress | null>
```

**Privacy Logic:**
- Always returns data if requesting own progress
- Returns public progress for other users
- Returns null for private progress of other users

#### 3. Get Club Reading Progress
```typescript
async function getClubReadingProgress(
  requestingUserId: string,
  clubId: string,
  bookId?: string
): Promise<MemberProgressSummary[]>
```

**Response Format:**
```typescript
interface MemberProgressSummary {
  user_id: string;
  status: 'not_started' | 'reading' | 'finished';
  progress_display: string; // "45%" or "Chapter 5/12" or "Page 150/300"
  last_updated: string;
  is_private: boolean;
  user?: {
    username: string;
    displayname: string | null;
    avatar_url: string | null;
  };
}
```

#### 4. Toggle Club Progress Feature
```typescript
async function toggleClubProgressTracking(
  userId: string,
  clubId: string,
  enabled: boolean
): Promise<{ success: boolean }>
```

**Authorization:**
- Only club leads can toggle this feature
- Uses existing `canManageClub` permission check

## UI Component Architecture

### New Components

#### 1. ProgressUpdateModal
**Location:** `src/components/bookclubs/progress/ProgressUpdateModal.tsx`

**Props:**
```typescript
interface ProgressUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  clubId: string;
  currentProgress?: ReadingProgress;
  onProgressUpdated: (progress: ReadingProgress) => void;
}
```

**Features:**
- Status selection (radio buttons)
- Dual input mode: percentage slider OR chapter/page inputs
- Notes textarea with character counter
- Privacy toggle
- Mobile-optimized touch interface

#### 2. ProgressIndicator
**Location:** `src/components/bookclubs/progress/ProgressIndicator.tsx`

**Props:**
```typescript
interface ProgressIndicatorProps {
  status: 'not_started' | 'reading' | 'finished';
  progressDisplay: string;
  isPrivate: boolean;
  size: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
}
```

**Visual Design:**
- Gray circle for 'not_started'
- Blue progress ring for 'reading' with percentage/chapter display
- Green checkmark for 'finished'
- Privacy indicator (lock icon) for private progress

#### 3. ProgressToggleControl
**Location:** `src/components/bookclubs/management/ProgressToggleControl.tsx`

**Props:**
```typescript
interface ProgressToggleControlProps {
  clubId: string;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  canManage: boolean;
}
```

### Component Integration

#### MembersSection Enhancement
**File:** `src/components/bookclubs/sections/MembersSection.tsx`

**Changes:**
- Add progress indicator next to each member name
- Show progress only if feature enabled for club
- Respect privacy settings in display
- Add hover tooltips for detailed progress info

#### CurrentBookSection Enhancement
**File:** `src/components/bookclubs/sections/CurrentBookSection.tsx`

**Changes:**
- Add "Update My Progress" button when current book exists
- Display user's current progress prominently
- Show feature toggle control for club leads
- Integrate with progress update modal

## Privacy Controls Implementation

### Privacy Enforcement Levels

1. **Database Level**: RLS policies prevent unauthorized access
2. **API Level**: Privacy filtering in query responses
3. **UI Level**: Conditional rendering based on privacy settings

### Privacy Rules

- **Private Progress**: Only visible to the user who created it
- **Public Progress**: Visible to all club members
- **No Admin Override**: Club leads/admins cannot view private progress
- **Default Setting**: Progress defaults to public visibility

### Implementation Details

```typescript
// Privacy check function
function canViewProgress(
  progress: ReadingProgress,
  requestingUserId: string
): boolean {
  // User can always view their own progress
  if (progress.user_id === requestingUserId) {
    return true;
  }
  
  // Others can only view public progress
  return !progress.is_private;
}
```

## Feature Toggle System

### Database Implementation
- `progress_tracking_enabled` boolean column in `book_clubs` table
- Defaults to `false` (feature disabled)
- Only club leads can modify this setting

### API Implementation
```typescript
async function isProgressTrackingEnabled(clubId: string): Promise<boolean> {
  const { data } = await supabase
    .from('book_clubs')
    .select('progress_tracking_enabled')
    .eq('id', clubId)
    .single();
  
  return data?.progress_tracking_enabled || false;
}
```

### UI Implementation
- Feature toggle control in club management section
- Conditional rendering of progress-related UI elements
- Clear messaging when feature is disabled

## Real-time Updates

### Supabase Subscription Implementation
```typescript
// Subscribe to progress changes for a specific club
const subscription = supabase
  .channel(`club_progress_${clubId}`)
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'member_reading_progress',
      filter: `club_id=eq.${clubId}`
    },
    (payload) => {
      handleProgressUpdate(payload);
    }
  )
  .subscribe();
```

### Update Propagation
- Progress changes trigger immediate UI updates
- Member list progress indicators update in real-time
- Optimistic updates for better user experience
- Fallback to polling if subscription fails

## Mobile Responsiveness

### Progress Update Modal
- Full-screen modal on devices < 768px width
- Touch-friendly progress slider with larger touch targets
- Simplified layout with stacked form elements
- Keyboard-aware input handling

### Progress Indicators
- Smaller progress rings on mobile (24px vs 32px)
- Touch-optimized tooltips
- Adaptive spacing in member lists
- High-contrast colors for outdoor visibility

### Interaction Patterns
- Tap to open progress update modal
- Swipe gestures for status selection
- Haptic feedback where supported
- Auto-save to prevent data loss

---

*This technical specification provides the complete implementation details for the Current Book Reading Update feature. Refer to the [Implementation Roadmap](./implementation_roadmap.md) for development phases and [Progress Tracking](./progress_tracking.md) for implementation status.*
