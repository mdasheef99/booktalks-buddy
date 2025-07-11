/**
 * Progress Mapping Utilities
 * Maps progress between different services and provides enhanced progress tracking
 */

import type { AvatarUploadProgress } from '../types/avatarTypes';

/**
 * Progress stage mapping configuration
 */
interface ProgressStageMap {
  [key: string]: AvatarUploadProgress['stage'];
}

/**
 * Progress mapper for avatar upload operations
 */
export class ProgressMapper {
  /**
   * Default stage mapping from ProfileImageService to AvatarSyncManager
   */
  private static readonly DEFAULT_STAGE_MAP: ProgressStageMap = {
    'processing': 'processing',
    'uploading': 'uploading',
    'updating': 'updating',
    'complete': 'syncing'
  };

  /**
   * Map ProfileImageService progress to enhanced AvatarSyncManager progress
   */
  static mapProfileServiceProgress(
    serviceProgress: { stage: string; progress: number; message: string },
    onProgress?: (progress: AvatarUploadProgress) => void
  ): void {
    const mappedStage = this.DEFAULT_STAGE_MAP[serviceProgress.stage] || 'uploading';
    
    // Reserve 15% of progress for final sync validation
    const adjustedProgress = Math.min(serviceProgress.progress, 85);

    const enhancedProgress: AvatarUploadProgress = {
      stage: mappedStage,
      progress: adjustedProgress,
      message: serviceProgress.message
    };

    onProgress?.(enhancedProgress);
  }

  /**
   * Create progress update for specific stage
   */
  static createProgressUpdate(
    stage: AvatarUploadProgress['stage'],
    progress: number,
    message: string,
    currentFile?: string
  ): AvatarUploadProgress {
    return {
      stage,
      progress: Math.max(0, Math.min(100, progress)), // Clamp between 0-100
      message,
      currentFile
    };
  }

  /**
   * Get progress percentage for each stage
   */
  static getStageProgressRanges(): Record<AvatarUploadProgress['stage'], { min: number; max: number }> {
    return {
      validation: { min: 0, max: 5 },
      processing: { min: 5, max: 25 },
      uploading: { min: 25, max: 70 },
      updating: { min: 70, max: 85 },
      syncing: { min: 85, max: 95 },
      complete: { min: 95, max: 100 }
    };
  }

  /**
   * Calculate progress within a specific stage
   */
  static calculateStageProgress(
    stage: AvatarUploadProgress['stage'],
    stageProgress: number // 0-100 within the stage
  ): number {
    const ranges = this.getStageProgressRanges();
    const range = ranges[stage];
    
    if (!range) {
      return 0;
    }

    const stageSize = range.max - range.min;
    const adjustedProgress = (stageProgress / 100) * stageSize;
    
    return Math.round(range.min + adjustedProgress);
  }

  /**
   * Create a series of progress updates for smooth transitions
   */
  static createProgressSequence(
    startStage: AvatarUploadProgress['stage'],
    endStage: AvatarUploadProgress['stage'],
    steps: number = 5
  ): AvatarUploadProgress[] {
    const ranges = this.getStageProgressRanges();
    const startRange = ranges[startStage];
    const endRange = ranges[endStage];
    
    if (!startRange || !endRange) {
      return [];
    }

    const sequence: AvatarUploadProgress[] = [];
    const totalProgress = endRange.max - startRange.min;
    const stepSize = totalProgress / steps;

    for (let i = 0; i <= steps; i++) {
      const currentProgress = startRange.min + (stepSize * i);
      let currentStage = startStage;
      
      // Determine which stage we're in based on progress
      Object.entries(ranges).forEach(([stage, range]) => {
        if (currentProgress >= range.min && currentProgress <= range.max) {
          currentStage = stage as AvatarUploadProgress['stage'];
        }
      });

      sequence.push({
        stage: currentStage,
        progress: Math.round(currentProgress),
        message: this.getStageMessage(currentStage)
      });
    }

    return sequence;
  }

  /**
   * Get default message for each stage
   */
  static getStageMessage(stage: AvatarUploadProgress['stage']): string {
    const messages = {
      validation: 'Validating image file...',
      processing: 'Processing image...',
      uploading: 'Uploading to storage...',
      updating: 'Updating profile...',
      syncing: 'Validating synchronization...',
      complete: 'Avatar updated successfully!'
    };

    return messages[stage] || 'Processing...';
  }

  /**
   * Check if progress is valid
   */
  static isValidProgress(progress: AvatarUploadProgress): boolean {
    return (
      progress.progress >= 0 &&
      progress.progress <= 100 &&
      progress.message.length > 0 &&
      ['validation', 'processing', 'uploading', 'updating', 'syncing', 'complete'].includes(progress.stage)
    );
  }
}
