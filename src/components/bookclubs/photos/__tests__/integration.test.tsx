import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CreateBookClubForm } from '@/components/bookclubs/CreateBookClubForm';
import { ClubSettingsPanel } from '@/components/bookclubs/management/ClubSettingsPanel';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock dependencies
vi.mock('@/lib/supabase');
vi.mock('@/contexts/AuthContext');
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useParams: () => ({ clubId: 'test-club-123' })
}));

const mockSupabase = vi.mocked(supabase);
const mockUseAuth = vi.mocked(useAuth);

describe('Club Photo Integration Tests', () => {
  let queryClient: QueryClient;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com'
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });

    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      signOut: vi.fn()
    });

    // Mock successful storage operations
    mockSupabase.storage.from.mockReturnValue({
      upload: vi.fn().mockResolvedValue({ error: null }),
      download: vi.fn().mockResolvedValue({
        data: new Blob(['test']),
        error: null
      }),
      getPublicUrl: vi.fn().mockReturnValue({
        data: { publicUrl: 'https://example.com/photo.jpg' }
      }),
      remove: vi.fn().mockResolvedValue({ error: null })
    } as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const renderWithQueryClient = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    );
  };

  describe('Club Creation with Photo', () => {
    it('should create club with photo successfully', async () => {
      // Mock club creation
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'book_clubs') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: 'new-club-123',
                    name: 'Test Club',
                    lead_user_id: mockUser.id
                  },
                  error: null
                })
              })
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockResolvedValue({
                  data: [{ id: 'new-club-123' }],
                  error: null
                })
              })
            })
          };
        }
        if (table === 'book_club_members') {
          return {
            insert: vi.fn().mockResolvedValue({ error: null })
          };
        }
        return {};
      } as any);

      renderWithQueryClient(<CreateBookClubForm />);

      // Fill in club details
      fireEvent.change(screen.getByLabelText(/club name/i), {
        target: { value: 'Test Club' }
      });
      fireEvent.change(screen.getByLabelText(/description/i), {
        target: { value: 'Test Description' }
      });

      // Upload photo
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const photoInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      fireEvent.change(photoInput, { target: { files: [file] } });

      // Submit form
      const submitButton = screen.getByRole('button', { name: /create club/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        // Verify club creation was called
        expect(mockSupabase.from).toHaveBeenCalledWith('book_clubs');
        
        // Verify photo upload to profiles bucket (temp storage)
        expect(mockSupabase.storage.from).toHaveBeenCalledWith('profiles');
        
        // Verify photo move to club-photos bucket
        expect(mockSupabase.storage.from).toHaveBeenCalledWith('club-photos');
      });
    });

    it('should handle photo upload failure gracefully', async () => {
      // Mock storage upload failure
      mockSupabase.storage.from.mockReturnValue({
        upload: vi.fn().mockResolvedValue({
          error: { message: 'Storage error' }
        })
      } as any);

      // Mock successful club creation
      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'new-club-123' },
              error: null
            })
          })
        })
      } as any);

      renderWithQueryClient(<CreateBookClubForm />);

      // Fill form and upload photo
      fireEvent.change(screen.getByLabelText(/club name/i), {
        target: { value: 'Test Club' }
      });

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const photoInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      fireEvent.change(photoInput, { target: { files: [file] } });

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/failed to upload photo/i)).toBeInTheDocument();
      });
    });
  });

  describe('Club Management Photo Upload', () => {
    it('should upload photo in management mode successfully', async () => {
      // Mock club data fetch
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'book_clubs') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: 'test-club-123',
                    name: 'Test Club',
                    lead_user_id: mockUser.id,
                    cover_photo_url: null
                  },
                  error: null
                })
              })
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockResolvedValue({
                  data: [{ id: 'test-club-123' }],
                  error: null
                })
              })
            })
          };
        }
        return {};
      } as any);

      renderWithQueryClient(<ClubSettingsPanel />);

      // Upload photo
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const photoInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      fireEvent.change(photoInput, { target: { files: [file] } });

      await waitFor(() => {
        // Verify permission check
        expect(mockSupabase.from).toHaveBeenCalledWith('book_clubs');
        
        // Verify direct upload to club-photos bucket
        expect(mockSupabase.storage.from).toHaveBeenCalledWith('club-photos');
        
        // Verify database update
        expect(mockSupabase.from().update).toHaveBeenCalled();
      });
    });

    it('should prevent unauthorized photo upload', async () => {
      // Mock permission check failure
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { lead_user_id: 'different-user' },
              error: null
            })
          })
        })
      } as any);

      renderWithQueryClient(<ClubSettingsPanel />);

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const photoInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      fireEvent.change(photoInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText(/only club leads can manage club photos/i)).toBeInTheDocument();
      });
    });
  });

  describe('Photo Display and Management', () => {
    it('should display existing club photo', async () => {
      const mockPhotoUrl = 'https://example.com/club-photo.jpg';
      
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'test-club-123',
                cover_photo_url: mockPhotoUrl,
                cover_photo_thumbnail_url: 'https://example.com/thumb.jpg'
              },
              error: null
            })
          })
        })
      } as any);

      renderWithQueryClient(<ClubSettingsPanel />);

      await waitFor(() => {
        const photoImage = screen.getByRole('img');
        expect(photoImage).toHaveAttribute('src', mockPhotoUrl);
      });
    });

    it('should delete club photo successfully', async () => {
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'book_clubs') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: 'test-club-123',
                    lead_user_id: mockUser.id,
                    cover_photo_url: 'https://example.com/photo.jpg',
                    cover_photo_thumbnail_url: 'https://example.com/thumb.jpg'
                  },
                  error: null
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

      renderWithQueryClient(<ClubSettingsPanel />);

      // Click delete button
      const deleteButton = screen.getByRole('button', { name: /delete photo/i });
      fireEvent.click(deleteButton);

      await waitFor(() => {
        // Verify storage deletion
        expect(mockSupabase.storage.from().remove).toHaveBeenCalled();
        
        // Verify database update
        expect(mockSupabase.from().update).toHaveBeenCalledWith({
          cover_photo_url: null,
          cover_photo_thumbnail_url: null,
          cover_photo_updated_at: expect.any(String)
        });
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      // Mock network error
      mockSupabase.storage.from.mockReturnValue({
        upload: vi.fn().mockRejectedValue(new Error('Network error'))
      } as any);

      renderWithQueryClient(<CreateBookClubForm />);

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const photoInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      fireEvent.change(photoInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });
    });

    it('should handle storage quota exceeded', async () => {
      mockSupabase.storage.from.mockReturnValue({
        upload: vi.fn().mockResolvedValue({
          error: { message: 'Storage quota exceeded' }
        })
      } as any);

      renderWithQueryClient(<CreateBookClubForm />);

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const photoInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      fireEvent.change(photoInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText(/storage quota exceeded/i)).toBeInTheDocument();
      });
    });
  });
});
