/**
 * Moderation Utilities
 * Helper functions for mapping between moderation actions and report resolutions
 */

import type { ResolutionAction, ReportStatus } from '@/types/reporting';
import type { AccountStatus } from '@/lib/api/admin/accountManagement';

/**
 * Maps account status changes to report resolution actions
 */
export function mapAccountStatusToResolution(accountStatus: string): ResolutionAction {
  switch (accountStatus) {
    case 'suspended':
      return 'user_suspended';
    case 'deleted':
      return 'user_banned';
    case 'active':
      return 'no_action';
    default:
      return 'no_action';
  }
}

/**
 * Maps moderation action types to report resolution actions
 */
export function mapModerationActionToResolution(actionType: string): ResolutionAction {
  switch (actionType) {
    case 'user_suspension':
      return 'user_suspended';
    case 'user_ban':
      return 'user_banned';
    case 'warning':
      return 'warning_issued';
    case 'content_removal':
      return 'content_removed';
    case 'escalation':
      return 'escalated_to_higher_authority';
    default:
      return 'no_action';
  }
}

/**
 * Determines the appropriate report status after an action is taken
 */
export function getReportStatusAfterAction(resolutionAction: ResolutionAction): ReportStatus {
  switch (resolutionAction) {
    case 'no_action':
      return 'dismissed';
    case 'escalated_to_higher_authority':
    case 'referred_to_platform':
      return 'escalated';
    default:
      return 'resolved';
  }
}

/**
 * Generates resolution notes based on the action taken
 */
export function generateResolutionNotes(
  actionType: string,
  reason: string,
  moderatorUsername: string
): string {
  const actionDescriptions = {
    'user_suspension': 'User account suspended',
    'user_ban': 'User account deleted/banned',
    'warning': 'Warning issued to user',
    'content_removal': 'Content removed',
    'escalation': 'Report escalated to higher authority',
    'no_action': 'No action required'
  };

  const actionDescription = actionDescriptions[actionType] || 'Action taken';
  
  return `${actionDescription} by ${moderatorUsername}. Reason: ${reason}`;
}

/**
 * Validates if a report can have actions taken on it
 */
export function canTakeActionOnReport(report: any): boolean {
  // Can only take action on pending or under_review reports
  if (!['pending', 'under_review'].includes(report.status)) {
    return false;
  }

  // Must have a target user for user-based actions
  if (!report.target_user_id) {
    return false;
  }

  return true;
}

/**
 * Gets the display name for a resolution action
 */
export function getResolutionActionDisplayName(action: ResolutionAction): string {
  const displayNames = {
    'no_action': 'No Action Taken',
    'warning_issued': 'Warning Issued',
    'content_removed': 'Content Removed',
    'user_suspended': 'User Suspended',
    'user_banned': 'User Banned',
    'escalated_to_higher_authority': 'Escalated to Higher Authority',
    'referred_to_platform': 'Referred to Platform'
  };

  return displayNames[action] || action;
}
