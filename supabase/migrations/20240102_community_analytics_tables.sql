-- Store Management Community & Analytics Schema
-- Phase 1: Community showcase and analytics tables
-- Migration: 20240102_community_analytics_tables.sql

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

-- =========================
-- Comments for documentation
-- =========================
COMMENT ON TABLE store_community_showcase IS 'Community showcase settings and member spotlight management';
COMMENT ON TABLE store_testimonials IS 'Customer testimonials with approval workflow';
COMMENT ON TABLE store_custom_quotes IS 'Custom quotes for quote section with rotation support';
COMMENT ON TABLE store_landing_analytics IS 'Analytics tracking for all landing page interactions';

COMMENT ON COLUMN store_community_showcase.spotlight_type IS 'Type of member spotlight (top_reviewer, active_member, etc.)';
COMMENT ON COLUMN store_testimonials.approval_status IS 'Workflow status: pending, approved, rejected';
COMMENT ON COLUMN store_custom_quotes.quote_tags IS 'Array of tags for quote organization and filtering';
COMMENT ON COLUMN store_landing_analytics.interaction_data IS 'JSONB object with additional interaction context';
