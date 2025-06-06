-- Reporting System Implementation - Phase 2
-- Generated on 2025-01-25
-- Implements core reporting infrastructure with severity-based categorization

-- Enable pgcrypto for UUID generation if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================
-- REPORTS TABLE
-- =========================

-- Main reports table for all content and user behavior reports
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Reporter information
    reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reporter_username TEXT NOT NULL, -- Denormalized for audit trail
    
    -- Report target information
    target_type TEXT NOT NULL CHECK (target_type IN (
        'discussion_post', 'discussion_topic', 'user_profile', 
        'book_club', 'event', 'chat_message', 'user_behavior'
    )),
    target_id UUID, -- NULL for user_behavior reports
    target_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- User being reported
    target_username TEXT, -- Denormalized for audit trail
    
    -- Report content
    reason TEXT NOT NULL CHECK (reason IN (
        'spam', 'harassment', 'inappropriate_content', 'hate_speech',
        'misinformation', 'copyright_violation', 'off_topic', 'other'
    )),
    description TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    
    -- Context information
    club_id UUID REFERENCES book_clubs(id) ON DELETE CASCADE,
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    
    -- Report status and resolution
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending', 'under_review', 'resolved', 'dismissed', 'escalated'
    )),
    priority INTEGER DEFAULT 3 CHECK (priority BETWEEN 1 AND 5), -- 1=highest, 5=lowest
    
    -- Resolution information
    resolved_by UUID REFERENCES auth.users(id),
    resolved_at TIMESTAMPTZ,
    resolution_action TEXT CHECK (resolution_action IN (
        'no_action', 'warning_issued', 'content_removed', 'user_suspended',
        'user_banned', 'escalated_to_higher_authority', 'referred_to_platform'
    )),
    resolution_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    -- Constraints
    CONSTRAINT valid_target_info CHECK (
        (target_type = 'user_behavior' AND target_id IS NULL) OR
        (target_type != 'user_behavior' AND target_id IS NOT NULL)
    ),
    CONSTRAINT valid_resolution CHECK (
        (status IN ('resolved', 'dismissed') AND resolved_by IS NOT NULL AND resolved_at IS NOT NULL) OR
        (status NOT IN ('resolved', 'dismissed'))
    )
);

-- =========================
-- REPORT EVIDENCE TABLE
-- =========================

-- Store evidence/attachments for reports (screenshots, links, etc.)
CREATE TABLE IF NOT EXISTS report_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    evidence_type TEXT NOT NULL CHECK (evidence_type IN (
        'screenshot', 'link', 'text_quote', 'metadata'
    )),
    evidence_data JSONB NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- =========================
-- MODERATION ACTIONS TABLE
-- =========================

-- Track all moderation actions taken (extends existing soft delete pattern)
CREATE TABLE IF NOT EXISTS moderation_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Action details
    action_type TEXT NOT NULL CHECK (action_type IN (
        'warning', 'content_removal', 'user_suspension', 'user_ban',
        'content_lock', 'topic_lock', 'club_restriction', 'escalation'
    )),
    
    -- Target information
    target_type TEXT NOT NULL CHECK (target_type IN (
        'user', 'discussion_post', 'discussion_topic', 'book_club', 'event', 'chat_message'
    )),
    target_id UUID NOT NULL,
    target_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Moderator information
    moderator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    moderator_username TEXT NOT NULL, -- Denormalized for audit trail
    moderator_role TEXT NOT NULL, -- Role at time of action
    
    -- Action details
    reason TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    duration_hours INTEGER, -- For temporary actions (suspensions, locks)
    expires_at TIMESTAMPTZ, -- Calculated expiration time
    
    -- Context
    club_id UUID REFERENCES book_clubs(id) ON DELETE CASCADE,
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    related_report_id UUID REFERENCES reports(id),
    
    -- Status
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked')),
    revoked_by UUID REFERENCES auth.users(id),
    revoked_at TIMESTAMPTZ,
    revoked_reason TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- =========================
-- USER WARNINGS TABLE
-- =========================

-- Track warnings issued to users
CREATE TABLE IF NOT EXISTS user_warnings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    issued_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Warning details
    reason TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    description TEXT,
    
    -- Context
    club_id UUID REFERENCES book_clubs(id) ON DELETE CASCADE,
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    related_report_id UUID REFERENCES reports(id),
    related_action_id UUID REFERENCES moderation_actions(id),
    
    -- Expiration
    expires_at TIMESTAMPTZ,
    acknowledged_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- =========================
-- INDEXES FOR PERFORMANCE
-- =========================

-- Reports table indexes
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_severity ON reports(severity);
CREATE INDEX IF NOT EXISTS idx_reports_priority ON reports(priority);
CREATE INDEX IF NOT EXISTS idx_reports_target_type ON reports(target_type);
CREATE INDEX IF NOT EXISTS idx_reports_target_user ON reports(target_user_id);
CREATE INDEX IF NOT EXISTS idx_reports_reporter ON reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_club ON reports(club_id);
CREATE INDEX IF NOT EXISTS idx_reports_store ON reports(store_id);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_reports_status_priority ON reports(status, priority);
CREATE INDEX IF NOT EXISTS idx_reports_club_status ON reports(club_id, status);
CREATE INDEX IF NOT EXISTS idx_reports_store_status ON reports(store_id, status);

-- Moderation actions indexes
CREATE INDEX IF NOT EXISTS idx_moderation_actions_target ON moderation_actions(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_moderation_actions_target_user ON moderation_actions(target_user_id);
CREATE INDEX IF NOT EXISTS idx_moderation_actions_moderator ON moderation_actions(moderator_id);
CREATE INDEX IF NOT EXISTS idx_moderation_actions_status ON moderation_actions(status);
CREATE INDEX IF NOT EXISTS idx_moderation_actions_expires_at ON moderation_actions(expires_at);
CREATE INDEX IF NOT EXISTS idx_moderation_actions_club ON moderation_actions(club_id);
CREATE INDEX IF NOT EXISTS idx_moderation_actions_store ON moderation_actions(store_id);

-- User warnings indexes
CREATE INDEX IF NOT EXISTS idx_user_warnings_user ON user_warnings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_warnings_issued_by ON user_warnings(issued_by);
CREATE INDEX IF NOT EXISTS idx_user_warnings_expires_at ON user_warnings(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_warnings_club ON user_warnings(club_id);
CREATE INDEX IF NOT EXISTS idx_user_warnings_store ON user_warnings(store_id);

-- =========================
-- TRIGGERS FOR AUTOMATION
-- =========================

-- Update timestamps trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_moderation_actions_updated_at BEFORE UPDATE ON moderation_actions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_warnings_updated_at BEFORE UPDATE ON user_warnings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =========================
-- COMMENTS AND DOCUMENTATION
-- =========================

COMMENT ON TABLE reports IS 'Core reporting system for content and user behavior reports';
COMMENT ON TABLE report_evidence IS 'Evidence and attachments for reports';
COMMENT ON TABLE moderation_actions IS 'Audit trail of all moderation actions taken';
COMMENT ON TABLE user_warnings IS 'Warnings issued to users with expiration tracking';

COMMENT ON COLUMN reports.priority IS '1=highest priority, 5=lowest priority';
COMMENT ON COLUMN reports.severity IS 'System-calculated severity based on reason and context';
COMMENT ON COLUMN moderation_actions.duration_hours IS 'Duration for temporary actions like suspensions';
COMMENT ON COLUMN user_warnings.expires_at IS 'When the warning expires (NULL for permanent warnings)';

-- =========================
-- INITIAL DATA
-- =========================

-- Insert default severity mappings (can be customized per store)
-- This will be handled by the application layer for flexibility
