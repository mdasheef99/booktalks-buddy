import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ClubPhotoUpload } from '../ClubPhotoUpload';
import { ClubPhotoService } from '@/lib/services/clubPhotoService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// Mock dependencies
vi.mock('@/lib/services/clubPhotoService');
vi.mock('@/contexts/AuthContext');
vi.mock('sonner');

// Mock browser APIs
Object.defineProperty(window, 'URL', {
  value: {
    createObjectURL: vi.fn(() => 'mock-url'),
    revokeObjectURL: vi.fn(),
  },
  writable: true,
});

const mockClubPhotoService = vi.mocked(ClubPhotoService);
const mockUseAuth = vi.mocked(useAuth);
const mockToast = vi.mocked(toast);

describe('ClubPhotoUpload', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com'
  };

  const mockOnUploadComplete = vi.fn();
  const mockOnUploadError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      signOut: vi.fn()
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Creation Mode', () => {
    it('should upload photo successfully in creation mode', async () => {
      const mockResult = {
        coverPhotoUrl: 'https://example.com/photo.jpg',
        coverPhotoThumbnailUrl: 'https://example.com/thumb.jpg',
        uploadedAt: new Date().toISOString(),
        fileSize: 1024
      };

      mockClubPhotoService.uploadClubPhoto.mockResolvedValue(mockResult);

      const { container } = render(
        <ClubPhotoUpload
          mode="creation"
          onUploadComplete={mockOnUploadComplete}
          onUploadError={mockOnUploadError}
        />
      );

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      const input = container.querySelector('input[type="file"]') as HTMLInputElement;

      // Simulate file selection
      Object.defineProperty(input, 'files', {
        value: [file],
        writable: false,
      });

      fireEvent.change(input);

      await waitFor(() => {
        expect(mockClubPhotoService.uploadClubPhoto).toHaveBeenCalledWith({
          file,
          clubId: 'temp',
          userId: mockUser.id
        });
      });

      expect(mockOnUploadComplete).toHaveBeenCalledWith(mockResult);
      expect(mockToast.success).toHaveBeenCalledWith('Photo uploaded successfully');
    });

    it('should handle upload error in creation mode', async () => {
      const errorMessage = 'Upload failed';
      mockClubPhotoService.uploadClubPhoto.mockRejectedValue(new Error(errorMessage));

      render(
        <ClubPhotoUpload
          mode="creation"
          onUploadComplete={mockOnUploadComplete}
          onUploadError={mockOnUploadError}
        />
      );

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(mockOnUploadError).toHaveBeenCalledWith(errorMessage);
      });

      expect(mockToast.error).toHaveBeenCalledWith('Failed to upload photo');
    });
  });

  describe('Management Mode', () => {
    const clubId = 'club-123';

    it('should upload photo successfully in management mode', async () => {
      const mockResult = {
        coverPhotoUrl: 'https://example.com/photo.jpg',
        coverPhotoThumbnailUrl: 'https://example.com/thumb.jpg',
        uploadedAt: new Date().toISOString(),
        fileSize: 1024
      };

      mockClubPhotoService.uploadClubPhoto.mockResolvedValue(mockResult);

      render(
        <ClubPhotoUpload
          mode="management"
          clubId={clubId}
          onUploadComplete={mockOnUploadComplete}
          onUploadError={mockOnUploadError}
        />
      );

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(mockClubPhotoService.uploadClubPhoto).toHaveBeenCalledWith({
          file,
          clubId,
          userId: mockUser.id
        });
      });

      expect(mockOnUploadComplete).toHaveBeenCalledWith(mockResult);
    });

    it('should require clubId in management mode', () => {
      render(
        <ClubPhotoUpload
          mode="management"
          onUploadComplete={mockOnUploadComplete}
          onUploadError={mockOnUploadError}
        />
      );

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      fireEvent.change(input, { target: { files: [file] } });

      expect(mockOnUploadError).toHaveBeenCalledWith('Club ID required for photo management');
    });
  });

  describe('Authentication', () => {
    it('should handle unauthenticated user', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        signOut: vi.fn()
      });

      render(
        <ClubPhotoUpload
          mode="creation"
          onUploadComplete={mockOnUploadComplete}
          onUploadError={mockOnUploadError}
        />
      );

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      fireEvent.change(input, { target: { files: [file] } });

      expect(mockOnUploadError).toHaveBeenCalledWith('User not authenticated');
    });
  });

  describe('File Validation', () => {
    it('should handle file size validation', async () => {
      const errorMessage = 'File size must be less than 3MB';
      mockClubPhotoService.uploadClubPhoto.mockRejectedValue(new Error(errorMessage));

      render(
        <ClubPhotoUpload
          mode="creation"
          onUploadComplete={mockOnUploadComplete}
          onUploadError={mockOnUploadError}
        />
      );

      // Create a large file (4MB)
      const largeFile = new File(['x'.repeat(4 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      fireEvent.change(input, { target: { files: [largeFile] } });

      await waitFor(() => {
        expect(mockOnUploadError).toHaveBeenCalledWith(errorMessage);
      });
    });

    it('should handle invalid file type', async () => {
      const errorMessage = 'Only JPEG, PNG, and WebP images are allowed';
      mockClubPhotoService.uploadClubPhoto.mockRejectedValue(new Error(errorMessage));

      render(
        <ClubPhotoUpload
          mode="creation"
          onUploadComplete={mockOnUploadComplete}
          onUploadError={mockOnUploadError}
        />
      );

      const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      fireEvent.change(input, { target: { files: [invalidFile] } });

      await waitFor(() => {
        expect(mockOnUploadError).toHaveBeenCalledWith(errorMessage);
      });
    });
  });

  describe('Progress Tracking', () => {
    it('should show upload progress', async () => {
      mockClubPhotoService.uploadClubPhoto.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({
          coverPhotoUrl: 'https://example.com/photo.jpg',
          coverPhotoThumbnailUrl: 'https://example.com/thumb.jpg',
          uploadedAt: new Date().toISOString(),
          fileSize: 1024
        }), 100))
      );

      render(
        <ClubPhotoUpload
          mode="creation"
          onUploadComplete={mockOnUploadComplete}
          onUploadError={mockOnUploadError}
        />
      );

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      fireEvent.change(input, { target: { files: [file] } });

      // Should show uploading state
      expect(screen.getByText(/uploading/i)).toBeInTheDocument();

      await waitFor(() => {
        expect(mockOnUploadComplete).toHaveBeenCalled();
      });
    });
  });
});
