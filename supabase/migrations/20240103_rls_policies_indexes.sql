-- Store Management RLS Policies and Performance Indexes
-- Phase 1: Security and performance optimization
-- Migration: 20240103_rls_policies_indexes.sql

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
