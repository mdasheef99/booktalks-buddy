import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import FormSection from './FormSection';
import EventImageUpload from '@/components/events/EventImageUpload';
import { uploadEventImage, removeEventImage } from '@/lib/api/bookclubs/events/images';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ImageSectionProps {
  eventId?: string;
  imageUrl: string | null;
  thumbnailUrl: string | null;
  imageAltText: string | null;
  onImageUploaded: (imageUrl: string, thumbnailUrl: string, mediumUrl: string) => void;
  onImageRemoved: () => void;
}

const ImageSection: React.FC<ImageSectionProps> = ({
  eventId,
  imageUrl,
  thumbnailUrl,
  imageAltText,
  onImageUploaded,
  onImageRemoved,
}) => {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);

  // Handle image selection
  const handleImageSelected = async (file: File) => {
    if (!user?.id || !eventId) {
      toast.error('You must be logged in and have an event ID to upload images');
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadProgress(0);

    try {
      // Upload the image
      const imageData = await uploadEventImage(
        user.id,
        eventId,
        file,
        imageAltText || file.name,
        (progress) => setUploadProgress(progress)
      );

      // Update the form state with the new image URLs
      onImageUploaded(
        imageData.imageUrl,
        imageData.thumbnailUrl,
        imageData.mediumUrl
      );

      toast.success('Image uploaded successfully');
    } catch (error: any) {
      console.error('Error uploading image:', error);
      setUploadError(error.message || 'Failed to upload image');
      toast.error('Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  // Handle image removal
  const handleImageRemoved = async () => {
    if (!user?.id || !eventId) {
      toast.error('You must be logged in and have an event ID to remove images');
      return;
    }

    setShowRemoveDialog(false);
    setIsUploading(true);

    try {
      // Remove the image
      await removeEventImage(user.id, eventId);

      // Update the form state
      onImageRemoved();

      toast.success('Image removed successfully');
    } catch (error: any) {
      console.error('Error removing image:', error);
      toast.error(error.message || 'Failed to remove image');
    } finally {
      setIsUploading(false);
    }
  };

  // Show confirmation dialog before removing image
  const confirmImageRemoval = () => {
    if (imageUrl) {
      setShowRemoveDialog(true);
    } else {
      onImageRemoved();
    }
  };

  return (
    <>
      <FormSection title="Event Image">
        <div className="space-y-2">
          <Label htmlFor="event-image">
            Upload an image for your event <span className="text-muted-foreground">(optional)</span>
          </Label>
          <p className="text-sm text-muted-foreground mb-4">
            Adding an image will make your event more engaging. The image will be displayed on the event card and detail page.
          </p>
          <EventImageUpload
            onImageSelected={handleImageSelected}
            onImageRemoved={confirmImageRemoval}
            existingImageUrl={imageUrl}
            isUploading={isUploading}
            uploadProgress={uploadProgress}
            error={uploadError}
          />
        </div>
      </FormSection>

      {/* Confirmation dialog for image removal */}
      <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Event Image</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this image? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleImageRemoved}>
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ImageSection;
