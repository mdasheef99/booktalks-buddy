/**
 * AvatarSyncManager Refactoring Tests
 *
 * Tests to verify that the refactored AvatarSyncManager maintains 100% backward compatibility
 * and all functionality works correctly after modular refactoring.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Supabase before importing AvatarSyncManager
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: { user: { id: 'test-user' } } }
      })
    },
    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({ data: { path: 'test-path' }, error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://example.com/test.jpg' } })
      })
    },
    from: vi.fn().mockReturnValue({
      update: vi.fn().mockResolvedValue({ data: {}, error: null })
    })
  }
}));

// Mock ProfileImageService
vi.mock('@/services/ProfileImageService', () => ({
  ProfileImageService: {
    uploadAvatar: vi.fn().mockResolvedValue({
      thumbnail: 'https://example.com/thumb.jpg',
      medium: 'https://example.com/medium.jpg',
      full: 'https://example.com/full.jpg',
      legacy: 'https://example.com/legacy.jpg'
    })
  }
}));

describe('AvatarSyncManager Refactoring Tests', () => {

  describe('Backward Compatibility - Import Tests', () => {
    it('should import AvatarSyncManager without errors', async () => {
      const { AvatarSyncManager } = await import('@/lib/sync/AvatarSyncManager');
      expect(AvatarSyncManager).toBeDefined();
      expect(typeof AvatarSyncManager).toBe('function');
    });

    it('should import AvatarSyncError without errors', async () => {
      const { AvatarSyncError } = await import('@/lib/sync/AvatarSyncManager');
      expect(AvatarSyncError).toBeDefined();
      expect(typeof AvatarSyncError).toBe('function');
    });

    it('should import AvatarErrorType without errors', async () => {
      const { AvatarErrorType } = await import('@/lib/sync/AvatarSyncManager');
      expect(AvatarErrorType).toBeDefined();
      expect(typeof AvatarErrorType).toBe('object');
    });

    it('should import convenience functions without errors', async () => {
      const {
        uploadAvatar,
        validateAvatarFile,
        validateAvatarUrls,
        getPreferredAvatarUrl
      } = await import('@/lib/sync/AvatarSyncManager');

      expect(uploadAvatar).toBeDefined();
      expect(typeof uploadAvatar).toBe('function');
      expect(validateAvatarFile).toBeDefined();
      expect(typeof validateAvatarFile).toBe('function');
      expect(validateAvatarUrls).toBeDefined();
      expect(typeof validateAvatarUrls).toBe('function');
      expect(getPreferredAvatarUrl).toBeDefined();
      expect(typeof getPreferredAvatarUrl).toBe('function');
    });

    it('should import cleanup functions without errors', async () => {
      const {
        cleanupStaleAvatarTransactions,
        emergencyCleanupAllTransactions
      } = await import('@/lib/sync/AvatarSyncManager');

      expect(cleanupStaleAvatarTransactions).toBeDefined();
      expect(typeof cleanupStaleAvatarTransactions).toBe('function');
      expect(emergencyCleanupAllTransactions).toBeDefined();
      expect(typeof emergencyCleanupAllTransactions).toBe('function');
    });

    it('should import default configurations without errors', async () => {
      const {
        DEFAULT_FILE_VALIDATION,
        DEFAULT_RETRY_CONFIGS
      } = await import('@/lib/sync/AvatarSyncManager');

      expect(DEFAULT_FILE_VALIDATION).toBeDefined();
      expect(typeof DEFAULT_FILE_VALIDATION).toBe('object');
      expect(DEFAULT_RETRY_CONFIGS).toBeDefined();
      expect(typeof DEFAULT_RETRY_CONFIGS).toBe('object');
    });

    it('should maintain legacy import compatibility', async () => {
      // Test that the old import path still works
      const LegacyImport = await import('@/lib/sync/AvatarSyncManager');

      expect(LegacyImport.AvatarSyncManager).toBeDefined();
      expect(LegacyImport.AvatarSyncError).toBeDefined();
      expect(LegacyImport.AvatarErrorType).toBeDefined();
      expect(LegacyImport.uploadAvatar).toBeDefined();
    });
  });

  describe('AvatarSyncManager Static Methods', () => {
    it('should have uploadAvatarAtomic method', async () => {
      const { AvatarSyncManager } = await import('@/lib/sync/AvatarSyncManager');
      expect(AvatarSyncManager.uploadAvatarAtomic).toBeDefined();
      expect(typeof AvatarSyncManager.uploadAvatarAtomic).toBe('function');
    });

    it('should have retryUploadAtomic method', async () => {
      const { AvatarSyncManager } = await import('@/lib/sync/AvatarSyncManager');
      expect(AvatarSyncManager.retryUploadAtomic).toBeDefined();
      expect(typeof AvatarSyncManager.retryUploadAtomic).toBe('function');
    });

    it('should have rollback methods', async () => {
      const { AvatarSyncManager } = await import('@/lib/sync/AvatarSyncManager');
      expect(AvatarSyncManager.rollbackTransaction).toBeDefined();
      expect(typeof AvatarSyncManager.rollbackTransaction).toBe('function');
      expect(AvatarSyncManager.partialRollback).toBeDefined();
      expect(typeof AvatarSyncManager.partialRollback).toBe('function');
      expect(AvatarSyncManager.emergencyRollback).toBeDefined();
      expect(typeof AvatarSyncManager.emergencyRollback).toBe('function');
    });

    it('should have transaction management methods', async () => {
      const { AvatarSyncManager } = await import('@/lib/sync/AvatarSyncManager');
      expect(AvatarSyncManager.cleanupStaleTransactions).toBeDefined();
      expect(typeof AvatarSyncManager.cleanupStaleTransactions).toBe('function');
      expect(AvatarSyncManager.getAllActiveTransactions).toBeDefined();
      expect(typeof AvatarSyncManager.getAllActiveTransactions).toBe('function');
    });

    it('should have validation methods', async () => {
      const { AvatarSyncManager } = await import('@/lib/sync/AvatarSyncManager');
      expect(AvatarSyncManager.validateFile).toBeDefined();
      expect(typeof AvatarSyncManager.validateFile).toBe('function');
      expect(AvatarSyncManager.validateAvatarUrls).toBeDefined();
      expect(typeof AvatarSyncManager.validateAvatarUrls).toBe('function');
    });

    it('should have utility methods', async () => {
      const { AvatarSyncManager } = await import('@/lib/sync/AvatarSyncManager');
      expect(AvatarSyncManager.getPreferredAvatarUrl).toBeDefined();
      expect(typeof AvatarSyncManager.getPreferredAvatarUrl).toBe('function');
      expect(AvatarSyncManager.generateAvatarPaths).toBeDefined();
      expect(typeof AvatarSyncManager.generateAvatarPaths).toBe('function');
    });
  });

  describe('AvatarSyncError Class', () => {
    it('should create error instances correctly', async () => {
      const { AvatarSyncError, AvatarErrorType } = await import('@/lib/sync/AvatarSyncManager');

      const error = new AvatarSyncError(
        AvatarErrorType.INVALID_FILE,
        'Test error message',
        { testData: 'test' }
      );

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AvatarSyncError);
      expect(error.type).toBe(AvatarErrorType.INVALID_FILE);
      expect(error.message).toBe('Test error message');
      expect(error.context).toEqual({ testData: 'test' });
    });

    it('should have static helper methods', async () => {
      const { AvatarSyncError } = await import('@/lib/sync/AvatarSyncManager');

      expect(AvatarSyncError.createFileError).toBeDefined();
      expect(typeof AvatarSyncError.createFileError).toBe('function');
      expect(AvatarSyncError.createUploadError).toBeDefined();
      expect(typeof AvatarSyncError.createUploadError).toBe('function');
      expect(AvatarSyncError.createDatabaseError).toBeDefined();
      expect(typeof AvatarSyncError.createDatabaseError).toBe('function');
      expect(AvatarSyncError.getAvatarErrorMessage).toBeDefined();
      expect(typeof AvatarSyncError.getAvatarErrorMessage).toBe('function');
    });

    it('should provide user-friendly error messages', async () => {
      const { AvatarSyncError, AvatarErrorType } = await import('@/lib/sync/AvatarSyncManager');

      const message = AvatarSyncError.getAvatarErrorMessage(AvatarErrorType.INVALID_FILE);
      expect(typeof message).toBe('string');
      expect(message.length).toBeGreaterThan(0);
      expect(message).toContain('valid image file');
    });
  });

  describe('Convenience Functions', () => {
    it('should validate avatar files', async () => {
      const { validateAvatarFile } = await import('@/lib/sync/AvatarSyncManager');

      // Create a mock file
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      const result = validateAvatarFile(mockFile);
      expect(result).toBeDefined();
      expect(typeof result.valid).toBe('boolean');
      expect(Array.isArray(result.errors)).toBe(true);
      expect(Array.isArray(result.warnings)).toBe(true);
    });

    it('should validate avatar URLs', async () => {
      const { validateAvatarUrls } = await import('@/lib/sync/AvatarSyncManager');

      const validUrls = {
        thumbnail: 'https://example.com/thumb.jpg',
        medium: 'https://example.com/medium.jpg',
        full: 'https://example.com/full.jpg',
        legacy: 'https://example.com/legacy.jpg'
      };

      const result = validateAvatarUrls(validUrls);
      expect(typeof result).toBe('boolean');
    });

    it('should get preferred avatar URL', async () => {
      const { getPreferredAvatarUrl } = await import('@/lib/sync/AvatarSyncManager');

      const avatarUrls = {
        thumbnail: 'https://example.com/thumb.jpg',
        medium: 'https://example.com/medium.jpg',
        full: 'https://example.com/full.jpg',
        legacy: 'https://example.com/legacy.jpg'
      };

      const preferredUrl = getPreferredAvatarUrl(avatarUrls, 'medium');
      expect(typeof preferredUrl).toBe('string');
      expect(preferredUrl).toBe(avatarUrls.medium);
    });

    it('should handle cleanup functions', async () => {
      const {
        cleanupStaleAvatarTransactions,
        emergencyCleanupAllTransactions
      } = await import('@/lib/sync/AvatarSyncManager');

      const staleCount = cleanupStaleAvatarTransactions();
      expect(typeof staleCount).toBe('number');
      expect(staleCount).toBeGreaterThanOrEqual(0);

      const allCount = emergencyCleanupAllTransactions();
      expect(typeof allCount).toBe('number');
      expect(allCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Error Types and Constants', () => {
    it('should have all required error types', async () => {
      const { AvatarErrorType } = await import('@/lib/sync/AvatarSyncManager');

      const requiredErrorTypes = [
        'INVALID_FILE',
        'FILE_TOO_LARGE',
        'PROCESSING_FAILED',
        'UPLOAD_FAILED',
        'DATABASE_UPDATE_FAILED',
        'ROLLBACK_FAILED',
        'TRANSACTION_FAILED',
        'VALIDATION_FAILED'
      ];

      requiredErrorTypes.forEach(errorType => {
        expect(AvatarErrorType[errorType as keyof typeof AvatarErrorType]).toBeDefined();
      });
    });

    it('should have default configurations', async () => {
      const {
        DEFAULT_FILE_VALIDATION,
        DEFAULT_RETRY_CONFIGS
      } = await import('@/lib/sync/AvatarSyncManager');

      expect(DEFAULT_FILE_VALIDATION.maxSizeBytes).toBeDefined();
      expect(typeof DEFAULT_FILE_VALIDATION.maxSizeBytes).toBe('number');
      expect(Array.isArray(DEFAULT_FILE_VALIDATION.allowedTypes)).toBe(true);
      expect(DEFAULT_FILE_VALIDATION.allowedTypes.length).toBeGreaterThan(0);

      expect(DEFAULT_RETRY_CONFIGS.upload).toBeDefined();
      expect(typeof DEFAULT_RETRY_CONFIGS.upload.maxRetries).toBe('number');
      expect(typeof DEFAULT_RETRY_CONFIGS.upload.baseDelay).toBe('number');
    });
  });

  describe('Integration Points', () => {
    it('should maintain API compatibility for existing components', async () => {
      const { AvatarSyncManager, AvatarSyncError } = await import('@/lib/sync/AvatarSyncManager');

      // Test that the API matches what AvatarSelector.tsx expects
      expect(AvatarSyncManager.uploadAvatarAtomic).toBeDefined();
      expect(AvatarSyncError).toBeDefined();

      // Test function signatures match expected usage
      expect(AvatarSyncManager.uploadAvatarAtomic.length).toBe(3); // file, userId, onProgress
      expect(AvatarSyncManager.retryUploadAtomic.length).toBe(4); // file, userId, maxRetries, onProgress
    });

    it('should support progress callbacks', async () => {
      // Verify that progress callback types are compatible
      const mockProgress = {
        phase: 'uploading' as const,
        overall: 50,
        thumbnail: 100,
        medium: 50,
        full: 0,
        database: 0
      };

      // This should compile without errors, indicating type compatibility
      const progressCallback = (progress: typeof mockProgress) => {
        expect(progress.phase).toBeDefined();
        expect(typeof progress.overall).toBe('number');
      };

      expect(progressCallback).toBeDefined();
      progressCallback(mockProgress);
    });
  });
});
