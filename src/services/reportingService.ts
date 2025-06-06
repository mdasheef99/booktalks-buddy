// Core Reporting Service
// Phase 2: Core Reporting System Implementation

import { supabase } from '@/lib/supabase';
import { getUserProfile } from './profileService';
import type {
  Report,
  CreateReportData,
  UpdateReportData,
  ReportFilters,
  PaginationOptions,
  ReportQueryResult,
  ReportStats,
  ReportSeverity,
  ReportReason,
  ReportTargetType,
  ReportContext
} from '@/types/reporting';

// Severity calculation based on reason and context
const SEVERITY_MAPPING: Record<ReportReason, ReportSeverity> = {
  'hate_speech': 'critical',
  'harassment': 'high',
  'inappropriate_content': 'medium',
  'spam': 'low',
  'misinformation': 'medium',
  'copyright_violation': 'medium',
  'off_topic': 'low',
  'other': 'low'
};

// Priority calculation (1 = highest, 5 = lowest)
const PRIORITY_MAPPING: Record<ReportSeverity, number> = {
  'critical': 1,
  'high': 2,
  'medium': 3,
  'low': 4
};

/**
 * Calculate severity based on reason and context
 */
function calculateSeverity(reason: ReportReason, context?: ReportContext): ReportSeverity {
  let baseSeverity = SEVERITY_MAPPING[reason];
  
  // Escalate severity based on context
  if (context?.additional_metadata?.repeat_offender) {
    baseSeverity = escalateSeverity(baseSeverity);
  }
  
  if (context?.additional_metadata?.multiple_reports) {
    baseSeverity = escalateSeverity(baseSeverity);
  }
  
  return baseSeverity;
}

/**
 * Escalate severity by one level
 */
function escalateSeverity(severity: ReportSeverity): ReportSeverity {
  const escalationMap: Record<ReportSeverity, ReportSeverity> = {
    'low': 'medium',
    'medium': 'high',
    'high': 'critical',
    'critical': 'critical' // Already at max
  };
  return escalationMap[severity];
}

/**
 * Create a new report
 */
export async function createReport(
  reporterUserId: string,
  reportData: CreateReportData,
  context?: ReportContext
): Promise<Report | null> {
  try {
    // Get reporter profile for username
    const reporterProfile = await getUserProfile(reporterUserId);
    if (!reporterProfile?.username) {
      throw new Error('Reporter must have a valid username');
    }

    // Get target user profile if reporting a user
    let targetUsername: string | null = null;
    if (reportData.target_user_id) {
      const targetProfile = await getUserProfile(reportData.target_user_id);
      targetUsername = targetProfile?.username || null;
    }

    // Calculate severity and priority
    const severity = calculateSeverity(reportData.reason, context);
    const priority = PRIORITY_MAPPING[severity];

    // Create the report
    const { data, error } = await supabase
      .from('reports')
      .insert([{
        reporter_id: reporterUserId,
        reporter_username: reporterProfile.username,
        target_type: reportData.target_type,
        target_id: reportData.target_id || null,
        target_user_id: reportData.target_user_id || null,
        target_username: targetUsername,
        reason: reportData.reason,
        description: reportData.description,
        severity,
        priority,
        club_id: reportData.club_id || null,
        store_id: context?.additional_metadata?.store_id || null
      }])
      .select()
      .single();

    if (error) throw error;

    // Add evidence if provided
    if (reportData.evidence && reportData.evidence.length > 0) {
      const evidenceData = reportData.evidence.map(evidence => ({
        report_id: data.id,
        evidence_type: evidence.evidence_type,
        evidence_data: evidence.evidence_data,
        description: evidence.description
      }));

      await supabase
        .from('report_evidence')
        .insert(evidenceData);
    }

    return data as Report;
  } catch (error) {
    console.error('Error creating report:', error);
    return null;
  }
}

/**
 * Get reports with filtering and pagination
 */
export async function getReports(
  filters: ReportFilters = {},
  pagination: PaginationOptions = { page: 1, limit: 20 }
): Promise<ReportQueryResult> {
  try {
    let query = supabase
      .from('reports')
      .select('*', { count: 'exact' });

    // Apply filters
    if (filters.status && filters.status.length > 0) {
      query = query.in('status', filters.status);
    }

    if (filters.severity && filters.severity.length > 0) {
      query = query.in('severity', filters.severity);
    }

    if (filters.reason && filters.reason.length > 0) {
      query = query.in('reason', filters.reason);
    }

    if (filters.target_type && filters.target_type.length > 0) {
      query = query.in('target_type', filters.target_type);
    }

    if (filters.club_id) {
      query = query.eq('club_id', filters.club_id);
    }

    if (filters.store_id) {
      query = query.eq('store_id', filters.store_id);
    }

    if (filters.reporter_id) {
      query = query.eq('reporter_id', filters.reporter_id);
    }

    if (filters.target_user_id) {
      query = query.eq('target_user_id', filters.target_user_id);
    }

    if (filters.date_from) {
      query = query.gte('created_at', filters.date_from);
    }

    if (filters.date_to) {
      query = query.lte('created_at', filters.date_to);
    }

    if (filters.priority_min) {
      query = query.gte('priority', filters.priority_min);
    }

    if (filters.priority_max) {
      query = query.lte('priority', filters.priority_max);
    }

    // Apply sorting
    const sortBy = pagination.sort_by || 'created_at';
    const sortOrder = pagination.sort_order || 'desc';
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    const offset = (pagination.page - 1) * pagination.limit;
    query = query.range(offset, offset + pagination.limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      reports: data as Report[],
      total_count: count || 0,
      page: pagination.page,
      limit: pagination.limit,
      total_pages: Math.ceil((count || 0) / pagination.limit)
    };
  } catch (error) {
    console.error('Error fetching reports:', error);
    return {
      reports: [],
      total_count: 0,
      page: pagination.page,
      limit: pagination.limit,
      total_pages: 0
    };
  }
}

/**
 * Get a single report by ID
 */
export async function getReport(reportId: string): Promise<Report | null> {
  try {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .single();

    if (error) throw error;
    return data as Report;
  } catch (error) {
    console.error('Error fetching report:', error);
    return null;
  }
}

/**
 * Update a report
 */
export async function updateReport(
  reportId: string,
  updates: UpdateReportData,
  moderatorUserId: string
): Promise<Report | null> {
  try {
    // Get moderator profile for audit trail
    const moderatorProfile = await getUserProfile(moderatorUserId);
    if (!moderatorProfile?.username) {
      throw new Error('Moderator must have a valid username');
    }

    const updateData: any = { ...updates };

    // If resolving the report, set resolution timestamp and moderator
    if (updates.status === 'resolved' || updates.status === 'dismissed') {
      updateData.resolved_by = moderatorUserId;
      updateData.resolved_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('reports')
      .update(updateData)
      .eq('id', reportId)
      .select()
      .single();

    if (error) throw error;
    return data as Report;
  } catch (error) {
    console.error('Error updating report:', error);
    return null;
  }
}

/**
 * Get report statistics
 */
export async function getReportStats(
  filters: Omit<ReportFilters, 'status'> = {}
): Promise<ReportStats> {
  try {
    // Base query for filtering
    let baseQuery = supabase.from('reports').select('*');

    // Apply filters (excluding status since we need all statuses for stats)
    if (filters.club_id) baseQuery = baseQuery.eq('club_id', filters.club_id);
    if (filters.store_id) baseQuery = baseQuery.eq('store_id', filters.store_id);
    if (filters.date_from) baseQuery = baseQuery.gte('created_at', filters.date_from);
    if (filters.date_to) baseQuery = baseQuery.lte('created_at', filters.date_to);

    const { data: reports, error } = await baseQuery;

    if (error) throw error;

    const stats: ReportStats = {
      total_reports: reports.length,
      pending_reports: reports.filter(r => r.status === 'pending').length,
      resolved_reports: reports.filter(r => r.status === 'resolved').length,
      dismissed_reports: reports.filter(r => r.status === 'dismissed').length,
      escalated_reports: reports.filter(r => r.status === 'escalated').length,
      reports_by_severity: {
        low: reports.filter(r => r.severity === 'low').length,
        medium: reports.filter(r => r.severity === 'medium').length,
        high: reports.filter(r => r.severity === 'high').length,
        critical: reports.filter(r => r.severity === 'critical').length
      },
      reports_by_reason: {
        spam: reports.filter(r => r.reason === 'spam').length,
        harassment: reports.filter(r => r.reason === 'harassment').length,
        inappropriate_content: reports.filter(r => r.reason === 'inappropriate_content').length,
        hate_speech: reports.filter(r => r.reason === 'hate_speech').length,
        misinformation: reports.filter(r => r.reason === 'misinformation').length,
        copyright_violation: reports.filter(r => r.reason === 'copyright_violation').length,
        off_topic: reports.filter(r => r.reason === 'off_topic').length,
        other: reports.filter(r => r.reason === 'other').length
      },
      average_resolution_time_hours: calculateAverageResolutionTime(reports)
    };

    return stats;
  } catch (error) {
    console.error('Error fetching report stats:', error);
    return {
      total_reports: 0,
      pending_reports: 0,
      resolved_reports: 0,
      dismissed_reports: 0,
      escalated_reports: 0,
      reports_by_severity: { low: 0, medium: 0, high: 0, critical: 0 },
      reports_by_reason: {
        spam: 0, harassment: 0, inappropriate_content: 0, hate_speech: 0,
        misinformation: 0, copyright_violation: 0, off_topic: 0, other: 0
      },
      average_resolution_time_hours: 0
    };
  }
}

/**
 * Calculate average resolution time in hours
 */
function calculateAverageResolutionTime(reports: any[]): number {
  const resolvedReports = reports.filter(r => 
    (r.status === 'resolved' || r.status === 'dismissed') && 
    r.resolved_at && 
    r.created_at
  );

  if (resolvedReports.length === 0) return 0;

  const totalHours = resolvedReports.reduce((sum, report) => {
    const created = new Date(report.created_at);
    const resolved = new Date(report.resolved_at);
    const diffHours = (resolved.getTime() - created.getTime()) / (1000 * 60 * 60);
    return sum + diffHours;
  }, 0);

  return Math.round(totalHours / resolvedReports.length * 100) / 100;
}
