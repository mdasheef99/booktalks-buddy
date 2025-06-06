-- Store Management Database Verification and Setup
-- Run this in Supabase SQL Editor to verify and create missing tables

-- =========================
-- Check if required tables exist
-- =========================

-- Check store_landing_customization table
SELECT 
    'store_landing_customization' as table_name,
    EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'store_landing_customization'
    ) as exists;

-- Check stores table (dependency)
SELECT 
    'stores' as table_name,
    EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'stores'
    ) as exists;

-- Check other store management tables
SELECT 
    'store_carousel_items' as table_name,
    EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'store_carousel_items'
    ) as exists;

-- =========================
-- Create store_landing_customization table if it doesn't exist
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
    sections_enabled JSONB DEFAULT '{"hero_quote": false}',
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- =========================
-- Enable RLS on the table
-- =========================

ALTER TABLE store_landing_customization ENABLE ROW LEVEL SECURITY;

-- =========================
-- Create RLS policies
-- =========================

-- Store owners can manage their landing customization
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

-- =========================
-- Create indexes for performance
-- =========================

CREATE INDEX IF NOT EXISTS idx_store_landing_customization_store_id 
ON store_landing_customization(store_id);

-- =========================
-- Verification queries
-- =========================

-- Verify table was created
SELECT 
    'store_landing_customization created' as check_name,
    EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'store_landing_customization'
    ) as success;

-- Verify columns exist
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'store_landing_customization' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verify RLS is enabled
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'store_landing_customization';

-- Verify policies exist
SELECT 
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'store_landing_customization';

-- =========================
-- Test basic operations (optional)
-- =========================

-- Test that the table is accessible (this will return empty result if successful)
SELECT COUNT(*) as record_count FROM store_landing_customization;

-- =========================
-- Summary
-- =========================

SELECT '=== STORE LANDING CUSTOMIZATION TABLE SETUP COMPLETE ===' as summary;
SELECT 'Table created with RLS policies and indexes' as status;
SELECT 'Hero customization should now work properly' as next_step;
