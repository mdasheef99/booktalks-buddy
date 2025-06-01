import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Download, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getBestAvatarUrl, getUserInitials } from '@/utils/avatarUtils';
import type { UserProfile } from '@/services/profileService';

interface ProfileImageModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  
  /** Function to close the modal */
  onClose: () => void;
  
  /** User profile data */
  profile: UserProfile | null;
  
  /** Additional CSS classes */
  className?: string;
}

export const ProfileImageModal: React.FC<ProfileImageModalProps> = ({
  isOpen,
  onClose,
  profile,
  className
}) => {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  // Get the best available image URL
  const bestImageUrl = getBestAvatarUrl(profile);
  
  // User display name for accessibility and fallback
  const displayName = profile?.displayname || profile?.username || 'User';
  const userInitials = getUserInitials(profile);

  // Reset states when modal opens/closes or profile changes
  useEffect(() => {
    if (isOpen && bestImageUrl) {
      setImageLoading(true);
      setImageError(false);
      setImageUrl(bestImageUrl);
    } else {
      setImageLoading(false);
      setImageError(false);
      setImageUrl(null);
    }
  }, [isOpen, bestImageUrl, profile?.id]);

  // Handle image load success
  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
  };

  // Handle image load error
  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
  };

  // Handle download image
  const handleDownload = async () => {
    if (!imageUrl) return;
    
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${profile?.username || 'profile'}-avatar.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading image:', error);
    }
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Don't render if no profile
  if (!profile) {
    return null;
  }

  // If modal is open but no image available, show a message
  const hasImage = !!bestImageUrl;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className={cn(
          "max-w-4xl w-full max-h-[90vh] p-0 overflow-hidden bg-black/95 border-none",
          className
        )}
        aria-describedby="profile-image-description"
      >
        <DialogHeader className="absolute top-0 left-0 right-0 z-10 bg-black/50 backdrop-blur-sm p-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-white text-lg font-medium">
              {displayName}'s Profile Picture
            </DialogTitle>
            
            <div className="flex items-center gap-2">
              {/* Download button */}
              {hasImage && imageUrl && !imageError && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDownload}
                  className="text-white hover:bg-white/20 h-8 w-8 p-0"
                  aria-label="Download profile picture"
                >
                  <Download className="h-4 w-4" />
                </Button>
              )}
              
              {/* Close button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-white hover:bg-white/20 h-8 w-8 p-0"
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Hidden description for screen readers */}
        <div id="profile-image-description" className="sr-only">
          Full size profile picture of {displayName}. Press Escape to close.
        </div>

        {/* Image container */}
        <div className="relative flex items-center justify-center min-h-[400px] max-h-[80vh] p-4 pt-16">
          {hasImage && imageLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3 text-white/70">
                <div className="h-8 w-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span className="text-sm">Loading image...</span>
              </div>
            </div>
          )}

          {!hasImage || imageError ? (
            <div className="flex flex-col items-center gap-4 text-white/70 max-w-sm text-center">
              <div className="h-32 w-32 rounded-full bg-white/10 flex items-center justify-center">
                <User className="h-16 w-16 text-white/50" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-white mb-2">
                  {!hasImage ? 'No profile picture' : 'Image not available'}
                </h3>
                <p className="text-sm text-white/60">
                  {!hasImage
                    ? `${displayName} hasn't uploaded a profile picture yet.`
                    : 'The profile picture could not be loaded. It may have been removed or there might be a connection issue.'
                  }
                </p>
              </div>
            </div>
          ) : (
            imageUrl && (
              <img
                src={imageUrl}
                alt={`${displayName}'s profile picture`}
                className={cn(
                  "max-w-full max-h-full object-contain rounded-lg shadow-2xl transition-opacity duration-300",
                  imageLoading ? "opacity-0" : "opacity-100"
                )}
                onLoad={handleImageLoad}
                onError={handleImageError}
                style={{
                  maxHeight: 'calc(80vh - 4rem)', // Account for header and padding
                }}
              />
            )
          )}
        </div>

        {/* Click outside to close overlay */}
        <div 
          className="absolute inset-0 -z-10" 
          onClick={onClose}
          aria-label="Click to close modal"
        />
      </DialogContent>
    </Dialog>
  );
};

export default ProfileImageModal;
