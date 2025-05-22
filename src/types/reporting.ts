// Reporting System Types and Interfaces
// Phase 2: Core Reporting System

export type ReportTargetType = 
  | 'discussion_post' 
  | 'discussion_topic' 
  | 'user_profile' 
  | 'book_club' 
  | 'event' 
  | 'chat_message' 
  | 'user_behavior';

export type ReportReason = 
  | 'spam' 
  | 'harassment' 
  | 'inappropriate_content' 
  | 'hate_speech'
  | 'misinformation' 
  | 'copyright_violation' 
  | 'off_topic' 
  | 'other';

export type ReportSeverity = 'low' | 'medium' | 'high' | 'critical';

export type ReportStatus = 'pending' | 'under_review' | 'resolved' | 'dismissed' | 'escalated';

export type ResolutionAction = 
  | 'no_action' 
  | 'warning_issued' 
  | 'content_removed' 
  | 'user_suspended'
  | 'user_banned' 
  | 'escalated_to_higher_authority' 
  | 'referred_to_platform';

export type ModerationActionType = 
  | 'warning' 
  | 'content_removal' 
  | 'user_suspension' 
  | 'user_ban'
  | 'content_lock' 
  | 'topic_lock' 
  | 'club_restriction' 
  | 'escalation';

export type ModerationTargetType = 
  | 'user' 
  | 'discussion_post' 
  | 'discussion_topic' 
  | 'book_club' 
  | 'event' 
  | 'chat_message';

export type EvidenceType = 'screenshot' | 'link' | 'text_quote' | 'metadata';

// Core Report Interface
export interface Report {
  id: string;
  
  // Reporter information
  reporter_id: string;
  reporter_username: string;
  
  // Target information
  target_type: ReportTargetType;
  target_id: string | null;
  target_user_id: string | null;
  target_username: string | null;
  
  // Report content
  reason: ReportReason;
  description: string;
  severity: ReportSeverity;
  
  // Context
  club_id: string | null;
  store_id: string | null;
  
  // Status and resolution
  status: ReportStatus;
  priority: number; // 1-5, 1 = highest
  resolved_by: string | null;
  resolved_at: string | null;
  resolution_action: ResolutionAction | null;
  resolution_notes: string | null;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

// Report Evidence Interface
export interface ReportEvidence {
  id: string;
  report_id: string;
  evidence_type: EvidenceType;
  evidence_data: Record<string, any>;
  description: string | null;
  created_at: string;
}

// Moderation Action Interface
export interface ModerationAction {
  id: string;
  
  // Action details
  action_type: ModerationActionType;
  target_type: ModerationTargetType;
  target_id: string;
  target_user_id: string | null;
  
  // Moderator information
  moderator_id: string;
  moderator_username: string;
  moderator_role: string;
  
  // Action details
  reason: string;
  severity: ReportSeverity;
  duration_hours: number | null;
  expires_at: string | null;
  
  // Context
  club_id: string | null;
  store_id: string | null;
  related_report_id: string | null;
  
  // Status
  status: 'active' | 'expired' | 'revoked';
  revoked_by: string | null;
  revoked_at: string | null;
  revoked_reason: string | null;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

// User Warning Interface
export interface UserWarning {
  id: string;
  user_id: string;
  issued_by: string;
  
  // Warning details
  reason: string;
  severity: ReportSeverity;
  description: string | null;
  
  // Context
  club_id: string | null;
  store_id: string | null;
  related_report_id: string | null;
  related_action_id: string | null;
  
  // Status
  expires_at: string | null;
  acknowledged_at: string | null;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

// Report Creation Data
export interface CreateReportData {
  target_type: ReportTargetType;
  target_id?: string;
  target_user_id?: string;
  reason: ReportReason;
  description: string;
  club_id?: string;
  evidence?: Omit<ReportEvidence, 'id' | 'report_id' | 'created_at'>[];
}

// Report Update Data
export interface UpdateReportData {
  status?: ReportStatus;
  priority?: number;
  resolution_action?: ResolutionAction;
  resolution_notes?: string;
}

// Moderation Action Creation Data
export interface CreateModerationActionData {
  action_type: ModerationActionType;
  target_type: ModerationTargetType;
  target_id: string;
  target_user_id?: string;
  reason: string;
  severity: ReportSeverity;
  duration_hours?: number;
  club_id?: string;
  related_report_id?: string;
}

// User Warning Creation Data
export interface CreateUserWarningData {
  user_id: string;
  reason: string;
  severity: ReportSeverity;
  description?: string;
  club_id?: string;
  expires_at?: string;
  related_report_id?: string;
}

// Report Statistics
export interface ReportStats {
  total_reports: number;
  pending_reports: number;
  resolved_reports: number;
  dismissed_reports: number;
  escalated_reports: number;
  reports_by_severity: Record<ReportSeverity, number>;
  reports_by_reason: Record<ReportReason, number>;
  average_resolution_time_hours: number;
}

// Moderation Dashboard Data
export interface ModerationDashboardData {
  pending_reports: Report[];
  recent_actions: ModerationAction[];
  user_warnings: UserWarning[];
  stats: ReportStats;
}

// Report Filter Options
export interface ReportFilters {
  status?: ReportStatus[];
  severity?: ReportSeverity[];
  reason?: ReportReason[];
  target_type?: ReportTargetType[];
  club_id?: string;
  store_id?: string;
  reporter_id?: string;
  target_user_id?: string;
  date_from?: string;
  date_to?: string;
  priority_min?: number;
  priority_max?: number;
}

// Pagination Options
export interface PaginationOptions {
  page: number;
  limit: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

// Report Query Result
export interface ReportQueryResult {
  reports: Report[];
  total_count: number;
  page: number;
  limit: number;
  total_pages: number;
}

// Severity Configuration
export interface SeverityConfig {
  reason: ReportReason;
  default_severity: ReportSeverity;
  auto_escalate: boolean;
  requires_immediate_attention: boolean;
}

// Report Context Information
export interface ReportContext {
  target_title?: string;
  target_content?: string;
  target_author?: string;
  club_name?: string;
  store_name?: string;
  additional_metadata?: Record<string, any>;
}
