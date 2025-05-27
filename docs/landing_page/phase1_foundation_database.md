# Phase 1: Foundation & Database Schema Implementation

## Phase Overview
**Duration**: 10-12 days  
**Priority**: CRITICAL  
**Dependencies**: None  
**Team Size**: 2-3 developers  

## Objectives
- Establish complete database schema for Store Management features
- Implement Store Owner access control system
- Set up image upload infrastructure
- Create basic admin panel navigation structure
- Establish API endpoint foundation

## Database Schema Implementation

### Migration Script 1: Core Store Customization Tables

**File**: `supabase/migrations/20240101_store_management_foundation.sql`

```sql
-- Store Management Foundation Schema
-- Phase 1: Core customization tables

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================
-- Table: store_landing_customization
-- Core settings for landing page customization
-- =========================
CREATE TABLE IF NOT EXISTS store_landing_customization (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE UNIQUE,
    
    -- Hero section customization
    hero_quote TEXT CHECK (char_length(hero_quote) <= 200),
    hero_quote_author TEXT CHECK (char_length(hero_quote_author) <= 100),
    hero_font_style TEXT DEFAULT 'elegant' CHECK (hero_font_style IN ('elegant', 'modern', 'classic', 'bold')),
    
    -- Chat button customization
    chat_button_text TEXT DEFAULT 'Start Chatting Anonymously' CHECK (char_length(chat_button_text) <= 50),
    chat_button_position TEXT DEFAULT 'center' CHECK (chat_button_position IN ('left', 'center', 'right')),
    chat_button_color_scheme TEXT DEFAULT 'terracotta' CHECK (chat_button_color_scheme IN ('terracotta', 'sage', 'brown', 'cream', 'custom')),
    chat_button_size TEXT DEFAULT 'large' CHECK (chat_button_size IN ('small', 'medium', 'large')),
    is_chat_button_enabled BOOLEAN DEFAULT true,
    
    -- Section visibility controls
    sections_enabled JSONB DEFAULT '{
        "carousel": false,
        "hero_quote": false,
        "promotional_banners": false,
        "community_showcase": false,
        "custom_quote": false
    }',
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- =========================
-- Table: store_carousel_items
-- Featured books carousel management
-- =========================
CREATE TABLE IF NOT EXISTS store_carousel_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    
    -- Position and ordering
    position INTEGER NOT NULL CHECK (position BETWEEN 1 AND 6),
    display_order INTEGER DEFAULT 0,
    
    -- Book information
    book_title TEXT NOT NULL CHECK (char_length(book_title) <= 200),
    book_author TEXT NOT NULL CHECK (char_length(book_author) <= 100),
    book_isbn TEXT CHECK (char_length(book_isbn) <= 20),
    
    -- Display customization
    custom_description TEXT CHECK (char_length(custom_description) <= 300),
    featured_badge TEXT CHECK (featured_badge IN ('new_arrival', 'staff_pick', 'bestseller', 'on_sale', 'featured', 'none')),
    overlay_text TEXT CHECK (char_length(overlay_text) <= 100),
    
    -- Image and links
    book_image_url TEXT, -- Supabase Storage URL
    book_image_alt TEXT CHECK (char_length(book_image_alt) <= 200),
    click_destination_url TEXT,
    
    -- Status and metadata
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    -- Constraints
    UNIQUE(store_id, position),
    CONSTRAINT valid_image_url CHECK (book_image_url IS NULL OR book_image_url ~ '^https?://.*')
);

-- =========================
-- Table: store_promotional_banners
-- Marketing banners management
-- =========================
CREATE TABLE IF NOT EXISTS store_promotional_banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    
    -- Banner content
    title TEXT NOT NULL CHECK (char_length(title) <= 100),
    subtitle TEXT CHECK (char_length(subtitle) <= 200),
    content_type TEXT DEFAULT 'text' CHECK (content_type IN ('text', 'image', 'mixed')),
    
    -- Text content
    text_content TEXT CHECK (char_length(text_content) <= 500),
    cta_text TEXT CHECK (char_length(cta_text) <= 50),
    cta_url TEXT,
    
    -- Image content
    banner_image_url TEXT, -- Supabase Storage URL
    banner_image_alt TEXT CHECK (char_length(banner_image_alt) <= 200),
    
    -- Styling and animation
    background_color TEXT DEFAULT '#f3f4f6',
    text_color TEXT DEFAULT '#1f2937',
    animation_type TEXT DEFAULT 'slide-in' CHECK (animation_type IN ('slide-in', 'fade', 'pulse', 'none')),
    animation_duration INTEGER DEFAULT 500 CHECK (animation_duration BETWEEN 100 AND 2000),
    
    -- Scheduling and ordering
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    priority_order INTEGER DEFAULT 0,
    display_duration INTEGER, -- seconds to display before auto-advance
    
    -- Status and metadata
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    -- Constraints
    CONSTRAINT valid_date_range CHECK (end_date IS NULL OR start_date IS NULL OR end_date > start_date),
    CONSTRAINT valid_image_url CHECK (banner_image_url IS NULL OR banner_image_url ~ '^https?://.*'),
    CONSTRAINT valid_cta_url CHECK (cta_url IS NULL OR cta_url ~ '^https?://.*')
);
```

### Migration Script 2: Community Showcase & Analytics Tables

**File**: `supabase/migrations/20240102_community_analytics_tables.sql`

```sql
-- Store Management Community & Analytics Schema
-- Phase 1: Community showcase and analytics tables

-- =========================
-- Table: store_community_showcase
-- Community features and social proof
-- =========================
CREATE TABLE IF NOT EXISTS store_community_showcase (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    
    -- Member spotlight settings
    featured_member_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    spotlight_type TEXT CHECK (spotlight_type IN ('top_reviewer', 'active_member', 'helpful_contributor', 'new_member')),
    spotlight_description TEXT CHECK (char_length(spotlight_description) <= 300),
    spotlight_start_date TIMESTAMPTZ DEFAULT now(),
    spotlight_end_date TIMESTAMPTZ,
    
    -- Display settings
    show_member_spotlights BOOLEAN DEFAULT false,
    show_testimonials BOOLEAN DEFAULT false,
    show_activity_feed BOOLEAN DEFAULT false,
    show_community_metrics BOOLEAN DEFAULT false,
    
    -- Configuration
    max_spotlights_display INTEGER DEFAULT 3 CHECK (max_spotlights_display BETWEEN 1 AND 6),
    spotlight_rotation_days INTEGER DEFAULT 7 CHECK (spotlight_rotation_days BETWEEN 1 AND 30),
    activity_feed_limit INTEGER DEFAULT 5 CHECK (activity_feed_limit BETWEEN 3 AND 10),
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- =========================
-- Table: store_testimonials
-- Customer testimonials and reviews
-- =========================
CREATE TABLE IF NOT EXISTS store_testimonials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    
    -- Testimonial content
    customer_name TEXT CHECK (char_length(customer_name) <= 100),
    testimonial_text TEXT NOT NULL CHECK (char_length(testimonial_text) <= 500),
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    
    -- Source and attribution
    source_type TEXT DEFAULT 'manual' CHECK (source_type IN ('manual', 'review_import', 'survey', 'social_media')),
    source_url TEXT,
    is_anonymous BOOLEAN DEFAULT false,
    
    -- Approval workflow
    approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
    approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    
    -- Display settings
    is_featured BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- =========================
-- Table: store_custom_quotes
-- Custom quotes for quote section
-- =========================
CREATE TABLE IF NOT EXISTS store_custom_quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    
    -- Quote content
    quote_text TEXT NOT NULL CHECK (char_length(quote_text) <= 300),
    quote_author TEXT CHECK (char_length(quote_author) <= 100),
    quote_source TEXT CHECK (char_length(quote_source) <= 200),
    
    -- Categorization
    quote_category TEXT DEFAULT 'general' CHECK (quote_category IN ('general', 'inspirational', 'literary', 'seasonal', 'store_specific')),
    quote_tags TEXT[], -- Array of tags for filtering
    
    -- Display settings
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    rotation_enabled BOOLEAN DEFAULT false,
    
    -- Scheduling
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    -- Constraints
    CONSTRAINT valid_date_range CHECK (end_date IS NULL OR start_date IS NULL OR end_date > start_date)
);

-- =========================
-- Table: store_landing_analytics
-- Analytics tracking for landing page interactions
-- =========================
CREATE TABLE IF NOT EXISTS store_landing_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    
    -- Event tracking
    event_type TEXT NOT NULL CHECK (event_type IN (
        'carousel_click', 'carousel_view', 'banner_click', 'banner_view',
        'chat_button_click', 'hero_view', 'community_interaction',
        'quote_view', 'section_scroll', 'page_load', 'page_exit'
    )),
    
    -- Event details
    section_name TEXT CHECK (section_name IN ('carousel', 'hero', 'banners', 'community', 'events', 'bookclubs', 'quote', 'footer')),
    element_id UUID, -- Reference to specific carousel item, banner, etc.
    element_type TEXT, -- 'book', 'banner', 'button', 'link'
    
    -- User context
    session_id TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_agent TEXT,
    ip_address INET,
    
    -- Interaction details
    interaction_data JSONB, -- Additional context (scroll depth, time spent, etc.)
    page_url TEXT,
    referrer_url TEXT,
    
    -- Timing
    timestamp TIMESTAMPTZ DEFAULT now(),
    
    -- Constraints
    CONSTRAINT valid_element_reference CHECK (
        (element_id IS NULL) OR 
        (element_type IS NOT NULL AND section_name IS NOT NULL)
    )
);
```

### Migration Script 3: RLS Policies and Indexes

**File**: `supabase/migrations/20240103_rls_policies_indexes.sql`

```sql
-- Store Management RLS Policies and Performance Indexes
-- Phase 1: Security and performance optimization

-- =========================
-- Enable RLS on all new tables
-- =========================
ALTER TABLE store_landing_customization ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_carousel_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_promotional_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_community_showcase ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_custom_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_landing_analytics ENABLE ROW LEVEL SECURITY;

-- =========================
-- RLS Policies for Store Owner Management
-- =========================

-- Store Landing Customization Policies
CREATE POLICY "Store owners can manage their landing customization"
ON store_landing_customization
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM store_administrators sa
        WHERE sa.store_id = store_landing_customization.store_id
        AND sa.user_id = auth.uid()
        AND sa.role = 'owner'
    )
);

CREATE POLICY "Anyone can view store landing customization"
ON store_landing_customization
FOR SELECT
TO anon, authenticated
USING (true);

-- Carousel Items Policies
CREATE POLICY "Store owners can manage their carousel items"
ON store_carousel_items
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM store_administrators sa
        WHERE sa.store_id = store_carousel_items.store_id
        AND sa.user_id = auth.uid()
        AND sa.role = 'owner'
    )
);

CREATE POLICY "Anyone can view active carousel items"
ON store_carousel_items
FOR SELECT
TO anon, authenticated
USING (is_active = true);

-- Promotional Banners Policies
CREATE POLICY "Store owners can manage their promotional banners"
ON store_promotional_banners
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM store_administrators sa
        WHERE sa.store_id = store_promotional_banners.store_id
        AND sa.user_id = auth.uid()
        AND sa.role = 'owner'
    )
);

CREATE POLICY "Anyone can view active promotional banners"
ON store_promotional_banners
FOR SELECT
TO anon, authenticated
USING (
    is_active = true 
    AND (start_date IS NULL OR start_date <= now())
    AND (end_date IS NULL OR end_date > now())
);

-- Community Showcase Policies
CREATE POLICY "Store owners can manage their community showcase"
ON store_community_showcase
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM store_administrators sa
        WHERE sa.store_id = store_community_showcase.store_id
        AND sa.user_id = auth.uid()
        AND sa.role = 'owner'
    )
);

CREATE POLICY "Anyone can view community showcase"
ON store_community_showcase
FOR SELECT
TO anon, authenticated
USING (true);

-- Testimonials Policies
CREATE POLICY "Store owners can manage their testimonials"
ON store_testimonials
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM store_administrators sa
        WHERE sa.store_id = store_testimonials.store_id
        AND sa.user_id = auth.uid()
        AND sa.role = 'owner'
    )
);

CREATE POLICY "Anyone can view approved testimonials"
ON store_testimonials
FOR SELECT
TO anon, authenticated
USING (approval_status = 'approved');

-- Custom Quotes Policies
CREATE POLICY "Store owners can manage their custom quotes"
ON store_custom_quotes
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM store_administrators sa
        WHERE sa.store_id = store_custom_quotes.store_id
        AND sa.user_id = auth.uid()
        AND sa.role = 'owner'
    )
);

CREATE POLICY "Anyone can view active custom quotes"
ON store_custom_quotes
FOR SELECT
TO anon, authenticated
USING (
    is_active = true
    AND (start_date IS NULL OR start_date <= now())
    AND (end_date IS NULL OR end_date > now())
);

-- Analytics Policies
CREATE POLICY "Store owners can view their analytics"
ON store_landing_analytics
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM store_administrators sa
        WHERE sa.store_id = store_landing_analytics.store_id
        AND sa.user_id = auth.uid()
        AND sa.role = 'owner'
    )
);

CREATE POLICY "System can insert analytics data"
ON store_landing_analytics
FOR INSERT
TO authenticated, anon
WITH CHECK (true);

-- =========================
-- Performance Indexes
-- =========================

-- Store Landing Customization Indexes
CREATE INDEX idx_store_landing_customization_store_id ON store_landing_customization(store_id);

-- Carousel Items Indexes
CREATE INDEX idx_store_carousel_items_store_id ON store_carousel_items(store_id);
CREATE INDEX idx_store_carousel_items_active ON store_carousel_items(store_id, is_active, position);
CREATE INDEX idx_store_carousel_items_position ON store_carousel_items(store_id, position) WHERE is_active = true;

-- Promotional Banners Indexes
CREATE INDEX idx_store_promotional_banners_store_id ON store_promotional_banners(store_id);
CREATE INDEX idx_store_promotional_banners_active ON store_promotional_banners(store_id, is_active, priority_order);
CREATE INDEX idx_store_promotional_banners_schedule ON store_promotional_banners(start_date, end_date) WHERE is_active = true;

-- Community Showcase Indexes
CREATE INDEX idx_store_community_showcase_store_id ON store_community_showcase(store_id);
CREATE INDEX idx_store_community_showcase_member ON store_community_showcase(featured_member_id, spotlight_end_date);

-- Testimonials Indexes
CREATE INDEX idx_store_testimonials_store_id ON store_testimonials(store_id);
CREATE INDEX idx_store_testimonials_approved ON store_testimonials(store_id, approval_status, display_order);
CREATE INDEX idx_store_testimonials_featured ON store_testimonials(store_id, is_featured, display_order);

-- Custom Quotes Indexes
CREATE INDEX idx_store_custom_quotes_store_id ON store_custom_quotes(store_id);
CREATE INDEX idx_store_custom_quotes_active ON store_custom_quotes(store_id, is_active, display_order);
CREATE INDEX idx_store_custom_quotes_schedule ON store_custom_quotes(start_date, end_date) WHERE is_active = true;

-- Analytics Indexes
CREATE INDEX idx_store_landing_analytics_store_id ON store_landing_analytics(store_id);
CREATE INDEX idx_store_landing_analytics_event ON store_landing_analytics(store_id, event_type, timestamp);
CREATE INDEX idx_store_landing_analytics_session ON store_landing_analytics(session_id, timestamp);
CREATE INDEX idx_store_landing_analytics_element ON store_landing_analytics(element_id, element_type);

-- =========================
-- Triggers for updated_at timestamps
-- =========================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables with updated_at
CREATE TRIGGER update_store_landing_customization_updated_at
    BEFORE UPDATE ON store_landing_customization
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_store_carousel_items_updated_at
    BEFORE UPDATE ON store_carousel_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_store_promotional_banners_updated_at
    BEFORE UPDATE ON store_promotional_banners
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_store_community_showcase_updated_at
    BEFORE UPDATE ON store_community_showcase
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_store_testimonials_updated_at
    BEFORE UPDATE ON store_testimonials
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_store_custom_quotes_updated_at
    BEFORE UPDATE ON store_custom_quotes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## Implementation Tasks

### Task 1: Database Migration Execution
**Estimated Time**: 2 days  
**Assignee**: Database Administrator + Backend Developer  

**Steps**:
1. Review migration scripts for syntax and logic errors
2. Test migrations on development database
3. Execute migrations in staging environment
4. Validate all tables, indexes, and policies are created correctly
5. Test RLS policies with different user roles
6. Execute migrations in production environment
7. Document rollback procedures

**Validation Criteria**:
- All 7 new tables created successfully
- All RLS policies active and functioning
- All indexes created for performance optimization
- Store Owner can access only their store's data
- Public users can read appropriate data

### Task 2: Store Owner Route Guard Implementation
**Estimated Time**: 3 days  
**Assignee**: Frontend Developer  

**Files to Create**:
- `src/components/routeguards/StoreOwnerRouteGuard.tsx`
- `src/lib/entitlements/storeOwnerHooks.ts`

**Implementation Requirements**:
- Extend existing entitlement system for Store Owner validation
- Create route guard component for Store Management pages
- Implement store ID validation and context
- Add loading states and error handling
- Integrate with existing admin authentication flow

### Task 3: Admin Panel Navigation Structure
**Estimated Time**: 2 days  
**Assignee**: Frontend Developer  

**Files to Modify**:
- `src/components/layouts/AdminLayout.tsx`
- `src/App.tsx` (routing)

**Implementation Requirements**:
- Add "Store Management" section to admin navigation
- Create nested route structure for Store Management features
- Implement conditional navigation based on Store Owner role
- Add icons and styling consistent with existing admin panel
- Ensure mobile responsiveness

### Task 4: Image Upload Infrastructure
**Estimated Time**: 3 days  
**Assignee**: Backend Developer + Frontend Developer  

**Implementation Requirements**:
- Set up Supabase Storage buckets for store images
- Implement image upload API with validation
- Add image optimization pipeline (WebP conversion, resizing)
- Create reusable image upload component
- Implement progress tracking and error handling
- Add file type and size validation

**Storage Buckets to Create**:
- `store-carousel-images` (for book covers)
- `store-banner-images` (for promotional banners)
- `store-community-images` (for member spotlights)

## Success Criteria

### Database Schema Validation
- [ ] All migration scripts execute without errors
- [ ] RLS policies prevent unauthorized access
- [ ] Indexes improve query performance by >50%
- [ ] All foreign key relationships work correctly
- [ ] Triggers update timestamps automatically

### Access Control Validation
- [ ] Store Owners can only access their store's data
- [ ] Non-Store Owners cannot access Store Management features
- [ ] Public users can read appropriate landing page data
- [ ] Admin panel shows Store Management section only to Store Owners

### Infrastructure Validation
- [ ] Image uploads work with proper validation
- [ ] Image optimization reduces file sizes by >60%
- [ ] Upload progress tracking functions correctly
- [ ] Error handling provides clear user feedback

## Risk Mitigation

### Database Migration Risks
**Risk**: Migration failure in production  
**Mitigation**: Comprehensive testing in staging, rollback scripts prepared

### Performance Risks
**Risk**: New tables slow down existing queries  
**Mitigation**: Proper indexing strategy, query performance monitoring

### Security Risks
**Risk**: Unauthorized access to Store Management features  
**Mitigation**: Multiple layers of authorization, comprehensive RLS testing

## Next Phase Preparation

### Phase 2 Prerequisites
- All database tables and policies functional
- Store Owner authentication working
- Image upload infrastructure operational
- Admin panel navigation structure complete

### Handoff Documentation
- Database schema documentation with relationships
- API endpoint specifications for Store Management
- Store Owner access control implementation guide
- Image upload usage documentation
