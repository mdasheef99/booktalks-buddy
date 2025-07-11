/**
 * Avatar File Validation
 * Validates uploaded files for avatar operations
 */

import { AvatarErrorType, DEFAULT_FILE_VALIDATION, type FileValidationConfig } from '../types/avatarTypes';
import { AvatarSyncError } from '../errors/AvatarSyncError';

/**
 * File validator for avatar uploads
 */
export class AvatarFileValidator {
  private static config: FileValidationConfig = DEFAULT_FILE_VALIDATION;

  /**
   * Update validation configuration
   */
  static updateConfig(newConfig: Partial<FileValidationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current validation configuration
   */
  static getConfig(): FileValidationConfig {
    return { ...this.config };
  }

  /**
   * Validate uploaded file for avatar operations
   */
  static validateFile(file: File): void {
    this.validateFileType(file);
    this.validateFileSize(file);
  }

  /**
   * Validate file type
   */
  private static validateFileType(file: File): void {
    if (!this.config.validTypes.includes(file.type)) {
      throw new AvatarSyncError(
        AvatarErrorType.INVALID_FILE,
        `Invalid file type: ${file.type}. Supported types: ${this.config.validTypes.join(', ')}`,
        { 
          fileName: file.name, 
          fileType: file.type,
          supportedTypes: this.config.validTypes
        }
      );
    }
  }

  /**
   * Validate file size
   */
  private static validateFileSize(file: File): void {
    if (file.size > this.config.maxSize) {
      const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
      const maxSizeMB = (this.config.maxSize / 1024 / 1024).toFixed(2);
      
      throw new AvatarSyncError(
        AvatarErrorType.FILE_TOO_LARGE,
        `File too large: ${fileSizeMB}MB. Maximum allowed: ${maxSizeMB}MB`,
        { 
          fileName: file.name, 
          fileSize: file.size, 
          maxSize: this.config.maxSize,
          fileSizeMB: parseFloat(fileSizeMB),
          maxSizeMB: parseFloat(maxSizeMB)
        }
      );
    }
  }

  /**
   * Check if file type is valid without throwing
   */
  static isValidFileType(file: File): boolean {
    return this.config.validTypes.includes(file.type);
  }

  /**
   * Check if file size is valid without throwing
   */
  static isValidFileSize(file: File): boolean {
    return file.size <= this.config.maxSize;
  }

  /**
   * Get validation summary for a file
   */
  static getValidationSummary(file: File): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check file type
    if (!this.isValidFileType(file)) {
      errors.push(`Invalid file type: ${file.type}`);
    }

    // Check file size
    if (!this.isValidFileSize(file)) {
      const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
      const maxSizeMB = (this.config.maxSize / 1024 / 1024).toFixed(2);
      errors.push(`File too large: ${fileSizeMB}MB (max: ${maxSizeMB}MB)`);
    }

    // Add warnings for large files that are still valid
    const warningThreshold = this.config.maxSize * 0.8; // 80% of max size
    if (file.size > warningThreshold && file.size <= this.config.maxSize) {
      const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
      warnings.push(`Large file size: ${fileSizeMB}MB. Consider compressing for faster upload.`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
}
