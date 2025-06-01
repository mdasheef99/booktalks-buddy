/**
 * Reading Progress Management - Type Definitions
 * 
 * This module contains all TypeScript interfaces and types
 * for the reading progress tracking system.
 */

// =========================
// Core Data Types
// =========================

/**
 * Complete reading progress record interface
 */
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

// =========================
// API Request Types
// =========================

/**
 * Input interface for creating progress
 */
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

/**
 * Input interface for updating progress
 */
export interface UpdateProgressRequest {
  status?: 'not_started' | 'reading' | 'finished';
  progress_type?: 'percentage' | 'chapter' | 'page';
  current_progress?: number;
  total_progress?: number;
  progress_percentage?: number;
  notes?: string;
  is_private?: boolean;
}

// =========================
// API Response Types
// =========================

/**
 * Statistics interface for club completion data
 */
export interface ClubProgressStats {
  total_members: number;
  not_started_count: number;
  reading_count: number;
  finished_count: number;
  completion_percentage: number;
}

/**
 * Formatted progress display interface
 */
export interface MemberProgressSummary {
  user_id: string;
  status: 'not_started' | 'reading' | 'finished';
  progress_display: string;
  last_updated: string;
  is_private: boolean;
  user?: {
    username: string;
    displayname: string | null;
    avatar_url: string | null;
  };
}

// =========================
// Utility Types
// =========================

/**
 * Progress status type union
 */
export type ProgressStatus = 'not_started' | 'reading' | 'finished';

/**
 * Progress tracking type union
 */
export type ProgressType = 'percentage' | 'chapter' | 'page';

/**
 * Feature toggle response type
 */
export interface FeatureToggleResponse {
  success: boolean;
}
