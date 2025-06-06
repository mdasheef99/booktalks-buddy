import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ClubPhotoService } from '../clubPhotoService';
import { supabase } from '@/lib/supabase';
import { ImageUploadService } from '../imageUpload';

// Mock dependencies
vi.mock('@/lib/supabase');
vi.mock('../imageUpload');

const mockSupabase = vi.mocked(supabase);
const mockImageUploadService = vi.mocked(ImageUploadService);

describe('ClubPhotoService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('uploadClubPhoto', () => {
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const mockUserId = 'user-123';
    const mockClubId = 'club-123';

    it('should upload photo successfully in management mode', async () => {
      // Mock club lead validation
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { lead_user_id: mockUserId }
            })
          })
        })
      } as any);

      // Mock image upload
      const mockUploadResult = {
        url: 'https://example.com/photo.jpg',
        path: 'club-123/photo.jpg',
        size: 1024,
        type: 'image/jpeg'
      };
      mockImageUploadService.uploadImage.mockResolvedValue(mockUploadResult);

      const result = await ClubPhotoService.uploadClubPhoto({
        file: mockFile,
        clubId: mockClubId,
        userId: mockUserId
      });

      expect(result).toEqual({
        coverPhotoUrl: expect.stringContaining('photo.jpg'),
        coverPhotoThumbnailUrl: expect.stringContaining('photo.jpg'),
        uploadedAt: expect.any(String),
        fileSize: expect.any(Number)
      });
    });

    it('should upload photo successfully in creation mode', async () => {
      // Mock image upload for creation mode (temp clubId)
      const mockUploadResult = {
        url: 'https://example.com/photo.jpg',
        path: 'avatars/temp-photo.jpg',
        size: 1024,
        type: 'image/jpeg'
      };
      mockImageUploadService.uploadImage.mockResolvedValue(mockUploadResult);

      const result = await ClubPhotoService.uploadClubPhoto({
        file: mockFile,
        clubId: 'temp',
        userId: mockUserId
      });

      expect(result).toEqual({
        coverPhotoUrl: expect.stringContaining('photo.jpg'),
        coverPhotoThumbnailUrl: expect.stringContaining('photo.jpg'),
        uploadedAt: expect.any(String),
        fileSize: expect.any(Number),
        tempBucket: 'profiles'
      });
    });

    it('should reject unauthorized user in management mode', async () => {
      // Mock club lead validation failure
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { lead_user_id: 'different-user' }
            })
          })
        })
      } as any);

      await expect(
        ClubPhotoService.uploadClubPhoto({
          file: mockFile,
          clubId: mockClubId,
          userId: mockUserId
        })
      ).rejects.toThrow('Only club leads can manage club photos');
    });

    it('should validate file size', async () => {
      const largeFile = new File(['x'.repeat(4 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });

      await expect(
        ClubPhotoService.uploadClubPhoto({
          file: largeFile,
          clubId: 'temp',
          userId: mockUserId
        })
      ).rejects.toThrow('File size must be less than 3MB');
    });

    it('should validate file type', async () => {
      const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' });

      await expect(
        ClubPhotoService.uploadClubPhoto({
          file: invalidFile,
          clubId: 'temp',
          userId: mockUserId
        })
      ).rejects.toThrow('Only JPEG, PNG, and WebP images are allowed');
    });
  });

  describe('movePhotosToClubFolder', () => {
    const mockClubId = 'club-123';
    const mockPhotoData = {
      coverPhotoUrl: 'https://example.com/storage/v1/object/public/profiles/avatars/temp-main.jpg',
      coverPhotoThumbnailUrl: 'https://example.com/storage/v1/object/public/profiles/avatars/temp-thumb.jpg',
      uploadedAt: new Date().toISOString(),
      fileSize: 1024,
      tempBucket: 'profiles'
    };

    it('should move photos from profiles to club-photos bucket', async () => {
      // Mock download from profiles bucket
      mockSupabase.storage.from.mockImplementation((bucket) => {
        if (bucket === 'profiles') {
          return {
            download: vi.fn().mockResolvedValue({
              data: new Blob(['test']),
              error: null
            })
          };
        }
        if (bucket === 'club-photos') {
          return {
            upload: vi.fn().mockResolvedValue({ error: null }),
            getPublicUrl: vi.fn().mockReturnValue({
              data: { publicUrl: `https://example.com/club-photos/${mockClubId}/photo.jpg` }
            })
          };
        }
        return {};
      } as any);

      // Mock database update
      mockSupabase.from.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockResolvedValue({
              data: [{ id: mockClubId }],
              error: null
            })
          })
        })
      } as any);

      const result = await ClubPhotoService.movePhotosToClubFolder(mockClubId, mockPhotoData);

      expect(result.coverPhotoUrl).toContain('club-photos');
      expect(result.coverPhotoThumbnailUrl).toContain('club-photos');
    });

    it('should handle download errors', async () => {
      mockSupabase.storage.from.mockReturnValue({
        download: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'File not found' }
        })
      } as any);

      await expect(
        ClubPhotoService.movePhotosToClubFolder(mockClubId, mockPhotoData)
      ).rejects.toThrow('Failed to download main image: File not found');
    });

    it('should handle upload errors', async () => {
      // Mock successful download
      mockSupabase.storage.from.mockImplementation((bucket) => {
        if (bucket === 'profiles') {
          return {
            download: vi.fn().mockResolvedValue({
              data: new Blob(['test']),
              error: null
            })
          };
        }
        if (bucket === 'club-photos') {
          return {
            upload: vi.fn().mockResolvedValue({
              error: { message: 'Upload failed' }
            })
          };
        }
        return {};
      } as any);

      await expect(
        ClubPhotoService.movePhotosToClubFolder(mockClubId, mockPhotoData)
      ).rejects.toThrow('Failed to upload main image: Upload failed');
    });
  });

  describe('updateClubPhotoInDatabase', () => {
    const mockClubId = 'club-123';
    const mockPhotoData = {
      coverPhotoUrl: 'https://example.com/photo.jpg',
      coverPhotoThumbnailUrl: 'https://example.com/thumb.jpg',
      uploadedAt: new Date().toISOString(),
      fileSize: 1024
    };

    it('should update database successfully', async () => {
      mockSupabase.from.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockResolvedValue({
              data: [{ id: mockClubId }],
              error: null
            })
          })
        })
      } as any);

      await expect(
        ClubPhotoService.updateClubPhotoInDatabase(mockClubId, mockPhotoData)
      ).resolves.not.toThrow();
    });

    it('should handle database errors', async () => {
      mockSupabase.from.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' }
            })
          })
        })
      } as any);

      await expect(
        ClubPhotoService.updateClubPhotoInDatabase(mockClubId, mockPhotoData)
      ).rejects.toThrow('Failed to update club photo: Database error');
    });
  });

  describe('deleteClubPhoto', () => {
    const mockClubId = 'club-123';
    const mockUserId = 'user-123';

    it('should delete photo successfully', async () => {
      // Mock permission validation
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'book_clubs') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    lead_user_id: mockUserId,
                    cover_photo_url: 'https://example.com/photo.jpg',
                    cover_photo_thumbnail_url: 'https://example.com/thumb.jpg'
                  }
                })
              })
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null })
            })
          };
        }
        return {};
      } as any);

      // Mock storage deletion
      mockSupabase.storage.from.mockReturnValue({
        remove: vi.fn().mockResolvedValue({ error: null })
      } as any);

      await expect(
        ClubPhotoService.deleteClubPhoto(mockClubId, mockUserId)
      ).resolves.not.toThrow();
    });

    it('should reject unauthorized deletion', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { lead_user_id: 'different-user' }
            })
          })
        })
      } as any);

      await expect(
        ClubPhotoService.deleteClubPhoto(mockClubId, mockUserId)
      ).rejects.toThrow('Only club leads can manage club photos');
    });
  });
});
