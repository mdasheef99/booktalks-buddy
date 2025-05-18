import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import FormSection from './FormSection';
import EventImageUpload from '@/components/events/EventImageUpload';
import { validateImage } from '@/types/event-images';

interface TempImageSectionProps {
  onImageSelected: (file: File) => void;
  onImageRemoved: () => void;
  selectedFile: File | null;
  className?: string;
}

/**
 * Component for handling temporary image uploads during event creation
 * This component doesn't actually upload the image to storage,
 * it just holds the selected file in memory until the event is created
 */
const TempImageSection: React.FC<TempImageSectionProps> = ({
  onImageSelected,
  onImageRemoved,
  selectedFile,
  className,
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Handle image selection
  const handleImageSelected = (file: File) => {
    // Validate the file
    const validation = validateImage(file);
    if (!validation.isValid) {
      setValidationError(validation.errors.join(' '));
      return;
    }

    // Clear any previous errors
    setValidationError(null);

    // Create preview URL
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    // Call the parent handler
    onImageSelected(file);
  };

  // Handle image removal
  const handleImageRemoved = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    onImageRemoved();
  };

  // Create preview URL when selectedFile changes
  React.useEffect(() => {
    if (selectedFile && !previewUrl) {
      const objectUrl = URL.createObjectURL(selectedFile);
      setPreviewUrl(objectUrl);
    }

    // Cleanup function to revoke object URL
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [selectedFile, previewUrl]);

  return (
    <FormSection title="Event Image">
      <div className="space-y-2">
        <Label htmlFor="event-image">
          Upload an image for your event <span className="text-muted-foreground">(optional)</span>
        </Label>
        <p className="text-sm text-muted-foreground mb-4">
          Adding an image will make your event more engaging. The image will be displayed on the event card and detail page.
        </p>
        <p className="text-sm text-amber-600 mb-4">
          Note: The image will be uploaded after the event is created.
        </p>
        <EventImageUpload
          onImageSelected={handleImageSelected}
          onImageRemoved={handleImageRemoved}
          existingImageUrl={previewUrl}
          error={validationError}
        />
      </div>
    </FormSection>
  );
};

export default TempImageSection;
