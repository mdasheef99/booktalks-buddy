-- Store Management Foundation Schema
-- Phase 1: Core customization tables
-- Migration: 20240101_store_management_foundation.sql

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

-- =========================
-- Comments for documentation
-- =========================
COMMENT ON TABLE store_landing_customization IS 'Core landing page customization settings for Store Owners';
COMMENT ON TABLE store_carousel_items IS 'Featured books carousel items (max 6 per store)';
COMMENT ON TABLE store_promotional_banners IS 'Promotional banners with scheduling and animation support';

COMMENT ON COLUMN store_landing_customization.sections_enabled IS 'JSONB object tracking which sections are enabled/visible';
COMMENT ON COLUMN store_carousel_items.position IS 'Fixed position 1-6 in carousel display order';
COMMENT ON COLUMN store_promotional_banners.animation_type IS 'CSS animation type for banner display';
